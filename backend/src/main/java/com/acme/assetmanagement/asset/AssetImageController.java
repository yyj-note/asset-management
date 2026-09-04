package com.acme.assetmanagement.asset;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/public/asset-images")
public class AssetImageController {
    private final AssetImageStorageService storage;

    public AssetImageController(AssetImageStorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> image(@PathVariable String fileName) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic().immutable())
                .contentType(MediaType.parseMediaType(storage.mediaType(fileName)))
                .body(storage.load(fileName));
    }
}
