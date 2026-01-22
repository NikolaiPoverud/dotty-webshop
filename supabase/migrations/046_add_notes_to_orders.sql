-- Add notes column to orders table for admin notes and refund history
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
