<?php
// API Configuration
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'qskqmzfd_nguyenvanhao.name.vn');
define('DB_USER', 'qskqmzfd_vanhao97');
define('DB_PASS', 'Haoblog2026!@#');

// Error Reporting (Turn off for production to avoid leaking info, but keep logged)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
?>
