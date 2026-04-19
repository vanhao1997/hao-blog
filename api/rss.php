<?php
/**
 * RSS Feed Generator — Hao Blog
 * Standard RSS 2.0 feed for blog readers
 */
header('Content-Type: application/rss+xml; charset=UTF-8');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$baseUrl = 'https://nguyenvanhao.name.vn';

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nguyễn Văn Hảo Blog</title>
    <link><?= $baseUrl ?></link>
    <description>Chia sẻ kiến thức về Performance Marketing, Facebook Ads, Social Media, Content Marketing và AI</description>
    <language>vi</language>
    <lastBuildDate><?= date('r') ?></lastBuildDate>
    <atom:link href="<?= $baseUrl ?>/api/rss.php" rel="self" type="application/rss+xml"/>
    <image>
      <url><?= $baseUrl ?>/images/og-cover.png</url>
      <title>Nguyễn Văn Hảo Blog</title>
      <link><?= $baseUrl ?></link>
    </image>
<?php
try {
    $stmt = $db->query("SELECT title, slug, excerpt, content, published_at, updated_at FROM posts WHERE is_published = 1 ORDER BY published_at DESC LIMIT 20");
    $posts = $stmt->fetchAll();

    foreach ($posts as $post) {
        $pubDate = date('r', strtotime($post['published_at']));
        $description = htmlspecialchars($post['excerpt'] ?: mb_substr(strip_tags($post['content']), 0, 300) . '...', ENT_XML1, 'UTF-8');
        $link = $baseUrl . '/blog/' . $post['slug'];
        echo "    <item>\n";
        echo "      <title>" . htmlspecialchars($post['title'], ENT_XML1, 'UTF-8') . "</title>\n";
        echo "      <link>" . $link . "</link>\n";
        echo "      <guid isPermaLink=\"true\">" . $link . "</guid>\n";
        echo "      <pubDate>" . $pubDate . "</pubDate>\n";
        echo "      <description>" . $description . "</description>\n";
        echo "    </item>\n";
    }
} catch (\Throwable $e) {
    // Silently skip
}
?>
  </channel>
</rss>
