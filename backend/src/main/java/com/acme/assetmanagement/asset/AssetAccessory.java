package com.acme.assetmanagement.asset;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class AssetAccessory {
    @Column(name = "accessory_name", nullable = false, length = 120)
    private String name;

    @Column(name = "accessory_specification", length = 200)
    private String specification;

    @Column(name = "accessory_quantity", nullable = false)
    private int quantity = 1;

    public AssetAccessory() {}

    public AssetAccessory(String name, String specification, int quantity) {
        this.name = name;
        this.specification = specification;
        this.quantity = quantity;
    }

    public String getName() { return name; }
    public String getSpecification() { return specification; }
    public int getQuantity() { return quantity; }
}
