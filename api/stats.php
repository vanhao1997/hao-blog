<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Fetch counts efficiently
    $postsTotal = $db->query("SELECT COUNT(*) FROM posts")->fetchColumn();
    $postsPublished = $db->query("SELECT COUNT(*) FROM posts WHERE is_published = 1")->fetchColumn();
    $imagesTotal = $db->query("SELECT COUNT(*) FROM images")->fetchColumn();

    echo json_encode([
        'success' => true,
        'posts_total' => $postsTotal,
        'posts_published' => $postsPublished,
        'posts_draft' => $postsTotal - $postsPublished,
        'images_total' => $imagesTotal
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
