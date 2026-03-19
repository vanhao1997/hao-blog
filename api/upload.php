<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Support both 'file' (Admin JS) and 'image' (Banner Tool)
$file = $_FILES['file'] ?? $_FILES['image'] ?? null;

if (!$file) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$uploadDir = '../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Filename Logic
// Always use timestamp prefix for consistency as requested
$fileName = time() . '_' . basename($file['name']);

$targetPath = $uploadDir . $fileName;
$publicUrl = '/uploads/' . $fileName;

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed.']);
    exit;
}

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $response = [
        'success' => true,
        'url' => $publicUrl,
        'filename' => $fileName
    ];

    // Auto-save to DB if alt_text is provided (Banner Tool flow)
    if (isset($_POST['alt_text'])) {
        try {
            $database = new Database();
            $db = $database->getConnection();
            $stmt = $db->prepare("INSERT INTO images (url, alt_text) VALUES (?, ?)");
            $stmt->execute([$publicUrl, $_POST['alt_text']]);
            $response['id'] = $db->lastInsertId();
            $response['db_saved'] = true;
        } catch (Exception $e) {
            // Log error but don't fail upload
            $response['db_error'] = $e->getMessage();
        }
    }

    echo json_encode($response);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
?>
