package com.acme.assetmanagement.asset;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class AssetCsvTemplateService {
    private static final String UTF8_BOM = "\uFEFF";

    private static final String[] HEADERS = {
            "资产编号*",
            "资产名称*",
            "所属公司*",
            "归属部门",
            "设备型号*",
            "资产分类*",
            "资产状态*",
            "存放位置*",
            "CPU",
            "内存",
            "硬盘",
            "显卡",
            "厂家序列号",
            "屏幕尺寸",
            "分辨率",
            "显示接口",
            "订单号",
            "采购价格(元)",
            "当前价值(元)",
            "领用人",
            "图片地址",
            "备注",
            "绑定显示器资产编号(分号分隔)",
            "绑定电脑资产编号",
            "随附配件(JSON)"
    };

    public byte[] createEmptyTemplate() {
        return (UTF8_BOM + String.join(",", HEADERS) + "\r\n").getBytes(StandardCharsets.UTF_8);
    }
}
