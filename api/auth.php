<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->email) && !empty($data->password)) {
        $database = new Database();
        $db = $database->getConnection();
        
        $stmt = $db->prepare("SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$data->email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($data->password, $user['password_hash'])) {
            // Prevent session fixation
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            
            echo json_encode([
                "success" => true, 
                "message" => "Login successful",
                "user" => [
                    "email" => $user['email']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid email or password"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
    }
} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true, "message" => "Logged out"]);
} elseif ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "success" => true, 
            "user" => [
                "email" => $_SESSION['email']
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Not logged in"]);
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "Action not found"]);
}
?>
