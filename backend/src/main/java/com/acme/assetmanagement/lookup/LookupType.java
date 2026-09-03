package com.acme.assetmanagement.lookup;

public enum LookupType {
    COMPANY("公司"),
    MODEL("设备型号"),
    CPU("CPU"),
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
