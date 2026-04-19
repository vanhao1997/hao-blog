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

// Filename Logic (Force .webp extension for converted images)
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$fileName = time() . '_' . preg_replace('/[^A-Za-z0-9\-]/', '', str_replace(' ', '-', $originalName)) . '.webp';
$targetPath = $uploadDir . $fileName;
$publicUrl = '/uploads/' . $fileName;

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed.']);
    exit;
}

$success = false;
$sourceImage = null;

// Load image into GD
switch($file['type']) {
    case 'image/jpeg': $sourceImage = @imagecreatefromjpeg($file['tmp_name']); break;
    case 'image/png':  $sourceImage = @imagecreatefrompng($file['tmp_name']); break;
    case 'image/gif':  $sourceImage = @imagecreatefromgif($file['tmp_name']); break;
    case 'image/webp': $sourceImage = @imagecreatefromwebp($file['tmp_name']); break;
}

if ($sourceImage) {
    // Enable alpha blending for PNG/WebP with transparency
    if ($file['type'] == 'image/png' || $file['type'] == 'image/webp') {
        imagealphablending($sourceImage, true);
        imagesavealpha($sourceImage, true);
    }

    $width = imagesx($sourceImage);
    $height = imagesy($sourceImage);
    
    // Draw Watermark (Bottom Right corner)
    $watermarkText = "nguyenvanhao.name.vn";
    $font = 5; // Built-in font size (1-5)
    $fw = imagefontwidth($font) * strlen($watermarkText);
    $fh = imagefontheight($font);
    
    // Prevent drawing if image is too small
    if ($width > 200 && $height > 100) {
        $x = $width - $fw - 10;
        $y = $height - $fh - 10;
        
        // Allocate colors
        // Semi-transparent black background for text readability
        $bgColor = imagecolorallocatealpha($sourceImage, 0, 0, 0, 60); 
        // Semi-transparent white text
        $textColor = imagecolorallocatealpha($sourceImage, 255, 255, 255, 30);
        
        // Draw background box
        imagefilledrectangle($sourceImage, $x - 6, $y - 6, $x + $fw + 6, $y + $fh + 6, $bgColor);
        // Draw text
        imagestring($sourceImage, $font, $x, $y, $watermarkText, $textColor);
    }

    // Save as WEBP (Quality: 80% to save space)
    if (imagewebp($sourceImage, $targetPath, 80)) {
        $success = true;
    }
    imagedestroy($sourceImage);
} 

// Fallback if GD fails or image creation fails
if (!$success) {
    $fileName = time() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;
    $publicUrl = '/uploads/' . $fileName;
    $success = move_uploaded_file($file['tmp_name'], $targetPath);
}

if ($success) {
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
