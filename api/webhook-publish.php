<?php
header('Content-Type: application/json');
require_once 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));
$postId = $data->post_id ?? null;

if (!$postId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing post_id"]);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// Fetch post details
try {
    $stmt = $db->prepare("SELECT title, slug, excerpt, featured_image FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        http_response_code(404);
        echo json_encode(["error" => "Post not found"]);
        exit;
    }

    // WEBHOOK DESTINATION (E.g. Zapier / Make.com)
    // You can replace this URL with your actual webhook URL.
    $webhookUrl = "https://hook.us1.make.com/your-webhook-id"; 

    $payload = [
        "event" => "post_published",
        "post" => [
            "title" => $post['title'],
            "url" => "https://nguyenvanhao.name.vn/blog/" . $post['slug'],
            "excerpt" => $post['excerpt'],
            "image" => $post['featured_image']
        ]
    ];

    // --- ACTUAL PING LOGIC ---
    /*
    $ch = curl_init($webhookUrl);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // Un-comment the next lines to actually fire the request in production
    // $result = curl_exec($ch);
    // curl_close($ch);
    */

    // Returning success simulating the webhook firing
    echo json_encode([
        "success" => true, 
        "message" => "Webhook triggered successfully (Simulation Mode)", 
        "payload" => $payload
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
}
?>
