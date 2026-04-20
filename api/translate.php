<?php
header('Content-Type: application/json');
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

require_once 'config.php';
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));
$post_id = $data->post_id ?? null;

if (!$post_id) {
    echo json_encode(['error' => 'Missing post_id']);
    exit;
}

// Get AI setup
$stmtSettings = $db->query("SELECT setting_key, setting_value FROM settings");
$settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
$AI_API_KEY = $settings['ai_api_key'] ?? '';

if (empty($AI_API_KEY)) {
    echo json_encode(['error' => 'Chưa cấu hình AI API Key trong phần Cài đặt.']);
    exit;
}

// Fetch Original Post
$stmt = $db->prepare("SELECT title, excerpt, content FROM posts WHERE id = ?");
$stmt->execute([$post_id]);
$post = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$post) {
    echo json_encode(['error' => 'Post not found.']);
    exit;
}

$languages = [
    'en' => 'English',
    'fr' => 'French',
    'ja' => 'Japanese'
];

$errors = [];
$successCount = 0;

foreach ($languages as $code => $langName) {
    // Check if translation already exists to skip or overwrite, for now we will overwrite
    $prompt = "
Role: Expert multi-lingual technical translator.
Task: Translate the following blog article into $langName. Maintain HTML formatting, links, and SEO technical accuracy exactly as the source. 
Return ONLY a raw JSON object containing the translated text without markdown wrappers.

Source text:
Title: {$post['title']}
Excerpt: {$post['excerpt']}
Content: {$post['content']}

Format exactly:
{
    \"title\": \"Translated title\",
    \"excerpt\": \"Translated excerpt\",
    \"content\": \"Translated content HTML\"
}";

    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $AI_API_KEY,
        'HTTP-Referer: https://nguyenvanhao.name.vn',
        'X-Title: Hao Blog Translater'
    ]);
    
    // Using gemini-2.5-flash which is fast and supports JSON. Adjusting to a reliable model used in Hao Blog.
    $payload = json_encode([
        'model' => 'google/gemini-2.5-flash',
        'response_format' => ['type' => 'json_object'],
        'messages' => [
            ['role' => 'user', 'content' => $prompt]
        ]
    ]);
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60 seconds per lang
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200 && $response) {
        $result = json_decode($response, true);
        if (isset($result['choices'][0]['message']['content'])) {
            $aiText = trim($result['choices'][0]['message']['content']);
            // Remove markdown format if AI ignores it
            $aiText = preg_replace('/^```json\s*/', '', $aiText);
            $aiText = preg_replace('/```$/', '', $aiText);

            $translated = json_decode($aiText, true);
            if ($translated && !empty($translated['title'])) {
                // Insert into DB
                $insert = $db->prepare("
                    INSERT INTO post_translations (post_id, lang, title, excerpt, content, translated_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        title = VALUES(title),
                        excerpt = VALUES(excerpt),
                        content = VALUES(content),
                        translated_at = NOW()
                ");
                $insert->execute([
                    $post_id, 
                    $code, 
                    $translated['title'], 
                    $translated['excerpt'] ?? '', 
                    $translated['content'] ?? ''
                ]);
                $successCount++;
            } else {
                $errors[] = "$langName parse failed.";
            }
        } else {
            $errors[] = "$langName AI content empty.";
        }
    } else {
        $errors[] = "$langName network/auth error. HTTP: $httpCode";
    }
}

if ($successCount > 0) {
    echo json_encode(['success' => true, 'message' => "Translated into $successCount languages successfully.", 'errors' => $errors]);
} else {
    echo json_encode(['error' => 'Translation failed for all languages.', 'details' => $errors]);
}
?>
