package com.acme.assetmanagement.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LookupRepository extends JpaRepository<LookupValue, Long> {
    List<LookupValue> findAllByOrderByTypeAscNameAsc();
    List<LookupValue> findByTypeOrderByNameAsc(LookupType type);
    Optional<LookupValue> findByTypeAndNameIgnoreCase(LookupType type, String name);
}

