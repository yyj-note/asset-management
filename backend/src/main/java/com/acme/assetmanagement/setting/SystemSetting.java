package com.acme.assetmanagement.setting;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
public class SystemSetting {
    @Id
    @Column(name = "setting_key", length = 80)
    private String key;

    @Column(name = "setting_value", length = 500)
    private String value;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected SystemSetting() {}

    public SystemSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public String getKey() { return key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
