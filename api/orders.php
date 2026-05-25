<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'create') {
        $user_id = $data['user_id'];
        $items = $data['items'];
        $total = $data['total'];
        $order_number = 'ORD-' . time() . '-' . rand(100, 999);
        
        $conn->begin_transaction();
        
        try {
            // Сохраняем items как JSON
            $items_json = json_encode($items, JSON_UNESCAPED_UNICODE);
            
            $stmt = $conn->prepare("INSERT INTO orders (user_id, order_number, total, items, status) VALUES (?, ?, ?, ?, 'pending')");
            $stmt->bind_param("isds", $user_id, $order_number, $total, $items_json);
            $stmt->execute();
            $order_id = $conn->insert_id;
            
            // Добавляем в order_items
            $item_stmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)");
            
            foreach ($items as $item) {
                $item_stmt->bind_param("issdi", $order_id, $item['id'], $item['name'], $item['price'], $item['quantity']);
                $item_stmt->execute();
            }
            
            // Очищаем корзину
            $clear = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
            $clear->bind_param("i", $user_id);
            $clear->execute();
            
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'order_number' => $order_number,
                'order_id' => $order_id
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    elseif ($action === 'get') {
        $user_id = $data['user_id'];
        
        $orders = [];
        $stmt = $conn->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($order = $result->fetch_assoc()) {
            $order['items'] = json_decode($order['items'], true);
            $orders[] = $order;
        }
        
        echo json_encode($orders);
    }
}
?>