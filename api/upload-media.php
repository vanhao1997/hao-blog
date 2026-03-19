<?php
// Cho phép CORS nếu cần
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $imageUrl = $data['url'] ?? '';

    if (empty($imageUrl) || strpos($imageUrl, 'http') !== 0) {
        echo json_encode(['success' => false, 'error' => 'URL không hợp lệ']); 
        exit;
    }

    // 1. Xác định thư mục lưu trữ
    $subDir = 'images/' . date('Y/m/');
    $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/' . $subDir;
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 2. Xử lý tên file
    $path_parts = pathinfo(parse_url($imageUrl, PHP_URL_PATH));
    $extension = isset($path_parts['extension']) ? $path_parts['extension'] : 'jpg';
    // Loại bỏ query string trong extension nếu có (ví dụ .jpg?v=1)
    $extension = explode('?', $extension)[0];
    
    $filename = 'hao-' . md5($imageUrl) . '-' . time() . '.' . $extension;
    $targetPath = $uploadDir . $filename;

    // 3. Tải file bằng cURL
    $ch = curl_init($imageUrl);
    $fp = fopen($targetPath, 'wb');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_REFERER, 'https://www.google.com/'); 
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    $success = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);

    // 4. Trả về kết quả
    if ($success && $httpCode == 200 && file_exists($targetPath) && filesize($targetPath) > 0) {
        // Trả về URL tuyệt đối để hiển thị trên web
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $newUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . '/' . $subDir . $filename;
        
        echo json_encode([
            'success' => true, 
            'url' => $newUrl
        ]);
    } else {
        if(file_exists($targetPath)) @unlink($targetPath);
        echo json_encode(['success' => false, 'error' => 'Không thể tải ảnh. HTTP Code: ' . $httpCode]);
    }
    exit;
}