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
    @Autowired com.acme.assetmanagement.asset.AssetTagGenerator generator;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;

    @Test
    void concurrentFirstAllocationsAreUnique() throws Exception {
        var transactions = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(4)) {
            var start = new java.util.concurrent.CountDownLatch(1);
            var jobs = new java.util.ArrayList<java.util.concurrent.Future<String>>();
            for (int index = 0; index < 4; index++) jobs.add(executor.submit(() -> {
                start.await();
                return transactions.execute(status -> generator.nextTag());
            }));
            start.countDown();
            var tags = new java.util.HashSet<String>();
            for (var job : jobs) tags.add(job.get(15, java.util.concurrent.TimeUnit.SECONDS));
            org.junit.jupiter.api.Assertions.assertEquals(4, tags.size());
        }
    }

    @Test
    void rerunsLegacyNormalizationAgainstExistingAssetsInsideTransaction() {
        assertDoesNotThrow(() -> dataInitializer.run());
    }
}
