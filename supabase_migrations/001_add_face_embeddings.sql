-- Step 1: Add the face_embeddings column to visitors table
-- Run this in Supabase SQL Editor

ALTER TABLE visitors 
ADD COLUMN face_embeddings jsonb DEFAULT NULL;

-- Add an index for faster queries
CREATE INDEX idx_visitors_has_embeddings 
ON visitors(id) 
WHERE face_embeddings IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'visitors' ORDER BY ordinal_position;
