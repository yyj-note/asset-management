package com.acme.assetmanagement.asset;

import com.acme.assetmanagement.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class AssetTagGenerator {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final AssetTagSequenceRepository sequenceRepository;
    private final AssetRepository assetRepository;

    public AssetTagGenerator(AssetTagSequenceRepository sequenceRepository, AssetRepository assetRepository) {
        this.sequenceRepository = sequenceRepository;
        this.assetRepository = assetRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public synchronized String nextTag() {
        LocalDate date = LocalDate.now(BUSINESS_ZONE);
        String prefix = DATE_FORMAT.format(date);
        AssetTagSequence sequence = sequenceRepository.findLockedByDate(date)
                .orElseGet(() -> new AssetTagSequence(date, latestExistingSuffix(prefix)));
        // CSV 仍允许导入既有编号，因此每次都与当天数据库中的最大编号对齐，避免流水落后后发生碰撞。
        int nextValue = Math.max(sequence.getLastValue(), latestExistingSuffix(prefix)) + 1;
        if (nextValue > 9999) {
            throw new ApiException(HttpStatus.CONFLICT, "当天资产编号已达到9999项，请联系管理员处理");
        }
        sequence.setLastValue(nextValue);
        sequenceRepository.save(sequence);
        return prefix + String.format("%04d", nextValue);
    }

    private int latestExistingSuffix(String prefix) {
        return assetRepository.findTopByAssetTagStartingWithOrderByAssetTagDesc(prefix)
                .map(Asset::getAssetTag)
                .filter(tag -> tag.matches(prefix + "\\d{4}"))
                .map(tag -> Integer.parseInt(tag.substring(8)))
                .orElse(0);
    }
}
