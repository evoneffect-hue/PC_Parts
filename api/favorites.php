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
    $action = $_GET['action'] ?? '';
    $userId = $data['user_id'] ?? null;
    $productId = $data['product_id'] ?? null;
    
    switch($action) {
        case 'get':
            $stmt = $pdo->prepare("SELECT p.* FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_id = ?");
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
        case 'add':
            $stmt = $pdo->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)");
            $stmt->execute([$userId, $productId]);
            echo json_encode(['success' => true]);
            break;
        case 'remove':
            $stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$userId, $productId]);
            echo json_encode(['success' => true]);
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>