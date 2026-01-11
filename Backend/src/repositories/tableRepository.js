const db = require('../config/db');

class TableRepository {
    
    // 1. Get All (Filter & Sort)
    async getAll({ status, location, sortQuery }) {
        let query = `SELECT * FROM tables WHERE 1=1`;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }

        if (location) {
            params.push(`%${location}%`);
            query += ` AND location ILIKE $${params.length}`;
        }

        query += sortQuery; // VD: " ORDER BY table_number ASC"

        const result = await db.query(query, params);
        return result.rows;
    }

    // 2. Find By Number (Check duplicate)
    async findByNumber(table_number) {
        const result = await db.query('SELECT id FROM tables WHERE table_number = $1', [table_number]);
        return result.rows[0];
    }

    // 3. Find By Number Except ID (Check duplicate when update)
    async findByNumberExceptId(table_number, id) {
        const result = await db.query(
            'SELECT id FROM tables WHERE table_number = $1 AND id != $2', 
            [table_number, id]
        );
        return result.rows[0];
    }

    // 4. Create
    async create({ table_number, capacity, location, description, qr_token }) {
        const result = await db.query(
            `INSERT INTO tables (table_number, capacity, location, description, qr_token, status) 
             VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
            [table_number, capacity, location, description, qr_token]
        );
        return result.rows[0];
    }

    // 5. Update
    async update(id, { table_number, capacity, location, description, status }) {
        // Dùng COALESCE để giữ nguyên giá trị cũ nếu params truyền vào là undefined
        // Tuy nhiên, khi dùng Repository, thường Controller sẽ chuẩn bị object đầy đủ.
        // Ở đây ta giữ logic COALESCE cho linh hoạt.
        const result = await db.query(
            `UPDATE tables SET 
                table_number = COALESCE($1, table_number),
                capacity = COALESCE($2, capacity),
                location = COALESCE($3, location),
                description = COALESCE($4, description),
                status = COALESCE($5, status)
            WHERE id = $6 RETURNING *`,
            [table_number, capacity, location, description, status, id]
        );
        return result.rows[0];
    }

    // 6. Check Active Orders (Warning logic)
    async countActiveOrders(tableId) {
        const result = await db.query(
            `SELECT COUNT(*) as count FROM orders WHERE table_id = $1 AND status NOT IN ('completed', 'cancelled')`,
            [tableId]
        );
        return parseInt(result.rows[0].count);
    }

    // 7. Update Status Only
    async updateStatus(id, status) {
        const result = await db.query(
            'UPDATE tables SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }




    // 5. Update QR Token (Dùng cho cả Create và Regenerate)
    async updateQRToken(id, token) {
        const result = await db.query(
            'UPDATE tables SET qr_token = $1 WHERE id = $2 RETURNING *',
            [token, id]
        );
        return result.rows[0];
    }
}

module.exports = new TableRepository();