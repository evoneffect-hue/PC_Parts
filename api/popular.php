<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    // SQL-запрос на получение популярных товаров (по 3 из каждой категории)
    $stmt = $pdo->prepare("
        SELECT p.id, p.name, p.price, p.image, p.description, c.slug as category
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id IN (
            SELECT id FROM products 
            WHERE category_id = p.category_id 
            ORDER BY price DESC 
            LIMIT 3
        )
        ORDER BY c.id, p.price DESC
    ");
    $stmt->execute();
    $popular = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'products' => $popular]);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>