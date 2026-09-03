-- 仅用于当前测试数据：按资产主键顺序重编号为 202609010001、202609010002……
-- 二维码 qr_token、资产主键和业务关联均保持不变。

CREATE TABLE IF NOT EXISTS asset_tag_sequences (
    sequence_date DATE NOT NULL,
    last_sequence_value INT NOT NULL,
    PRIMARY KEY (sequence_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

START TRANSACTION;

CREATE TEMPORARY TABLE test_asset_tag_mapping (
    asset_id BIGINT NOT NULL PRIMARY KEY,
    new_asset_tag CHAR(12) NOT NULL UNIQUE
);

INSERT INTO test_asset_tag_mapping (asset_id, new_asset_tag)
SELECT ranked.id,
       CONCAT('20260901', LPAD(ranked.sequence_number, 4, '0'))
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS sequence_number
    FROM assets
) AS ranked;

-- 先换成不可能由系统生成的临时值，避开 asset_tag 唯一索引冲突。
UPDATE assets
SET asset_tag = CONCAT('TMP-', id, '-', REPLACE(UUID(), '-', ''));

UPDATE assets AS asset
JOIN test_asset_tag_mapping AS mapping ON mapping.asset_id = asset.id
SET asset.asset_tag = mapping.new_asset_tag;

-- 让后续自动编号从当前最大后缀继续，而不是重新尝试 0001。
DELETE FROM asset_tag_sequences
WHERE sequence_date = '2026-09-01';

INSERT INTO asset_tag_sequences (sequence_date, last_sequence_value)
SELECT '2026-09-01', COUNT(*)
FROM assets;

COMMIT;

SELECT id, asset_tag, name
FROM assets
ORDER BY id;
