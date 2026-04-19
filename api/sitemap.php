<?php
/**
 * Dynamic Sitemap Generator — Hao Blog
 * Reads published posts from DB and generates XML sitemap
 */
header('Content-Type: application/xml; charset=UTF-8');
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$baseUrl = 'https://nguyenvanhao.name.vn';

// Static pages with priorities
$staticPages = [
    ['url' => '/',           'priority' => '1.0', 'changefreq' => 'daily'],
    ['url' => '/blog',       'priority' => '0.9', 'changefreq' => 'daily'],
    ['url' => '/gioi-thieu', 'priority' => '0.7', 'changefreq' => 'monthly'],
    ['url' => '/lien-he',    'priority' => '0.6', 'changefreq' => 'monthly'],
    ['url' => '/toolkit/',   'priority' => '0.8', 'changefreq' => 'weekly'],
];

// Toolkit tools
$toolkitPages = [
    '/toolkit/utm_builder.html',
    '/toolkit/ads-roi-calculator.html',
    '/toolkit/banner_tool.html',
    '/toolkit/tiktok-stats_final.html',
    '/toolkit/youtube-stats_final.html',
    '/toolkit/facebook_export_comment.html',
    '/toolkit/csv2excel.html',
    '/toolkit/check_sitelist.html',
    '/toolkit/keywordwrap.html',
    '/toolkit/note_online.html',
    '/toolkit/vat_caculator.html',
    '/toolkit/2fa-generator.html',
    '/toolkit/ConvertUpperCase.html',
    '/toolkit/ads_structure.html',
    '/toolkit/google_gdn_v3.html',
    '/toolkit/SEM_v2.html',
    '/toolkit/utm_shopee_builder.html',
    '/toolkit/tiktok_export_data.html',
    '/toolkit/synctune.html',
];

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php foreach ($staticPages as $page): ?>
  <url>
    <loc><?= htmlspecialchars($baseUrl . $page['url']) ?></loc>
    <changefreq><?= $page['changefreq'] ?></changefreq>
    <priority><?= $page['priority'] ?></priority>
  </url>
<?php endforeach; ?>

<?php foreach ($toolkitPages as $tool): ?>
  <url>
    <loc><?= htmlspecialchars($baseUrl . $tool) ?></loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
<?php endforeach; ?>

<?php
// Dynamic: Published posts
try {
    $stmt = $db->query("SELECT slug, updated_at, created_at FROM posts WHERE is_published = 1 ORDER BY created_at DESC");
    $posts = $stmt->fetchAll();
    
    foreach ($posts as $post) {
        $lastmod = $post['updated_at'] ?? $post['created_at'];
        $lastmodFormatted = date('Y-m-d', strtotime($lastmod));
        echo "  <url>\n";
        echo "    <loc>" . htmlspecialchars($baseUrl . '/blog/' . $post['slug']) . "</loc>\n";
        echo "    <lastmod>" . $lastmodFormatted . "</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        echo "  </url>\n";
    }
} catch (\Throwable $e) {
    // Silently skip if DB error
}
?>
</urlset>
