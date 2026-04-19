<?php
ini_set('max_execution_time', 300);
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

// --- 1. Security & Settings ---
$CRON_SECRET = "hao_cron_secret_1997";
if ($_GET['token'] !== $CRON_SECRET) {
    http_response_code(403);
    die("Unauthorized.");
}

$stmt = $db->query("SELECT setting_key, setting_value FROM settings");
$settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

$isEnabled = $settings['auto_news_enabled'] ?? "0";
$isManual = isset($_GET['manual']) ? true : false;
if ($isEnabled !== "1" && !$isManual) {
    die("Auto News is disabled in settings.");
}

$rssSourcesStr = $settings['auto_news_rss'] ?? '';
$keywordsStr = $settings['auto_news_keywords'] ?? '';
$actionStatus = $settings['auto_news_action'] ?? 'draft';
$AI_API_KEY = $settings['ai_api_key'] ?? '';

if (empty($AI_API_KEY)) {
    die("Missing AI API Key.");
}

$rssUrls = array_filter(array_map('trim', explode("\n", $rssSourcesStr)));
if (empty($rssUrls)) {
    die("No RSS sources configured.");
}

$keywords = [];
if (!empty($keywordsStr)) {
    $keywords = array_filter(array_map('trim', explode(",", $keywordsStr)));
}

// Ensure columns exist (Migration logic inline to avoid manual DB changes)
try {
    $db->exec("ALTER TABLE posts ADD COLUMN source_url TEXT DEFAULT NULL");
} catch(Exception $e) { /* Column probably exists */ }


// --- Helper Functions ---
function urlExists($db, $url) {
    // Also strip https to standard http to be safe
    $stmt = $db->prepare("SELECT id FROM posts WHERE source_url = ?");
    $stmt->execute([$url]);
    return $stmt->fetchColumn();
}

function fetchUrlText($url) {
    $res = @file_get_contents("https://api.allorigins.win/get?url=" . urlencode($url));
    if ($res) {
        $data = json_decode($res, true);
        if (!empty($data['contents'])) {
            $html = $data['contents'];
            $html = preg_replace('@<(script|style|nav|footer|header|aside)[^>]*?>.*?</\1>@si', '', $html);
            $text = strip_tags($html);
            return substr(preg_replace('/\s+/', ' ', $text), 0, 30000);
        }
    }
    return '';
}

