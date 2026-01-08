const db = require('../config/db');
const jwt = require('jsonwebtoken');

// 1. Khách hàng đặt món (Public - hoặc verify qua QR Token)
exports.createOrder = async (req, res) => {
    // Frontend gửi lên: { table_id, items: [{ menu_item_id, quantity, modifiers: [opt_id1, opt_id2], note }], note, guest_name }
    const { table_id, items, note, guest_name } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const client = await db.pool.connect(); // Dùng client để chạy Transaction

    try {
        await client.query('BEGIN'); // Bắt đầu giao dịch

        // --- BƯỚC A: TÍNH TỔNG TIỀN & VALIDATE ---
        let grandTotal = 0;
        const processedItems = [];

        for (const item of items) {
            // Lấy thông tin món gốc từ DB để check giá
            const menuItemRes = await client.query('SELECT * FROM menu_items WHERE id = $1', [item.menu_item_id]);
            if (menuItemRes.rows.length === 0) throw new Error(`Món ăn ID ${item.menu_item_id} không tồn tại`);
            
            const menuItemDB = menuItemRes.rows[0];
            let itemUnitPrice = Number(menuItemDB.price);
            
            // Xử lý modifiers (Topping)
            const processedModifiers = [];
            if (item.modifiers && item.modifiers.length > 0) {
                for (const modOptionId of item.modifiers) {
                    const modRes = await client.query('SELECT * FROM modifier_options WHERE id = $1', [modOptionId]);
                    if (modRes.rows.length > 0) {
                        const modDB = modRes.rows[0];
                        itemUnitPrice += Number(modDB.price_adjustment);
                        processedModifiers.push({
                            id: modDB.id,
                            name: modDB.name,
                            price: Number(modDB.price_adjustment)
                        });
                    }
                }
            }

            const subtotal = itemUnitPrice * item.quantity;
            grandTotal += subtotal;

            processedItems.push({
                ...item,
                dbName: menuItemDB.name,
                dbPrice: Number(menuItemDB.price), // Giá gốc chưa topping
                finalUnitPrice: itemUnitPrice,     // Giá đã cộng topping
                subtotal: subtotal,
                modifiersDetails: processedModifiers
            });
        }

        // --- BƯỚC B: INSERT VÀO DB ---

        // 1. Insert Order
        const orderRes = await client.query(
            `INSERT INTO orders (table_id, guest_name, total_amount, note, status, payment_status) 
             VALUES ($1, $2, $3, $4, 'received', 'unpaid') RETURNING *`,
            [table_id, guest_name || 'Khách lẻ', grandTotal, note]
        );
        const newOrder = orderRes.rows[0];

        // 2. Insert Order Items & Modifiers
        for (const pItem of processedItems) {
            const itemRes = await client.query(
                `INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity, subtotal, note)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [newOrder.id, pItem.menu_item_id, pItem.dbName, pItem.finalUnitPrice, pItem.quantity, pItem.subtotal, pItem.note]
            );
            const newItemId = itemRes.rows[0].id;

            // Insert Modifiers của Item đó
            for (const mod of pItem.modifiersDetails) {
                await client.query(
                    `INSERT INTO order_item_modifiers (order_item_id, modifier_option_id, modifier_name, price)
                     VALUES ($1, $2, $3, $4)`,
                    [newItemId, mod.id, mod.name, mod.price]
                );
            }
        }

        await client.query('COMMIT'); // Lưu tất cả
        res.status(201).json({ message: "Đặt món thành công", order: newOrder });

    } catch (err) {
        await client.query('ROLLBACK'); // Hoàn tác nếu lỗi
        console.error(err);
        res.status(500).json({ message: err.message || 'Lỗi đặt hàng' });
    } finally {
        client.release();
    }
};

// 2. Lấy danh sách đơn hàng (Cho Admin/Kitchen)
exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT o.*, t.table_number 
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.id
        `;
        const params = [];

        if (status) {
            query += ` WHERE o.status = $1`;
            params.push(status);
        }

        query += ` ORDER BY o.created_at DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy danh sách đơn' });
    }
};

// 3. Xem chi tiết đơn hàng (Kèm món và topping)
exports.getOrderDetails = async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy thông tin chung
        const orderRes = await db.query(
            `SELECT o.*, t.table_number FROM orders o 
             LEFT JOIN tables t ON o.table_id = t.id WHERE o.id = $1`, 
            [id]
        );
        if (orderRes.rows.length === 0) return res.status(404).json({ message: "Đơn không tồn tại" });

        // Lấy items và modifiers (Query phức tạp dùng JSON agg để gom gọn)
        const itemsRes = await db.query(`
            SELECT 
                oi.*,
                COALESCE(
                    json_agg(json_build_object('name', oim.modifier_name, 'price', oim.price)) 
                    FILTER (WHERE oim.id IS NOT NULL), '[]'
                ) as modifiers
            FROM order_items oi
            LEFT JOIN order_item_modifiers oim ON oi.id = oim.order_item_id
            WHERE oi.order_id = $1
            GROUP BY oi.id
        `, [id]);

        res.json({ ...orderRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 4. Cập nhật trạng thái đơn (Kitchen: Preparing -> Ready)
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, payment_status } = req.body;
    
    try {
        let query = 'UPDATE orders SET updated_at = NOW()';
        const params = [id];
        let idx = 2;

        if (status) {
            query += `, status = $${idx++}`;
            params.push(status);
        }
        if (payment_status) {
            query += `, payment_status = $${idx++}`;
            params.push(payment_status);
        }

        query += ` WHERE id = $1 RETURNING *`;

        const result = await db.query(query, params);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi cập nhật đơn' });
    }
};