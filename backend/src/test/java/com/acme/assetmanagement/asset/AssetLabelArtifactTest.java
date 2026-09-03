package com.acme.assetmanagement.asset;

import com.acme.assetmanagement.setting.SystemSettingService;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:label-regression;DB_CLOSE_DELAY=-1")
@ActiveProfiles("test")
@Transactional
class AssetLabelArtifactTest {
    @Autowired AssetRepository assetRepository;
    @Autowired AssetQrCodeService assetQrCodeService;
    @Autowired SystemSettingService systemSettingService;

    @Test
    void generatesPrinterSizedQrAndAssetNumberLabel() throws Exception {
        systemSettingService.updateQrBaseUrl("https://asset.example.test");
        Asset asset = assetRepository.findAll().stream().findFirst().orElseThrow();

        byte[] png = assetQrCodeService.generatePng(AssetResponse.from(asset));
        var image = ImageIO.read(new ByteArrayInputStream(png));

        assertTrue(png.length > 1_000);
        assertEquals(480, image.getWidth());
        assertEquals(400, image.getHeight());
        assertTrue(hasBlackPixel(image, 0, 45, 480, 50));
        assertTrue(hasBlackPixel(image, 0, 300, 480, 45));
        var bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));
        assertEquals("https://asset.example.test/?qr=" + asset.getQrToken(),
                new MultiFormatReader().decode(bitmap).getText());
    }

    private static boolean hasBlackPixel(java.awt.image.BufferedImage image, int x, int y, int width, int height) {
        for (int currentY = y; currentY < y + height; currentY++) {
            for (int currentX = x; currentX < x + width; currentX++) {
                if ((image.getRGB(currentX, currentY) & 0x00ffffff) == 0) return true;
            }
        }
        return false;
    }
}
