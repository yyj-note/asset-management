package com.acme.assetmanagement.audit;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_occurred_at", columnList = "occurred_at"),
        @Index(name = "idx_audit_actor_time", columnList = "actor_user_id, occurred_at"),
        @Index(name = "idx_audit_target", columnList = "target_type, target_id"),
        @Index(name = "idx_audit_action_time", columnList = "action, occurred_at")
})
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(nullable = false, length = 120)
    private String actorUsername;

    @Column(length = 40)
    private String actorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditResult result;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(length = 240)
    private String targetLabel;

    @Column(nullable = false, length = 600)
    private String summary;

    @Lob
    private String changesJson;

    @Column(length = 80)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @PrePersist
    void beforeInsert() {
        if (occurredAt == null) occurredAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String actorUsername) { this.actorUsername = actorUsername; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public AuditAction getAction() { return action; }
    public void setAction(AuditAction action) { this.action = action; }
    public AuditResult getResult() { return result; }
    public void setResult(AuditResult result) { this.result = result; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getTargetLabel() { return targetLabel; }
    public void setTargetLabel(String targetLabel) { this.targetLabel = targetLabel; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getChangesJson() { return changesJson; }
    public void setChangesJson(String changesJson) { this.changesJson = changesJson; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
