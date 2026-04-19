<?php
ini_set('max_execution_time', 300); // Allow long execution for AI
require_once 'db.php';

// Setup DB and get settings
$database = new Database();
$db = $database->getConnection();
$stmt = $db->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('telegram_bot_token', 'telegram_chat_id', 'ai_api_key')");
$settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

$BOT_TOKEN = $settings['telegram_bot_token'] ?? '';
$ADMIN_CHAT_ID = $settings['telegram_chat_id'] ?? '';
$AI_API_KEY = $settings['ai_api_key'] ?? '';

// End gracefully if setup is missing (so telegram doesn't keep retrying errors)
if (empty($BOT_TOKEN) || empty($ADMIN_CHAT_ID)) {
    http_response_code(200);
    echo "Webhook not fully configured.";
    exit;
}

// Helper: Send Telegram Message
function sendTelegramMessage($chat_id, $text, $replyMarkup = null) {
    global $BOT_TOKEN;
    $url = "https://api.telegram.org/bot" . $BOT_TOKEN . "/sendMessage";
    $postData = [
        'chat_id' => $chat_id,
        'text' => $text,
        'parse_mode' => 'HTML'
    ];
    if ($replyMarkup) {
        $postData['reply_markup'] = json_encode($replyMarkup);
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}

// Helper: Edit Telegram Message
function editTelegramMessage($chat_id, $message_id, $text, $replyMarkup = null) {
    global $BOT_TOKEN;
    $url = "https://api.telegram.org/bot" . $BOT_TOKEN . "/editMessageText";
    $postData = [
        'chat_id' => $chat_id,
        'message_id' => $message_id,
        'text' => $text,
        'parse_mode' => 'HTML'
    ];
    if ($replyMarkup) {
        $postData['reply_markup'] = json_encode($replyMarkup);
    }
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}

// Receive Webhook payload
$content = file_get_contents("php://input");
$update = json_decode($content, true);

if (!$update) {
    http_response_code(200);
    exit;
}

// -----------------------------------------------------------------------------------
// 1. Process Callback Queries (Button Clicks)
// -----------------------------------------------------------------------------------
if (isset($update['callback_query'])) {
    $cq = $update['callback_query'];
    $chatId = $cq['message']['chat']['id'] ?? '';
    $messageId = $cq['message']['message_id'] ?? '';
    $data = $cq['data'] ?? '';

    // Verify Admin
    if ($chatId != $ADMIN_CHAT_ID) {
        http_response_code(200); exit;
    }

    $parts = explode(':', $data);
    $action = $parts[0];
    $postId = $parts[1] ?? 0;

    if (!$postId) {
        http_response_code(200); exit;
    }

    try {
        if ($action === 'publish') {
            $stmt = $db->prepare("UPDATE posts SET is_published = 1, scheduled_at = NULL WHERE id = ?");
            $stmt->execute([$postId]);
            editTelegramMessage($chatId, $messageId, "✅ <b>Đã xuất bản!</b> Bài viết #{$postId} đã lên sóng.");
            
        } elseif ($action === 'schedule') {
            // Schedule 2 hours from now
            $scheduleTime = date('Y-m-d H:i:s', strtotime('+2 hours'));
            $stmt = $db->prepare("UPDATE posts SET is_published = 0, scheduled_at = ? WHERE id = ?");
            $stmt->execute([$scheduleTime, $postId]);
            editTelegramMessage($chatId, $messageId, "⏰ <b>Đã lên lịch!</b> Bài viết #{$postId} sẽ tự đăng vào {$scheduleTime}.");
            
        } elseif ($action === 'preview') {
            // Just send the link
            $stmt = $db->prepare("SELECT slug FROM posts WHERE id = ?");
            $stmt->execute([$postId]);
            $slug = $stmt->fetchColumn();
            if ($slug) {
                sendTelegramMessage($chatId, "👁️ Xem trước: https://nguyenvanhao.name.vn/blog/{$slug}");
            }
            
        } elseif ($action === 'discard') {
            $stmt = $db->prepare("DELETE FROM posts WHERE id = ?");
            $stmt->execute([$postId]);
            editTelegramMessage($chatId, $messageId, "🗑️ <b>Đã xóa bỏ</b> bản nháp #{$postId}.");
        }
    } catch (Exception $e) {
        sendTelegramMessage($chatId, "Lỗi Database: " . $e->getMessage());
    }
    
    http_response_code(200);
    exit;
}

// -----------------------------------------------------------------------------------
// 2. Process Messages
// -----------------------------------------------------------------------------------
if (isset($update['message'])) {
    $msg = $update['message'];
    $chatId = $msg['chat']['id'] ?? '';
    $text = trim($msg['text'] ?? '');

    // Prevent random users
    if ($chatId != $ADMIN_CHAT_ID) {
        sendTelegramMessage($chatId, "⛔ Bạn không có quyền sử dụng Bot này. Chat ID của bạn là: " . $chatId);
        http_response_code(200);
        exit;
    }

    if (empty($text)) {
        http_response_code(200);
        exit;
    }

    // Command Check
    if ($text === '/start') {
        sendTelegramMessage($chatId, "👋 <b>Hao Blog AI Bot</b>\nHãy gửi đường link bài viết, tôi sẽ cào dữ liệu và soạn nháp một bài Blog mới chuẩn SEO!");
        http_response_code(200);
        exit;
    }

    // Process if it's a URL or keyword
    // A simple URL check
    $isUrl = preg_match('/^https?:\/\//i', $text);
    
    // Immediate acknowledgement
    sendTelegramMessage($chatId, "⏳ Đang phân tích nội dung và bắt đầu viết bài... (quá trình này có thể mất ~30 giây)");
    
    // Optionally background execution logic could be here, but PHP limits it. 
    // Usually webhook might timeout if > 30s. We'll pray OpenRouter is fast (usually 10-15s).
    
    try {
        // Scrape content if URL
        $sourceText = $text;
        if ($isUrl) {
            $res = file_get_contents("https://api.allorigins.win/get?url=" . urlencode($text));
            if ($res) {
                $scrapData = json_decode($res, true);
                if (!empty($scrapData['contents'])) {
                    $html = $scrapData['contents'];
                    // Clean HTML
                    $html = preg_replace('@<(script|style|nav|footer|header|aside)[^>]*?>.*?</\1>@si', '', $html);
                    $sourceText = strip_tags($html);
                    $sourceText = preg_replace('/\s+/', ' ', $sourceText);
                    $sourceText = substr($sourceText, 0, 30000);
                }
            }
        }

        if (empty($AI_API_KEY)) {
            sendTelegramMessage($chatId, "❌ Lỗi: Chưa cấu hình OpenRouter API Key trong Admin Settings.");
            exit;
        }

        // Prepare Prompt
        $prompt = "
Role: Senior SEO Content Specialist & On-Page SEO Expert focused on the Vietnamese market.
Task: Analyze the following source content and rewrite it into a highly engaging, top-ranking SEO blog post for 'nguyenvanhao.name.vn'. 

Source Content:
---
{$sourceText}
---

## SEO Requirements (MANDATORY):
1. Title Tag: 55-65 characters.
2. Meta Description: 145-160 characters.
3. Use H2, H3 headings.
4. Include at least 1 numbered list.
8. Clean Output: Return ONLY valid raw JSON.

Output Format:
{
  \"seo_title\": \"Title\",
  \"meta_description\": \"Desc\",
  \"keywords\": [\"kw1\", \"kw2\"],
  \"content_markdown\": \"Full SEO article\"
}";

        // Call OpenRouter
        $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $AI_API_KEY,
            'HTTP-Referer: https://nguyenvanhao.name.vn',
            'X-Title: Hao Blog Telegram Bot'
        ]);
        
        $payload = json_encode([
            'model' => 'google/gemini-2.5-flash', 
            'messages' => [
                ['role' => 'system', 'content' => 'Return ONLY valid JSON. All escapes must be correct.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.2
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        $aiResRAW = curl_exec($ch);
        curl_close($ch);

        $aiRes = json_decode($aiResRAW, true);
        $aiContent = $aiRes['choices'][0]['message']['content'] ?? '';

        if (empty($aiContent)) {
            sendTelegramMessage($chatId, "❌ Lỗi: AI không phản hồi hoặc trả kết quả rỗng.");
            exit;
        }

        // Parse JSON loosely
        $cleaned = preg_replace('/^```(?:json)?\s*\n?/', '', $aiContent);
        $cleaned = preg_replace('/\n?\s*```$/', '', $cleaned);
        $parsed = json_decode($cleaned, true);

        if (!$parsed || !isset($parsed['seo_title'])) {
            sendTelegramMessage($chatId, "❌ Lỗi: AI trả về định dạng JSON sai lệch.");
            exit;
        }

        // Save to Database as Draft
        $title = $parsed['seo_title'];
        $excerpt = $parsed['meta_description'];
        $content = $parsed['content_markdown'];
        
        // Very basic markdown to HTML for saving
        $htmlContent = nl2br(htmlspecialchars($content));
        // Replace ## with actual H2 (simplistic markdown parser for fallback if needed, but JS handles markdown in admin usually. Wait, in admin AI studio, we save purely HTML via DOMpurify. Let's do basic replacement)
        $htmlContent = preg_replace('/^# (.*?)$/m', '<h1>$1</h1>', $htmlContent);
        $htmlContent = preg_replace('/^## (.*?)$/m', '<h2>$1</h2>', $htmlContent);
        $htmlContent = preg_replace('/^### (.*?)$/m', '<h3>$1</h3>', $htmlContent);
        $htmlContent = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $htmlContent);

        $slug = time() . '-' . preg_replace('/[^a-z0-9]+/i', '-', strtolower($title));
        
        $stmt = $db->prepare("INSERT INTO posts (title, slug, excerpt, content, is_published) VALUES (?, ?, ?, ?, 0)");
        $stmt->execute([$title, $slug, $excerpt, $htmlContent]);
        $postId = $db->lastInsertId();

        // Send Success with Inline Keyboard
        $replyText = "✅ <b>AI Đã hoàn thành bản nháp mới!</b>\n\n";
        $replyText .= "📄 <b>Tiêu đề:</b> {$title}\n";
        $replyText .= "📝 <b>Mô tả:</b> {$excerpt}\n";
        $replyText .= "\nBạn muốn thực hiện thao tác gì tiếp theo?";

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '🚀 Xuất bản ngay', 'callback_data' => "publish:$postId"],
                    ['text' => '⏰ Lên lịch 2h', 'callback_data' => "schedule:$postId"],
                ],
                [
                    ['text' => '👁️ Xem trước', 'callback_data' => "preview:$postId"],
                    ['text' => '❌ Xóa bỏ', 'callback_data' => "discard:$postId"],
                ]
            ]
        ];

        sendTelegramMessage($chatId, $replyText, $keyboard);

    } catch (Exception $e) {
        sendTelegramMessage($chatId, "❌ Đã xảy ra lỗi: " . $e->getMessage());
    }
}

http_response_code(200);
?>
