package com.acme.assetmanagement;

import com.acme.assetmanagement.config.DataInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:initializerdb;DB_CLOSE_DELAY=-1")
@ActiveProfiles("test")
class DataInitializerTest {
    @Autowired
    DataInitializer dataInitializer;

    @Test
    void rerunsLegacyNormalizationAgainstExistingAssetsInsideTransaction() {
        assertDoesNotThrow(() -> dataInitializer.run());
    }
}
