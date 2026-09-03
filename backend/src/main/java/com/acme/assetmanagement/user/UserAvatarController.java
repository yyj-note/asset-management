package com.acme.assetmanagement.user;

import com.acme.assetmanagement.audit.AuditAction;
import com.acme.assetmanagement.audit.AuditLogService;
import com.acme.assetmanagement.common.ApiException;
import com.acme.assetmanagement.security.AccountPrincipal;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserAvatarController {
    private static final long MAX_AVATAR_BYTES = 2L * 1024L * 1024L;

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public UserAvatarController(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/users/{id}/avatar")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long id,
                                             @AuthenticationPrincipal AccountPrincipal principal) {
        if (!id.equals(principal.id()) && principal.role() != UserRole.SUPER_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "无权查看其他用户头像");
        }
        UserAccount account = requireAccount(id);
        if (!account.hasAvatar()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "该用户尚未设置头像");
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(account.getAvatarContentType()))
                .body(account.getAvatarData());
    }

    @PutMapping(path = "/auth/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public AvatarResponse uploadMyAvatar(@RequestParam("file") MultipartFile file,
                                         @AuthenticationPrincipal AccountPrincipal principal) {
        byte[] data = readAndValidate(file);
        String contentType = detectContentType(data);
        UserAccount account = requireAccount(principal.id());
        account.setAvatarData(data);
        account.setAvatarContentType(contentType);
        userRepository.save(account);
        auditLogService.success(AuditAction.AVATAR_UPDATE, "USER", account.getId(), account.getUsername(),
                "用户“" + account.getUsername() + "”更新了头像", Map.of("图片类型", contentType));
        return new AvatarResponse(true);
    }

    @DeleteMapping("/auth/avatar")
    @Transactional
    public AvatarResponse deleteMyAvatar(@AuthenticationPrincipal AccountPrincipal principal) {
        UserAccount account = requireAccount(principal.id());
        clearAvatar(account);
        auditLogService.success(AuditAction.AVATAR_DELETE, "USER", account.getId(), account.getUsername(),
                "用户“" + account.getUsername() + "”删除了自己的头像", Map.of());
        return new AvatarResponse(false);
    }

    @DeleteMapping("/users/{id}/avatar")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public AvatarResponse clearUserAvatar(@PathVariable Long id) {
        UserAccount account = requireAccount(id);
        if (account.getRole() == UserRole.SUPER_ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "超级管理员头像只能由本人修改或删除");
        }
        clearAvatar(account);
        auditLogService.success(AuditAction.AVATAR_DELETE, "USER", account.getId(), account.getUsername(),
                "超级管理员清除了普通用户“" + account.getUsername() + "”的头像", Map.of());
        return new AvatarResponse(false);
    }

    private void clearAvatar(UserAccount account) {
        account.setAvatarData(null);
        account.setAvatarContentType(null);
        userRepository.save(account);
    }

    private UserAccount requireAccount(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private byte[] readAndValidate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请选择头像图片");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "头像不能超过2MB");
        }
        try {
            byte[] data = file.getBytes();
            detectContentType(data);
            return data;
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "无法读取头像图片");
        }
    }

    private String detectContentType(byte[] data) {
        if (startsWith(data, 0xFF, 0xD8, 0xFF)) return MediaType.IMAGE_JPEG_VALUE;
        if (startsWith(data, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) return MediaType.IMAGE_PNG_VALUE;
        if (data.length >= 12 && startsWith(data, 0x52, 0x49, 0x46, 0x46)
                && startsWithAt(data, 8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
        throw new ApiException(HttpStatus.BAD_REQUEST, "仅支持JPG、PNG或WebP图片");
    }

    private boolean startsWith(byte[] data, int... signature) {
        return startsWithAt(data, 0, signature);
    }

    private boolean startsWithAt(byte[] data, int offset, int... signature) {
        if (data.length < offset + signature.length) return false;
        for (int index = 0; index < signature.length; index++) {
            if ((data[offset + index] & 0xFF) != signature[index]) return false;
        }
        return true;
    }

    public record AvatarResponse(boolean hasAvatar) {}
}
