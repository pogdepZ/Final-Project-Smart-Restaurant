const db = require('../config/db');
const orderRepo = require('../repositories/orderRepository');
const menuRepo = require('../repositories/menuRepository'); // Cần viết thêm repo này nếu chưa có hàm getById
const modifierRepo = require('../repositories/modifierRepository'); // Cần repo này để lấy giá option
const tableRepo = require('../repositories/tableRepository'); // Cần repo này để check bàn
const socketService = require('./socketService'); // Import

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
    // 1. Lấy dữ liệu thô từ DB
    const orders = await orderRepo.getAll(filters);

    // 2. LOGIC LỌC DỮ LIỆU CHO BẾP
    // Nếu API đang yêu cầu lấy đơn "preparing" (tức là request từ màn hình Bếp)
    if (filters.status === 'preparing') {
        return orders.map(order => ({
            ...order,
            // Chỉ giữ lại những món KHÔNG bị từ chối
            items: order.items.filter(item => item.status !== 'rejected')
        })).filter(order => order.items.length > 0); // (Tùy chọn) Loại bỏ đơn hàng rỗng nếu tất cả món đều bị reject
    }

    // Nếu là trạng thái khác (received, completed...) thì trả về full để Waiter/Admin xem lịch sử
    return orders;
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
    // 1. Thực hiện Update vào DB (Chỉ để đổi status)
    const rawUpdated = await orderRepo.updateStatus(id, data);

    if (!rawUpdated) {
        const err = new Error("Lỗi cập nhật hoặc đơn không tồn tại");
        err.status = 500; throw err;
    }

    // 2. QUAN TRỌNG: Lấy lại Full Info (kèm items, table_number...)
    const fullOrder = await orderRepo.getById(id);



    console.log("Socket Payload (Full):", fullOrder); // Debug xem có items chưa

    // 3. Bắn Socket với Full Data
    if (io) {
        
        const orderForKitchen = {
            ...fullOrder,
            items: fullOrder.items.filter(item => item.status !== 'rejected')
        };
    
        if (orderForKitchen.items.length > 0) {
             io.to("kitchen_room").emit("update_order", orderForKitchen);
        } else {
             // Tùy chọn: Nếu từ chối hết món thì báo bếp xóa đơn đó đi (nếu đang hiện)
             // io.to("kitchen_room").emit("update_order", { ...fullOrder, status: 'cancelled' });
        }

        // Kitchen cần full items để hiển thị card
        io.to("kitchen_room").emit("update_order", fullOrder);
        
        if (fullOrder.table_id) {
            io.to(`table_${fullOrder.table_id}`).emit("order_status_update", {
                orderId: fullOrder.id,
                status: fullOrder.status,
            });
        }
    }
    
    return fullOrder; // Trả về full data cho Controller luôn
}

// Xử lý Accept/Reject từng món
exports.updateItemStatus = async (itemId, status) => {
    // 1. Update status item
    const updatedItem = await orderRepo.updateItemStatus(itemId, status);
    if (!updatedItem) throw new Error("Món không tồn tại");

    // 2. Nếu Từ chối (rejected) -> Trừ tiền tổng đơn hàng
    if (status === 'rejected') {
        await orderRepo.decreaseOrderTotal(updatedItem.order_id, updatedItem.subtotal);
    }

    // 3. Lấy lại Full Order để bắn Socket (quan trọng để đồng bộ giao diện)
    const fullOrder = await orderRepo.getById(updatedItem.order_id);

    // 4. Kiểm tra logic tự động cập nhật trạng thái đơn cha (Optional)
    // Ví dụ: Nếu tất cả món đều 'rejected' -> Đơn cha thành 'cancelled'
    // Ví dụ: Nếu có ít nhất 1 món 'accepted' -> Đơn cha thành 'preparing'
    // (Bạn có thể thêm logic này sau nếu muốn xịn hơn)

    // 5. Bắn Socket
    socketService.notifyOrderUpdate(fullOrder);

    return fullOrder;
};