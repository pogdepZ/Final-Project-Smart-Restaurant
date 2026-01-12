const db = require('../config/db');
const orderRepo = require('../repositories/orderRepository');
const menuRepo = require('../repositories/menuRepository'); // Cần viết thêm repo này nếu chưa có hàm getById
const modifierRepo = require('../repositories/modifierRepository'); // Cần repo này để lấy giá option
const tableRepo = require('../repositories/tableRepository'); // Cần repo này để check bàn

// --- 1. Tạo đơn hàng ---
exports.createOrder = async (data, io) => {
    const { table_id, items, note, guest_name } = data;

    if (!items || items.length === 0) throw new Error("Giỏ hàng trống");

    // A. Check Bàn (Logic nghiệp vụ)
    // Lưu ý: Cần đảm bảo tableRepo có hàm findById trả về cả status
    const table = await tableRepo.findById(table_id); 
    if (!table) {
        const err = new Error("Bàn không tồn tại");
        err.status = 404; throw err;
    }
    if (table.status === 'inactive') {
        const err = new Error(`Bàn ${table.table_number} đang tạm ngưng phục vụ.`);
        err.status = 400; throw err;
    }

    // B. Bắt đầu Transaction
    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        // C. Tính toán tiền
        let grandTotal = 0;
        const processedItems = [];

        for (const item of items) {
            // Lấy thông tin món từ DB (để tránh hack giá từ frontend)
            // Giả sử menuRepo có hàm findById trả về row
            // Nếu chưa có repo chuẩn, tạm thời query trực tiếp ở đây hoặc dùng helper
            const menuItemDB = await menuRepo.getItemById(item.menu_item_id); 
            
            if (!menuItemDB) throw new Error(`Món ăn ID ${item.menu_item_id} không tồn tại`);
            if (menuItemDB.is_deleted || menuItemDB.status !== 'available') {
                throw new Error(`Món '${menuItemDB.name}' hiện không phục vụ`);
            }

            let itemUnitPrice = Number(menuItemDB.price);
            const processedModifiers = [];

            // Tính tiền Topping
            if (item.modifiers && item.modifiers.length > 0) {
                for (const modOptionId of item.modifiers) {
                    // Tương tự, cần modifierRepo để lấy giá
                    const modResult = await client.query('SELECT * FROM modifier_options WHERE id = $1', [modOptionId]);
                    // Hoặc dùng modifierRepo.findOptionById(modOptionId) nếu đã viết
                    
                    if (modResult.rows.length > 0) {
                        const modDB = modResult.rows[0];
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
                finalUnitPrice: itemUnitPrice,
                subtotal: subtotal,
                modifiersDetails: processedModifiers
            });
        }

        // D. Insert vào DB (Gọi Repo truyền client)
        const newOrder = await orderRepo.createOrder(client, { 
            table_id, guest_name, total_amount: grandTotal, note 
        });

        for (const pItem of processedItems) {
            const newItem = await orderRepo.createOrderItem(client, {
                order_id: newOrder.id,
                menu_item_id: pItem.menu_item_id,
                item_name: pItem.dbName,
                price: pItem.finalUnitPrice,
                quantity: pItem.quantity,
                subtotal: pItem.subtotal,
                note: pItem.note
            });

            for (const mod of pItem.modifiersDetails) {
                await orderRepo.createOrderItemModifier(client, {
                    order_item_id: newItem.id,
                    modifier_option_id: mod.id,
                    modifier_name: mod.name,
                    price: mod.price
                });
            }
        }

        await client.query("COMMIT");

        // E. Socket Realtime
        if (io) {
            io.to("kitchen_room").emit("new_order", newOrder);
        }

        return newOrder;

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// --- 2. Lấy danh sách ---
exports.getOrders = async (filters) => {
    return await orderRepo.getAll(filters);
}

// --- 3. Lấy chi tiết ---
exports.getOrderDetails = async (id) => {
    const order = await orderRepo.getById(id);
    if (!order) {
        const err = new Error("Đơn không tồn tại");
        err.status = 404; throw err;
    }
    return order;
}

// --- 4. Cập nhật trạng thái ---
exports.updateStatus = async (id, data, io) => {
    const updatedOrder = await orderRepo.updateStatus(id, data);
    if (!updatedOrder) {
        const err = new Error("Lỗi cập nhật hoặc đơn không tồn tại");
        err.status = 500; throw err;
    }

    if (io) {
        io.to("kitchen_room").emit("update_order", updatedOrder);
        if (updatedOrder.table_id) {
            io.to(`table_${updatedOrder.table_id}`).emit("order_status_update", {
                orderId: updatedOrder.id,
                status: updatedOrder.status,
            });
        }
    }
    return updatedOrder;
}

