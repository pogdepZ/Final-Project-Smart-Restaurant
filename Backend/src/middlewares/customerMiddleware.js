const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.verifyTableToken = async (req, res, next) => {
    let token;

    // 1. Lấy token từ Header (Bearer) HOẶC từ Query String (?token=...)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    // Nếu không có token
    if (!token) {
        return res.status(401).json({ message: "Vui lòng quét mã QR trên bàn để tiếp tục." });
    }

    try {
        // 2. Giải mã Token (Verify Signature)
        // Lưu ý: Phải dùng đúng QR_SECRET đã dùng để tạo mã
        const decoded = jwt.verify(token, process.env.QR_SECRET);

        // 3. Kiểm tra trong Database (Logic cốt lõi của Invalidation)
        const result = await db.query('SELECT * FROM tables WHERE id = $1', [decoded.table_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Bàn không tồn tại." });
        }

        const table = result.rows[0];

        // --- YÊU CẦU 4.2: INVALIDATION HANDLING ---
        // So sánh token khách gửi với token mới nhất trong DB
        if (table.qr_token !== token) {
            // Log lại hành vi đáng ngờ (Security Monitoring)
            console.warn(`[SECURITY ALERT] Phát hiện quét mã QR cũ/giả mạo tại bàn ${table.table_number}. Time: ${new Date().toISOString()}`);
            
            // Trả về thông báo thân thiện như yêu cầu
            return res.status(403).json({ 
                message: "This QR code is no longer valid. Please ask staff for assistance." 
                // Tiếng Việt: "Mã QR này không còn hiệu lực. Vui lòng liên hệ nhân viên để lấy mã mới."
            });
        }

        // Kiểm tra trạng thái bàn
        if (table.status === 'inactive') {
            return res.status(403).json({ message: "Bàn này đang tạm ngưng phục vụ." });
        }

        // Token hợp lệ -> Gán thông tin bàn vào request
        req.table = table; 
        next();

    } catch (err) {
        console.error("QR Error:", err.message);
        return res.status(401).json({ message: "Mã QR không hợp lệ hoặc đã hết hạn." });
    }
};