<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbname = 'pcshop';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = $data['user_id'] ?? 0;
    
    // Сначала удаляем избранное пользователя
    $stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    // Затем удаляем самого пользователя
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true]);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>