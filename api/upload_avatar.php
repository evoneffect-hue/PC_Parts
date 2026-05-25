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
    $imageData = $data['avatar'] ?? '';
    
    if (!$userId || !$imageData) {
        echo json_encode(['success' => false, 'message' => 'Нет данных']);
        exit;
    }
    
    // Декодируем base64 изображение
    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
        $imageType = $matches[1];
        $imageData = substr($imageData, strpos($imageData, ',') + 1);
        $imageData = base64_decode($imageData);
        
        // Создаём папку если нет
        $uploadDir = '../uploads/avatars/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Генерируем уникальное имя файла
        $filename = 'avatar_' . $userId . '_' . time() . '.' . $imageType;
        $filepath = $uploadDir . $filename;
        
        // Сохраняем файл
        file_put_contents($filepath, $imageData);
        
        // Путь для сохранения в БД
        $avatarPath = '/pcshop/uploads/avatars/' . $filename;
        
        // Обновляем БД
        $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
        $stmt->execute([$avatarPath, $userId]);
        
        // Получаем обновлённые данные
        $stmt = $pdo->prepare("SELECT id, username, email, phone, city, address, settings, avatar, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $user['settings'] = json_decode($user['settings'], true) ?: ['notifications' => true];
        
        echo json_encode(['success' => true, 'user' => $user, 'avatar_path' => $avatarPath]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Неверный формат изображения']);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>