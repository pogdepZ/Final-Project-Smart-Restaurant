// tạo 1 map destinaition cho socket
const socketDestination = {
    ADMIN: 'admin_room',
    KITCHEN: 'kitchen_room',
    CASHIER: 'cashier_room',
    TABLE: (tableId) => `table_${tableId}`,
};

module.exports = socketDestination;