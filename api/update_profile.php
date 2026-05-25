<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbname = 'pcshop';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = $data['user_id'] ?? 0;
    $username = $data['username'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $city = $data['city'] ?? '';
    $address = $data['address'] ?? '';
    $settings = $data['settings'] ?? ['notifications' => true, 'darkTheme' => false, 'lightTheme' => false];
    $avatar = $data['avatar'] ?? null;
    
    // Кодируем settings в JSON
    $settingsJson = json_encode($settings);
    
    $sql = "UPDATE users SET username = ?, email = ?, phone = ?, city = ?, address = ?, settings = ?";
    $params = [$username, $email, $phone, $city, $address, $settingsJson];
    
    if ($avatar) {
        $sql .= ", avatar = ?";
        $params[] = $avatar;
    }
    
    if (!empty($data['password'])) {
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $sql .= ", password = ?";
        $params[] = $password;
    }
    
    $sql .= " WHERE id = ?";
    $params[] = $userId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Получаем обновлённые данные пользователя
    $stmt = $pdo->prepare("SELECT id, username, email, phone, city, address, settings, avatar, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Раскодируем settings обратно в объект
    $user['settings'] = json_decode($user['settings'], true) ?: ['notifications' => true, 'darkTheme' => false, 'lightTheme' => false];
    
    echo json_encode(['success' => true, 'user' => $user]);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>