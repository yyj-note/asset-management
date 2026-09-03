package com.acme.assetmanagement.asset;

import com.acme.assetmanagement.setting.SystemSettingService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.IIOImage;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.metadata.IIOMetadataNode;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Map;

@Service
public class AssetQrCodeService {
    private static final int PRINTER_DPI = 203;
    private static final int PNG_PIXELS_PER_METER = Math.round(PRINTER_DPI / 0.0254f);

    public static final int LABEL_WIDTH_PX = 480;
    public static final int LABEL_HEIGHT_PX = 400;

    private static final int QR_SIZE_PX = 280;
    private static final int QR_Y_PX = 67;
    private static final int TOP_LINE_BASELINE_PX = 79;
    private static final int NUMBER_BASELINE_PX = 348;
    private static final int HORIZONTAL_SAFE_MARGIN_PX = 16;
    private static final String CJK_FONT_FAMILY = "Noto Sans CJK SC";

    private final SystemSettingService settingService;

    public AssetQrCodeService(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    public byte[] generatePng(AssetResponse asset) {
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            writePrinterPng(render(asset), output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("生成资产标签失败", exception);
        }
    }

    BufferedImage render(AssetResponse asset) {
        String targetUrl = settingService.requireQrBaseUrl() + "/?qr=" + asset.qrToken();
        try {
            BitMatrix matrix = new QRCodeWriter().encode(targetUrl, BarcodeFormat.QR_CODE, QR_SIZE_PX, QR_SIZE_PX, Map.of(
                    EncodeHintType.CHARACTER_SET, "UTF-8",
                    EncodeHintType.MARGIN, 4
            ));
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(matrix);
            BufferedImage labelImage = new BufferedImage(LABEL_WIDTH_PX, LABEL_HEIGHT_PX, BufferedImage.TYPE_BYTE_GRAY);
            Graphics2D graphics = labelImage.createGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);
            graphics.setColor(Color.BLACK);
            graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

            String topLine = companyShortName(asset) + " | " + labelPart(asset.ownershipDepartment(), "未指定部门")
                    + " | " + labelPart(asset.category() == null ? null : asset.category().name(), "未指定分类");
            int qrX = (LABEL_WIDTH_PX - QR_SIZE_PX) / 2;
            graphics.drawImage(qrImage, qrX, QR_Y_PX, null);

            drawCenteredFittedText(graphics, topLine, CJK_FONT_FAMILY, Font.BOLD, 30, 20,
                    LABEL_WIDTH_PX - HORIZONTAL_SAFE_MARGIN_PX * 2, TOP_LINE_BASELINE_PX);
            drawCenteredFittedText(graphics, asset.assetTag(), CJK_FONT_FAMILY, Font.BOLD, 30, 24,
                    LABEL_WIDTH_PX - HORIZONTAL_SAFE_MARGIN_PX * 2, NUMBER_BASELINE_PX);
            graphics.dispose();
            return labelImage;
        } catch (WriterException exception) {
            throw new IllegalStateException("生成资产标签失败", exception);
        }
    }

    private static String companyShortName(AssetResponse asset) {
        String fullName = asset.company() == null ? null : asset.company().name();
        String cleaned = labelPart(fullName, "未指定公司");
        String shortName = cleaned.replaceFirst("(有限责任公司|股份有限公司|有限公司)$", "")
                .replaceFirst("(信息技术|网络科技|科技)$", "")
                .trim();
        return shortName.isBlank() ? cleaned : shortName;
    }

    private static String labelPart(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.trim().replace('|', ' ');
    }

    private static void drawCenteredFittedText(Graphics2D graphics, String text, String family, int style,
                                                int maximumSize, int minimumSize, int maximumWidth, int baseline) {
        int size = maximumSize;
        Font font = new Font(family, style, size);
        FontMetrics metrics = graphics.getFontMetrics(font);
        while (size > minimumSize && metrics.stringWidth(text) > maximumWidth) {
            font = new Font(family, style, --size);
            metrics = graphics.getFontMetrics(font);
        }
        graphics.setFont(font);
        int x = Math.max(HORIZONTAL_SAFE_MARGIN_PX, (LABEL_WIDTH_PX - metrics.stringWidth(text)) / 2);
        graphics.drawString(text, x, baseline);
    }

    private static void writePrinterPng(BufferedImage image, ByteArrayOutputStream output) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("png");
        if (!writers.hasNext()) throw new IOException("当前运行环境没有PNG编码器");
        ImageWriter writer = writers.next();
        try (ImageOutputStream imageOutput = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(imageOutput);
            ImageWriteParam parameters = writer.getDefaultWriteParam();
            IIOMetadata metadata = writer.getDefaultImageMetadata(ImageTypeSpecifier.createFromRenderedImage(image), parameters);
            IIOMetadataNode root = new IIOMetadataNode("javax_imageio_png_1.0");
            IIOMetadataNode physical = new IIOMetadataNode("pHYs");
            physical.setAttribute("pixelsPerUnitXAxis", String.valueOf(PNG_PIXELS_PER_METER));
            physical.setAttribute("pixelsPerUnitYAxis", String.valueOf(PNG_PIXELS_PER_METER));
            physical.setAttribute("unitSpecifier", "meter");
            root.appendChild(physical);
            metadata.mergeTree("javax_imageio_png_1.0", root);
            writer.write(null, new IIOImage(image, null, metadata), parameters);
        } finally {
            writer.dispose();
        }
    }
}
