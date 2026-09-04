-- 先确认生产库中的真实字段类型。当前代码要求 asset_images.image_url 为 VARCHAR(1024)。
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('assets', 'asset_images')
  AND COLUMN_NAME = 'image_url';

-- 新版本会把 Base64 保存成图片文件，此表只记录类似
-- /api/public/asset-images/0123456789abcdef0123456789abcdef.jpg 的 URL。
ALTER TABLE asset_images
  MODIFY COLUMN image_url VARCHAR(1024) NOT NULL;