function rewriteWithAI($sourceText, $apiKey) {
    if (empty(trim($sourceText))) return null;
    $prompt = "
Role: Senior SEO Content Specialist & On-Page SEO Expert for 'nguyenvanhao.name.vn'.
Task: Rewrite the following news article into a highly engaging, unique, top-ranking SEO blog post in Vietnamese.

Source Content:
---
{$sourceText}
---

## SEO Requirements (MANDATORY):
1. Title Tag: 55-65 characters.
2. Meta Description: 145-160 characters. Highlight the core news or value.
3. Content structure: 100% original rewritten text. Use H2, H3. Write detailed paragraphs.
4. Clean Output: Return ONLY valid raw JSON output without markdown code block delimiters.

Format:
{
  \"seo_title\": \"SEO Title Here\",
  \"meta_description\": \"Meta Desc Here\",
  \"keywords\": [\"keyword1\", \"keyword2\"],
  \"content_markdown\": \"Full Rewritten HTML or Markdown content here.\"
}";

    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
        'HTTP-Referer: https://nguyenvanhao.name.vn',
        'X-Title: Hao Blog News Cron'
    ]);
    $payload = json_encode([
        'model' => 'google/gemini-2.5-flash',
        'messages' => [
            ['role' => 'system', 'content' => 'Return ONLY valid JSON. Escape strings.'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.25
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    $res = curl_exec($ch);
    curl_close($ch);

    $aiRes = json_decode($res, true);
    $text = $aiRes['choices'][0]['message']['content'] ?? '';
    if (!$text) return null;

    $text = preg_replace('/^```(?:json)?\s*\n?/', '', $text);
    $text = preg_replace('/\n?\s*```$/', '', $text);
    return json_decode($text, true);
}


// --- 2. RSS Processing ---
$processedCount = 0;
// We only want to successfully clone 1 new article per cron run to avoid bans/timeouts
$limitPerRun = 1;

foreach ($rssUrls as $url) {
    if ($processedCount >= $limitPerRun) break;
    
    $rssContent = @file_get_contents($url);
    if (!$rssContent) continue;
    
    $xml = @simplexml_load_string($rssContent);
    if (!$xml) continue;

    // Support both standard RSS <item> and ATOM <entry>
    $items = $xml->channel->item ?? $xml->entry;
    if (!$items) continue;

    foreach ($items as $item) {
        if ($processedCount >= $limitPerRun) break;

        // Extract Link
        $link = (string)($item->link['href'] ?? $item->link);
        $title = (string)$item->title;
        
        if (empty($link)) continue;

        // Skip if already in DB
        if (urlExists($db, $link)) {
            continue;
        }

        // Keyword Match Check
        $passedKeywordFile = true;
        if (!empty($keywords)) {
            $passedKeywordFile = false;
            foreach ($keywords as $kw) {
                if (stripos($title, $kw) !== false) {
                    $passedKeywordFile = true;
                    break;
                }
            }
        }

        if (!$passedKeywordFile) {
            continue;
        }

        // --- Execute Clone & Rewrite ---
        echo "Found new target: " . htmlspecialchars($title) . " ($link)<br>";
        
        $sourceText = fetchUrlText($link);
        if (strlen($sourceText) < 200) {
            echo "-> Content too short or failed to scrape.<br>";
            // Mark as 'failed' in DB to not retry? For now, we will store it so we skip it next time.
            $stmt = $db->prepare("INSERT INTO posts (title, source_url) VALUES (?, ?)");
            $stmt->execute(["[FAILED_SCRAPE] " . substr($title, 0, 50), $link]);
            continue;
        }

        $parsed = rewriteWithAI($sourceText, $AI_API_KEY);
        if (!$parsed || empty($parsed['seo_title'])) {
            echo "-> AI Generation Failed.<br>";
            $stmt = $db->prepare("INSERT INTO posts (title, source_url) VALUES (?, ?)");
            $stmt->execute(["[FAILED_AI] " . substr($title, 0, 50), $link]);
            continue;
        }

        // Save Success
        $newTitle = $parsed['seo_title'];
        $newExcerpt = $parsed['meta_description'];
        $newContent = $parsed['content_markdown'];
        
        // Basic MD to HTML
        $htmlContent = nl2br(htmlspecialchars($newContent));
        $htmlContent = preg_replace('/^# (.*?)$/m', '<h1>$1</h1>', $htmlContent);
        $htmlContent = preg_replace('/^## (.*?)$/m', '<h2>$1</h2>', $htmlContent);
        $htmlContent = preg_replace('/^### (.*?)$/m', '<h3>$1</h3>', $htmlContent);
        $htmlContent = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $htmlContent);

        $slug = time() . '-' . preg_replace('/[^a-z0-9]+/i', '-', strtolower(mb_substr($newTitle, 0, 50)));
        $isPublished = ($actionStatus === 'publish') ? 1 : 0;
        
        try {
            $stmt = $db->prepare("INSERT INTO posts (title, slug, excerpt, content, source_url, is_published) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$newTitle, $slug, $newExcerpt, $htmlContent, $link, $isPublished]);
            $processedCount++;
            echo "-> ✅ Successfully fully cloned & injected to DB (Status: $actionStatus).<br>";
        } catch (Exception $e) {
            echo "-> DB Error: " . $e->getMessage() . "<br>";
        }
    }
}

if ($processedCount === 0) {
    echo "Cron finished. No new articles met the criteria.";
} else {
    echo "Cron finished. Processed $processedCount articles.";
}
?>
