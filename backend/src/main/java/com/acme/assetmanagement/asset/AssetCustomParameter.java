package com.acme.assetmanagement.asset;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class AssetCustomParameter {
    @Column(name = "parameter_name", nullable = false, length = 120)
    private String name;

    @Column(name = "parameter_value", nullable = false, length = 1000)
    private String value;

    protected AssetCustomParameter() {}

    public AssetCustomParameter(String name, String value) {
        this.name = name;
        this.value = value;
    }

    public String getName() { return name; }
    public String getValue() { return value; }
}
