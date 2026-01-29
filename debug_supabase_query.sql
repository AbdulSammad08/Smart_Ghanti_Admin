-- Copy this SQL and run it in your Supabase SQL Editor
-- This will show you if embeddings exist for your visitors

SELECT 
  id,
  name,
  status,
  (face_embeddings IS NOT NULL AND face_embeddings != '[]'::jsonb) as has_embeddings,
  CASE 
    WHEN face_embeddings IS NULL THEN 'NULL'
    WHEN face_embeddings = '[]'::jsonb THEN 'EMPTY ARRAY'
    ELSE 'HAS DATA'
  END as embedding_status,
  jsonb_array_length(COALESCE(face_embeddings, '[]'::jsonb)) as num_embeddings
FROM visitors
ORDER BY name;

-- Also check how many visitors are active
SELECT COUNT(*) as total_visitors FROM visitors;
SELECT COUNT(*) as active_visitors FROM visitors WHERE status = 'active';
SELECT COUNT(*) as visitors_with_embeddings 
FROM visitors 
WHERE face_embeddings IS NOT NULL AND face_embeddings != '[]'::jsonb;

-- If you have 4 images stored, check the images table (adjust table name if different)
SELECT * FROM visitor_photos LIMIT 10;  -- Or whatever your image storage table is called
