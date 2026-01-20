-- Migration: Create coupons table
-- Run this SQL in your PostgreSQL database

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2), -- Giới hạn giảm tối đa (cho loại percent)
    usage_limit INTEGER DEFAULT NULL, -- Số lần sử dụng tối đa (NULL = không giới hạn)
    used_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster code lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, start_date, end_date);

-- Sample data
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date)
VALUES 
    ('WELCOME10', 'Giảm 10% cho khách mới', 'percent', 10, 100000, 50000, 100, NOW(), NOW() + INTERVAL '30 days'),
    ('SAVE50K', 'Giảm 50,000đ cho đơn từ 200k', 'fixed', 50000, 200000, NULL, 50, NOW(), NOW() + INTERVAL '15 days'),
    ('VIP20', 'Giảm 20% cho khách VIP', 'percent', 20, 500000, 200000, NULL, NOW(), NOW() + INTERVAL '60 days')
ON CONFLICT (code) DO NOTHING;
