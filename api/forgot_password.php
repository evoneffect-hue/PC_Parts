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
    
    // Проверяем, существует ли пользователь
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Пользователь с таким email не найден']);
        exit;
    }
    
    // Генерируем токен
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Удаляем старые токены для этого email
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
    $stmt->execute([$email]);
    
    // Сохраняем новый токен
    $stmt = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expires]);
    
    // Кодируем email для URL
    $encodedEmail = urlencode($email);
    
    // Ссылка для сброса
    $resetLink = "http://localhost/pcshop/reset_password.html?token=" . $token . "&email=" . $encodedEmail;
    
    echo json_encode([
        'success' => true, 
        'message' => 'Ссылка для сброса пароля отправлена',
        'reset_link' => $resetLink,
        'debug_email' => $email,
        'debug_encoded' => $encodedEmail
    ]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>