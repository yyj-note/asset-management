package com.acme.assetmanagement.setting;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SystemSettingController {
    private final SystemSettingService service;

    public SystemSettingController(SystemSettingService service) {
        this.service = service;
    }

    @GetMapping("/qr")
    public SystemSettingService.QrSettingResponse getQrSetting() {
        return service.getQrSetting();
    }

    @PutMapping("/qr")
    public SystemSettingService.QrSettingResponse updateQrSetting(@Valid @RequestBody UpdateQrSettingRequest request) {
        return service.updateQrBaseUrl(request.qrBaseUrl());
    }

    public record UpdateQrSettingRequest(
            @NotBlank(message = "请输入二维码访问地址") @Size(max = 500) String qrBaseUrl
    ) {}
}
