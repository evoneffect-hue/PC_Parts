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
    
    $email = $data['email'] ?? '';
    $token = $data['token'] ?? '';
    $newPassword = $data['password'] ?? '';
    
    // Временно убираем проверку времени для теста
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND token = ?");
    $stmt->execute([$email, $token]);
    $reset = $stmt->fetch();
    
    if (!$reset) {
        echo json_encode(['success' => false, 'message' => 'Недействительная ссылка']);
        exit;
    }
    
    // Обновляем пароль
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->execute([$hashedPassword, $email]);
    
    // Удаляем использованный токен
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
    $stmt->execute([$email]);
    
    echo json_encode(['success' => true, 'message' => 'Пароль успешно изменён']);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>