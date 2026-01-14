const billingService = require('../services/billingService');

exports.previewTableBill = async (req, res) => {
    const { tableId } = req.params;
    const { discount_type, discount_value } = req.body;
    try {
        const bill = await billingService.previewTableBill(tableId, discount_type, discount_value);
        res.json(bill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.checkoutTable = async (req, res) => {
    const { tableId } = req.params;
    const userId = req.user.id; // Lấy từ token
    try {
        const bill = await billingService.processTablePayment(tableId, userId, req.body);
        res.json({ message: "Thanh toán bàn thành công", bill });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};