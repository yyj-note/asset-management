package com.acme.assetmanagement;

import com.acme.assetmanagement.asset.AssetRepository;
import com.acme.assetmanagement.audit.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:auditimportdb;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuditAndImportTest {
    @Autowired MockMvc mockMvc;
    @Autowired AssetRepository assetRepository;
    @Autowired AuditLogRepository auditLogRepository;

    @Test
    void onlySuperAdminCanReadAuditLogs() throws Exception {
        mockMvc.perform(get("/api/audit-logs").with(assetUser())).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/audit-logs").with(adminUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void previewsAndImportsValidCsvAsOneTransaction() throws Exception {
        MockMultipartFile file = csv("""
                资产编号*,资产名称*,所属公司*,电脑型号*,资产分类*,资产状态*,存放位置*,CPU,内存,硬盘,显卡,厂家序列号,采购价格(元),当前价值(元),领用人,图片地址,备注,关联设备(JSON)
                202600000099,导入测试电脑,新公司,新型号,笔记本电脑,当前可用,新仓库,i7,16G,512G,,CSV-SN-001,6999,6200,,,,"[{""name"":""鼠标"",""quantity"":1}]"
                """);

        mockMvc.perform(multipart("/api/assets/import/preview").file(file).with(assetUser()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canImport").value(true))
                .andExpect(jsonPath("$.totalRows").value(1));

        mockMvc.perform(multipart("/api/assets/import/commit").file(file).with(assetUser()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.importedCount").value(1));

        assertTrue(assetRepository.existsByAssetTagIgnoreCase("202600000099"));
        assertTrue(assetRepository.findAll().stream().anyMatch(asset -> "CSV-SN-001".equals(asset.getManufacturerSerialNumber())));
        assertTrue(auditLogRepository.findAll().stream().anyMatch(log -> "CSV_IMPORT".equals(log.getAction().name())));
    }

    @Test
    void rejectsCsvWithExistingAssetNumberWithoutWritingData() throws Exception {
        long before = assetRepository.count();
        MockMultipartFile file = csv("""
                资产编号*,资产名称*,所属公司*,电脑型号*,资产分类*,资产状态*,存放位置*
                202609010001,重复编号电脑,示例科技有限公司,ThinkPad T14 Gen 5,笔记本电脑,当前可用,总部 · 3楼设备间
                """);

        mockMvc.perform(multipart("/api/assets/import/preview").file(file).with(assetUser()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canImport").value(false))
                .andExpect(jsonPath("$.errors[0].field").value("资产编号*"));

        mockMvc.perform(multipart("/api/assets/import/commit").file(file).with(assetUser()).with(csrf()))
                .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(before, assetRepository.count());
    }

    private static MockMultipartFile csv(String content) {
        return new MockMultipartFile("file", "assets.csv", "text/csv",
                ("\uFEFF" + content).getBytes(StandardCharsets.UTF_8));
    }

    private static RequestPostProcessor assetUser() {
        return user("asset-tester").authorities(
                new SimpleGrantedAuthority("ROLE_USER"),
                new SimpleGrantedAuthority("ASSET_VIEW"),
                new SimpleGrantedAuthority("ASSET_CREATE"));
    }

    private static RequestPostProcessor adminUser() {
        return user("admin").authorities(
                new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"),
                new SimpleGrantedAuthority("ASSET_VIEW"));
    }
}
