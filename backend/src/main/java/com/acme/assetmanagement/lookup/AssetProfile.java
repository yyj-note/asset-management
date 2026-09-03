package com.acme.assetmanagement.lookup;

public enum AssetProfile {
    COMPUTER("电脑设备"),
    DISPLAY("显示设备"),
    GENERAL("普通设备");

    private final String label;

    AssetProfile(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static AssetProfile infer(String categoryName) {
        String name = categoryName == null ? "" : categoryName.trim().toLowerCase();
        if (name.contains("显示器") || name.contains("屏幕") || name.contains("大屏") || name.contains("monitor")) {
            return DISPLAY;
        }
        if (name.contains("电脑") || name.contains("台式") || name.contains("笔记本")
                || name.contains("mac") || name.contains("主机") || name.contains("computer")) {
            return COMPUTER;
        }
        return GENERAL;
    }
}
