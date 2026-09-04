package com.acme.assetmanagement.lookup;

public enum LookupType {
    COMPANY("公司"),
    ASSET_NAME("资产名称"),
    DEPARTMENT("归属部门"),
    MODEL("设备型号"),
    CPU("CPU"),
    GRAPHICS_CARD("显卡"),
    CATEGORY("分类"),
    STATUS("状态"),
    LOCATION("位置");

    private final String label;

    LookupType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
