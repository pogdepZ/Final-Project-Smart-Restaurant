-- Tạo bảng lưu yêu cầu thanh toán từ khách
CREATE TABLE IF NOT EXISTS bill_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    session_id UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
    note TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed', 'cancelled')),
    handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    handled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index để query nhanh các pending requests
CREATE INDEX idx_bill_requests_pending ON bill_requests(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_bill_requests_table ON bill_requests(table_id);
