package com.acme.assetmanagement.lookup;

import jakarta.persistence.*;

@Entity
@Table(name = "lookup_values", uniqueConstraints = @UniqueConstraint(columnNames = {"lookup_type", "name"}))
public class LookupValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "lookup_type", nullable = false, length = 30)
    private LookupType type;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_profile", length = 30)
    private AssetProfile assetProfile;

    protected LookupValue() {
    }

    public LookupValue(LookupType type, String name) {
        this(type, name, type == LookupType.CATEGORY ? AssetProfile.infer(name) : null);
    }

    public LookupValue(LookupType type, String name, AssetProfile assetProfile) {
        this.type = type;
        this.name = name;
        this.assetProfile = type == LookupType.CATEGORY
                ? (assetProfile == null ? AssetProfile.GENERAL : assetProfile)
                : null;
    }

    public Long getId() { return id; }
    public LookupType getType() { return type; }
    public String getName() { return name; }
    public AssetProfile getAssetProfile() { return assetProfile; }
    public void setAssetProfile(AssetProfile assetProfile) {
        this.assetProfile = type == LookupType.CATEGORY ? assetProfile : null;
    }
}
