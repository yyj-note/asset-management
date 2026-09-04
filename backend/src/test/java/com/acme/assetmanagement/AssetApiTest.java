package com.acme.assetmanagement;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.acme.assetmanagement.lookup.LookupRepository;
import com.acme.assetmanagement.lookup.LookupType;
import com.acme.assetmanagement.asset.AssetRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.awt.image.BufferedImage;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AssetApiTest {
    @Autowired MockMvc mockMvc;
    @Autowired LookupRepository lookupRepository;
    @Autowired AssetRepository assetRepository;

    @Test
    void listsSeedAsset() throws Exception {
        mockMvc.perform(get("/api/assets").with(assetUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].assetTag", hasItem("202609010001")))
                .andExpect(jsonPath("$[?(@.assetTag == '202609010001')].cpu", hasItem("Intel Core Ultra 7 155U")))
                .andExpect(jsonPath("$[?(@.assetTag == '202609010001')].memory", hasItem("32GB DDR5")))
                .andExpect(jsonPath("$[?(@.assetTag == '202609010001')].storage", hasItem("1TB NVMe SSD")))
                .andExpect(jsonPath("$[?(@.assetTag == '202609010001')].graphicsCard", hasItem("Intel Graphics 集成显卡")))
                .andExpect(jsonPath("$[?(@.assetTag == '202609010001')].createdAt").exists())
                .andExpect(jsonPath("$[?(@.assetTag == '202609010001')].updatedAt").exists());
    }

    @Test
    void qrAssetRecordIsPublicReadOnlyAndHidesSensitiveFields() throws Exception {
        var asset = assetRepository.findAll().stream()
                .filter(item -> "202609010001".equals(item.getAssetTag()))
                .findFirst().orElseThrow();

        mockMvc.perform(get("/api/public/assets/{qrToken}", asset.getQrToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assetTag").value("202609010001"))
                .andExpect(jsonPath("$.computerModel").isNotEmpty())
                .andExpect(jsonPath("$.status").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.purchasePrice").doesNotExist())
                .andExpect(jsonPath("$.currentValue").doesNotExist())
                .andExpect(jsonPath("$.notes").doesNotExist())
                .andExpect(jsonPath("$.qrToken").doesNotExist());

        mockMvc.perform(get("/api/public/assets/not-a-real-token"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/assets"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void downloadsUtf8CsvImportTemplateWithoutAssetData() throws Exception {
        byte[] csv = mockMvc.perform(get("/api/assets/export/template.csv").with(assetUser()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("asset-import-template.csv")))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")))
                .andReturn().getResponse().getContentAsByteArray();

        assertTrue(csv.length > 3);
        assertEquals((byte) 0xEF, csv[0]);
        assertEquals((byte) 0xBB, csv[1]);
        assertEquals((byte) 0xBF, csv[2]);
        String text = new String(csv, StandardCharsets.UTF_8);
        assertTrue(text.contains("资产编号*,资产名称*,所属公司*,归属部门"));
        assertTrue(text.contains("显卡,厂家序列号,屏幕尺寸,分辨率,显示接口,订单号,采购价格(元)"));
        assertTrue(text.contains("随附配件(JSON)"));
        assertFalse(text.contains("关联设备(JSON)"));
        assertFalse(text.contains("202609010001"));
        assertEquals(1, text.lines().count());
    }

    @Test
    void generatesQrCodePointingToLatestAssetRecord() throws Exception {
        mockMvc.perform(get("/api/settings/qr").with(assetUser()))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/settings/qr").with(adminUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrBaseUrl\":\"http://asset.example.test/\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrBaseUrl").value("http://asset.example.test"))
                .andExpect(jsonPath("$.source").value("DATABASE"));

        String assets = mockMvc.perform(get("/api/assets").with(assetUser()))
                .andReturn().getResponse().getContentAsString();
        String qrToken = assets.replaceFirst("(?s).*?\\\"qrToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
        byte[] png = mockMvc.perform(get("/api/assets/1/qr").with(assetUser()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andReturn().getResponse().getContentAsByteArray();

        BufferedImage labelImage = ImageIO.read(new ByteArrayInputStream(png));
        assertEquals(480, labelImage.getWidth());
        assertEquals(400, labelImage.getHeight());
        String target = new MultiFormatReader().decode(new BinaryBitmap(new HybridBinarizer(
                new BufferedImageLuminanceSource(labelImage)))).getText();
        assertEquals("http://asset.example.test/?qr=" + qrToken, target);
    }

    @Test
    void automaticallyGeneratesSequentialTwelveDigitAssetTags() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.STATUS, "可领用").orElseThrow().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();
        String body = """
                {"assetTag":"","name":"自动编号测试资产","ownershipDepartment":"研发部",
                 "companyId":%d,"modelId":%d,"categoryId":%d,"statusId":%d,"locationId":%d,
                 "checkedOut":false}
                """.formatted(companyId, modelId, categoryId, statusId, locationId);

        String first = mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ownershipDepartment").value("研发部"))
                .andReturn().getResponse().getContentAsString();
        String second = mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body.replace("自动编号测试资产", "自动编号测试资产二")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String prefix = LocalDate.now(ZoneId.of("Asia/Shanghai")).toString().replace("-", "");
        String firstTag = first.replaceFirst("(?s).*?\\\"assetTag\\\":\\\"(\\d{12})\\\".*", "$1");
        String secondTag = second.replaceFirst("(?s).*?\\\"assetTag\\\":\\\"(\\d{12})\\\".*", "$1");
        assertTrue(firstTag.startsWith(prefix));
        assertTrue(secondTag.startsWith(prefix));
        assertEquals(Integer.parseInt(firstTag.substring(8)) + 1, Integer.parseInt(secondTag.substring(8)));
    }

    @Test
    void deletesUnusedLookupButProtectsOptionsUsedByAssets() throws Exception {
        String created = mockMvc.perform(post("/api/lookups").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CATEGORY\",\"name\":\"临时分类\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long lookupId = Long.parseLong(created.replaceFirst("^\\{\"id\":(\\d+).*", "$1"));

        mockMvc.perform(delete("/api/lookups/{id}", lookupId).with(assetUser()).with(csrf()))
                .andExpect(status().isNoContent());

        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        mockMvc.perform(delete("/api/lookups/{id}", companyId).with(assetUser()).with(csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("正在被")));
    }

    @Test
    void manuallyDeletesAssetNameSuggestionWithoutDeletingExistingAsset() throws Exception {
        var asset = assetRepository.findAll().stream()
                .filter(item -> "202609010001".equals(item.getAssetTag()))
                .findFirst().orElseThrow();
        var suggestion = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.ASSET_NAME, asset.getName())
                .orElseThrow();

        mockMvc.perform(delete("/api/lookups/{id}", suggestion.getId()).with(assetUser()).with(csrf()))
                .andExpect(status().isNoContent());

        assertTrue(lookupRepository.findByTypeAndNameIgnoreCase(LookupType.ASSET_NAME, asset.getName()).isEmpty());
        assertEquals(asset.getName(), assetRepository.findById(asset.getId()).orElseThrow().getName());
    }

    @Test
    void protectsSystemStatusOptionsFromCreationAndDeletion() throws Exception {
        assertTrue(lookupRepository.findByTypeAndNameIgnoreCase(LookupType.STATUS, "已报废").isPresent());

        mockMvc.perform(post("/api/lookups").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"STATUS\",\"name\":\"待报废\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("资产状态是系统固定选项，不能新建"));

        long statusId = lookupRepository.findByTypeOrderByNameAsc(LookupType.STATUS).getFirst().getId();
        mockMvc.perform(delete("/api/lookups/{id}", statusId).with(assetUser()).with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("资产状态是系统固定选项，不能删除"));
    }

    @Test
    void countsScrappedAssetsSeparatelyFromAvailableAssets() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.STATUS, "已报废").orElseThrow().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();
        String body = """
                {"assetTag":"202600000088","name":"报废测试电脑","companyId":%d,"modelId":%d,
                 "categoryId":%d,"statusId":%d,"locationId":%d,"checkedOut":true,"assignedTo":"历史领用人"}
                """.formatted(companyId, modelId, categoryId, statusId, locationId);

        mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status.name").value("已报废"))
                .andExpect(jsonPath("$.checkedOut").value(false))
                .andExpect(jsonPath("$.assignedTo").doesNotExist());

        mockMvc.perform(get("/api/assets/summary").with(assetUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scrapped").value(1))
                .andExpect(jsonPath("$.available").value(1))
                .andExpect(jsonPath("$.checkedOut").value(0));
    }

    @Test
    void updatesAssetWithUnifiedRelatedDevicesAndNoLegacyAccessoryRows() throws Exception {
        long assetId = assetRepository.findAll().stream()
                .filter(asset -> "202609010001".equals(asset.getAssetTag()))
                .findFirst().orElseThrow().getId();
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.STATUS, "可领用").orElseThrow().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();
        String body = """
                {"assetTag":"202609010001","name":"更新后的资产","companyId":%d,"modelId":%d,
                 "modelName":"ThinkPad T14 Gen 5","categoryId":%d,"statusId":%d,"locationId":%d,
                 "cpu":"i7","memory":"32G","storage":"1T","checkedOut":false,
                 "imageUrl":"data:image/png;base64,bGVnYWN5",
                 "imageUrls":["data:image/png;base64,aW1hZ2Ux","data:image/png;base64,aW1hZ2Uy"],"notes":"更新测试",
                 "relatedDevices":[{"name":"鼠标","model":"M90","specification":"USB","quantity":1}],
                 "accessories":[]}
                """.formatted(companyId, modelId, categoryId, statusId, locationId);

        mockMvc.perform(put("/api/assets/{id}", assetId).with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("更新后的资产"))
                .andExpect(jsonPath("$.imageUrl").value("data:image/png;base64,aW1hZ2Ux"))
                .andExpect(jsonPath("$.imageUrls.length()").value(2))
                .andExpect(jsonPath("$.relatedDevices[0].name").value("鼠标"))
                .andExpect(jsonPath("$.accessories").isEmpty());

        assertTrue(lookupRepository.findByTypeAndNameIgnoreCase(LookupType.CPU, "i7").isPresent());

        String changedNumber = body.replace("202609010001", "202609010099");
        mockMvc.perform(put("/api/assets/{id}", assetId).with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(changedNumber))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("编号不能修改")));

        String tooManyImages = body.replace(
                "\"data:image/png;base64,aW1hZ2Ux\",\"data:image/png;base64,aW1hZ2Uy\"",
                "\"1\",\"2\",\"3\",\"4\",\"5\",\"6\"");
        mockMvc.perform(put("/api/assets/{id}", assetId).with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(tooManyImages))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("资产图片最多上传5张"));
    }

    @Test
    void createsComputerModelFromEditableInput() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeOrderByNameAsc(LookupType.STATUS).getFirst().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();
        String body = """
                {"assetTag":"202600000009","name":"自定义型号电脑","companyId":%d,
                 "modelName":"Framework Laptop 16","categoryId":%d,"statusId":%d,"locationId":%d,
                 "memory":"64G","checkedOut":false}
                """.formatted(companyId, categoryId, statusId, locationId);

        mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.model.name").value("Framework Laptop 16"))
                .andExpect(jsonPath("$.memory").value("64G"));
    }

    @Test
    void storesSearchesAndProtectsUniqueManufacturerSerialNumber() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeOrderByNameAsc(LookupType.STATUS).getFirst().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();
        String body = "{\"assetTag\":\"202600000066\",\"name\":\"序列号测试电脑\","
                + "\"companyId\":" + companyId + ",\"modelId\":" + modelId + ","
                + "\"categoryId\":" + categoryId + ",\"statusId\":" + statusId + ","
                + "\"locationId\":" + locationId + ",\"manufacturerSerialNumber\":\"PF-ABC-001\","
                + "\"checkedOut\":false}";

        mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.manufacturerSerialNumber").value("PF-ABC-001"));

        mockMvc.perform(get("/api/assets").param("search", "pf-abc-001").with(assetUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].assetTag").value("202600000066"));

        mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("202600000066", "202600000067").replace("序列号测试电脑", "重复序列号电脑")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("已被其他资产使用")));
    }

    @Test
    void createsLookupAndRejectsDuplicate() throws Exception {
        String body = "{\"type\":\"LOCATION\",\"name\":\"北京仓库\"}";
        mockMvc.perform(post("/api/lookups").with(assetUser()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("北京仓库"));

        mockMvc.perform(post("/api/lookups").with(assetUser()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsWrongLookupType() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeOrderByNameAsc(LookupType.STATUS).getFirst().getId();
        String body = """
                {"assetTag":"202600000002","name":"测试资产","companyId":%d,"modelId":%d,
                 "categoryId":%d,"statusId":%d,"locationId":%d,"checkedOut":false}
                """.formatted(companyId, modelId, categoryId, statusId, companyId);

        mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("位置选项类型不正确"));
    }

    @Test
    void returnsCheckedOutAssetAndClearsAssignee() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.STATUS, "在用").orElseThrow().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();
        String body = """
                {"assetTag":"202600000003","name":"待归还电脑","companyId":%d,"modelId":%d,
                 "categoryId":%d,"statusId":%d,"locationId":%d,"checkedOut":true,
                 "assignedTo":"张三",
                 "relatedDevices":[{"name":"显示器","model":"Dell U2723QE","serialNumber":"MONITOR-001","orderNumber":"PO-2026-0819","specification":"27英寸 4K","quantity":2}],
                 "accessories":[{"name":"鼠标","specification":"罗技 M90","quantity":1},{"name":"充电器","specification":"65W Type-C","quantity":1}]}
                """.formatted(companyId, modelId, categoryId, statusId, locationId);

        String created = mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assignedTo").value("张三"))
                .andExpect(jsonPath("$.relatedDevices[0].quantity").value(2))
                .andExpect(jsonPath("$.relatedDevices[0].orderNumber").value("PO-2026-0819"))
                .andExpect(jsonPath("$.accessories[1].name").value("充电器"))
                .andReturn().getResponse().getContentAsString();
        long assetId = Long.parseLong(created.replaceFirst("^\\{\\\"id\\\":(\\d+).*", "$1"));
        String qrToken = created.replaceFirst("(?s).*?\\\"qrToken\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mockMvc.perform(post("/api/assets/qr/{qrToken}/return", qrToken).with(csrf()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/assets/qr/{qrToken}/return", qrToken).with(assetUser()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkedOut").value(false))
                .andExpect(jsonPath("$.assignedTo").doesNotExist())
                .andExpect(jsonPath("$.status.name").value("可领用"))
                .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(delete("/api/assets/{id}", assetId).with(assetUser()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void requiresAssigneeWhenStatusMeansCheckedOut() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long categoryId = lookupRepository.findByTypeOrderByNameAsc(LookupType.CATEGORY).getFirst().getId();
        long statusId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.STATUS, "在用").orElseThrow().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();
        String body = """
                {"assetTag":"202600000077","name":"缺少领用人测试","companyId":%d,"modelId":%d,
                 "categoryId":%d,"statusId":%d,"locationId":%d,"checkedOut":false}
                """.formatted(companyId, modelId, categoryId, statusId, locationId);

        mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("资产状态为“已经领出”时，必须填写领用人"));
    }

    @Test
    void bindsIndependentDisplayAssetToComputerAndExposesBothDirections() throws Exception {
        long companyId = lookupRepository.findByTypeOrderByNameAsc(LookupType.COMPANY).getFirst().getId();
        long modelId = lookupRepository.findByTypeOrderByNameAsc(LookupType.MODEL).getFirst().getId();
        long computerCategoryId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.CATEGORY, "台式机")
                .orElseThrow().getId();
        long displayCategoryId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.CATEGORY, "显示器")
                .orElseThrow().getId();
        long statusId = lookupRepository.findByTypeAndNameIgnoreCase(LookupType.STATUS, "可领用")
                .orElseThrow().getId();
        long locationId = lookupRepository.findByTypeOrderByNameAsc(LookupType.LOCATION).getFirst().getId();

        String displayBody = """
                {"assetTag":"930000000001","name":"接口测试显示器","companyId":%d,"modelId":%d,
                 "categoryId":%d,"statusId":%d,"locationId":%d,"screenSize":"27英寸",
                 "displayResolution":"4K","displayInterface":"HDMI / DP","cpu":"不应保留","checkedOut":false}
                """.formatted(companyId, modelId, displayCategoryId, statusId, locationId);
        String displayJson = mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(displayBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.screenSize").value("27英寸"))
                .andExpect(jsonPath("$.displayResolution").value("4K"))
                .andExpect(jsonPath("$.cpu").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        long displayId = Long.parseLong(displayJson.replaceFirst("^\\{\\\"id\\\":(\\d+).*", "$1"));

        String computerBody = """
                {"assetTag":"930000000002","name":"接口测试电脑","companyId":%d,"modelId":%d,
                 "categoryId":%d,"statusId":%d,"locationId":%d,"cpu":"i7-14700",
                 "screenSize":"不应保留","boundDisplayIds":[%d],"checkedOut":false}
                """.formatted(companyId, modelId, computerCategoryId, statusId, locationId, displayId);
        String computerJson = mockMvc.perform(post("/api/assets").with(assetUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(computerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cpu").value("i7-14700"))
                .andExpect(jsonPath("$.screenSize").doesNotExist())
                .andExpect(jsonPath("$.boundDisplays[0].assetTag").value("930000000001"))
                .andReturn().getResponse().getContentAsString();
        long computerId = Long.parseLong(computerJson.replaceFirst("^\\{\\\"id\\\":(\\d+).*", "$1"));

        mockMvc.perform(get("/api/assets/{id}", displayId).with(assetUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boundComputer.id").value(computerId))
                .andExpect(jsonPath("$.boundComputer.assetTag").value("930000000002"));
    }

    private static RequestPostProcessor assetUser() {
        return user("asset-tester").authorities(
                new SimpleGrantedAuthority("ASSET_VIEW"),
                new SimpleGrantedAuthority("ASSET_CREATE"),
                new SimpleGrantedAuthority("ASSET_EDIT"),
                new SimpleGrantedAuthority("ASSET_DELETE"),
                new SimpleGrantedAuthority("ASSET_RETURN"));
    }

    private static RequestPostProcessor adminUser() {
        return user("admin").roles("SUPER_ADMIN").authorities(
                new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"),
                new SimpleGrantedAuthority("ASSET_VIEW"));
    }
}
