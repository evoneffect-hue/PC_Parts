<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'add') {
        $user_id = $data['user_id'];
        $product_id = $data['product_id'];
        $name = $data['name'];
        $price = $data['price'];
        $image = $data['image'] ?? '';
        
        $check = $conn->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?");
        $check->bind_param("is", $user_id, $product_id);
        $check->execute();
        $result = $check->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $new_qty = $row['quantity'] + 1;
            $update = $conn->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
            $update->bind_param("ii", $new_qty, $row['id']);
            $update->execute();
        } else {
            $insert = $conn->prepare("INSERT INTO cart (user_id, product_id, name, price, image, quantity) VALUES (?, ?, ?, ?, ?, 1)");
            $insert->bind_param("issds", $user_id, $product_id, $name, $price, $image);
            $insert->execute();
        }
        
        echo json_encode(['success' => true]);
    }
    elseif ($action === 'get') {
        $user_id = $data['user_id'];
        $stmt = $conn->prepare("SELECT * FROM cart WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $cart = [];
        while ($row = $result->fetch_assoc()) {
            $cart[] = $row;
        }
        echo json_encode($cart);
    }
    elseif ($action === 'remove') {
        $user_id = $data['user_id'];
        $product_id = $data['product_id'];
        $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
        $stmt->bind_param("is", $user_id, $product_id);
        $stmt->execute();
        echo json_encode(['success' => true]);
    }
    elseif ($action === 'update') {
        $user_id = $data['user_id'];
        $product_id = $data['product_id'];
        $quantity = $data['quantity'];
        
        if ($quantity <= 0) {
            $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("is", $user_id, $product_id);
        } else {
            $stmt = $conn->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("iis", $quantity, $user_id, $product_id);
        }
        $stmt->execute();
        echo json_encode(['success' => true]);
    }
    elseif ($action === 'clear') {
        $user_id = $data['user_id'];
        $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        echo json_encode(['success' => true]);
    }
}
?>