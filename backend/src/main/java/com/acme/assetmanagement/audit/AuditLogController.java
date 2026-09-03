package com.acme.assetmanagement.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AuditLogController {
    private final AuditLogRepository repository;

    public AuditLogController(AuditLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public AuditPage list(@RequestParam(defaultValue = "0") int page,
                          @RequestParam(defaultValue = "50") int size,
                          @RequestParam(defaultValue = "") String username,
                          @RequestParam(defaultValue = "") String module,
                          @RequestParam(defaultValue = "") String action,
                          @RequestParam(defaultValue = "") String result,
                          @RequestParam(defaultValue = "") String keyword,
                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        int safeSize = Math.max(1, Math.min(size, 200));
        Page<AuditLog> data = repository.findAll(specification(username, module, action, result, keyword, from, to),
                PageRequest.of(Math.max(0, page), safeSize, Sort.by(Sort.Direction.DESC, "occurredAt")));
        return new AuditPage(data.getContent().stream().map(AuditResponse::from).toList(), data.getNumber(),
                data.getSize(), data.getTotalElements(), data.getTotalPages());
    }

    @GetMapping(value = "/export.csv", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue = "") String username,
                                         @RequestParam(defaultValue = "") String module,
                                         @RequestParam(defaultValue = "") String action,
                                         @RequestParam(defaultValue = "") String result,
                                         @RequestParam(defaultValue = "") String keyword,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<AuditLog> rows = repository.findAll(specification(username, module, action, result, keyword, from, to),
                Sort.by(Sort.Direction.DESC, "occurredAt"));
        StringBuilder csv = new StringBuilder("\uFEFF时间,账号,角色,模块,操作,对象,结果,说明,IP地址\r\n");
        rows.forEach(row -> csv.append(csv(row.getOccurredAt())).append(',')
                .append(csv(row.getActorUsername())).append(',').append(csv(row.getActorRole())).append(',')
                .append(csv(row.getAction().getModule())).append(',').append(csv(row.getAction().getLabel())).append(',')
                .append(csv(row.getTargetLabel())).append(',').append(csv(row.getResult() == AuditResult.SUCCESS ? "成功" : "失败")).append(',')
                .append(csv(row.getSummary())).append(',').append(csv(row.getIpAddress())).append("\r\n"));
        String disposition = ContentDisposition.attachment().filename("audit-logs.csv", StandardCharsets.UTF_8).build().toString();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header("Content-Disposition", disposition)
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8)).body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private Specification<AuditLog> specification(String username, String module, String action, String result,
                                                   String keyword, LocalDate from, LocalDate to) {
        Specification<AuditLog> spec = (root, query, cb) -> cb.conjunction();
        if (!username.isBlank()) spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("actorUsername")), "%" + username.trim().toLowerCase() + "%"));
        if (!module.isBlank()) {
            List<AuditAction> moduleActions = java.util.Arrays.stream(AuditAction.values())
                    .filter(value -> value.getModule().equals(module.trim())).toList();
            spec = moduleActions.isEmpty()
                    ? spec.and((root, query, cb) -> cb.disjunction())
                    : spec.and((root, query, cb) -> root.get("action").in(moduleActions));
        }
        if (!action.isBlank()) {
            try { spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), AuditAction.valueOf(action))); }
            catch (IllegalArgumentException ignored) { spec = spec.and((root, query, cb) -> cb.disjunction()); }
        }
        if (!result.isBlank()) {
            try { spec = spec.and((root, query, cb) -> cb.equal(root.get("result"), AuditResult.valueOf(result))); }
            catch (IllegalArgumentException ignored) { spec = spec.and((root, query, cb) -> cb.disjunction()); }
        }
        if (!keyword.isBlank()) {
            String like = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("targetLabel")), like),
                    cb.like(cb.lower(root.get("summary")), like), cb.like(cb.lower(root.get("actorUsername")), like)));
        }
        if (from != null) {
            LocalDateTime start = from.atStartOfDay();
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("occurredAt"), start));
        }
        if (to != null) {
            LocalDateTime end = to.plusDays(1).atStartOfDay();
            spec = spec.and((root, query, cb) -> cb.lessThan(root.get("occurredAt"), end));
        }
        return spec;
    }

    private static String csv(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        return '"' + text.replace("\"", "\"\"") + '"';
    }

    public record AuditPage(List<AuditResponse> items, int page, int size, long totalElements, int totalPages) {}
    public record AuditResponse(Long id, LocalDateTime occurredAt, Long actorUserId, String actorUsername,
                                String actorRole, AuditAction action, String module, String actionLabel,
                                AuditResult result, String targetType, Long targetId, String targetLabel,
                                String summary, String changesJson, String ipAddress, String userAgent) {
        static AuditResponse from(AuditLog row) {
            return new AuditResponse(row.getId(), row.getOccurredAt(), row.getActorUserId(), row.getActorUsername(),
                    row.getActorRole(), row.getAction(), row.getAction().getModule(), row.getAction().getLabel(),
                    row.getResult(), row.getTargetType(), row.getTargetId(), row.getTargetLabel(), row.getSummary(),
                    row.getChangesJson(), row.getIpAddress(), row.getUserAgent());
        }
    }
}
