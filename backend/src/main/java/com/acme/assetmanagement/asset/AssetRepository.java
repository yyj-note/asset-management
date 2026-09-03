package com.acme.assetmanagement.asset;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    @EntityGraph(attributePaths = {"company", "model", "category", "status", "location"})
    @Query("""
            select a from Asset a
            where :search = ''
               or lower(a.assetTag) like lower(concat('%', :search, '%'))
               or lower(a.name) like lower(concat('%', :search, '%'))
               or lower(coalesce(a.cpu, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(a.memory, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(a.storage, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(a.graphicsCard, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(a.manufacturerSerialNumber, '')) like lower(concat('%', :search, '%'))
               or lower(a.company.name) like lower(concat('%', :search, '%'))
               or lower(a.model.name) like lower(concat('%', :search, '%'))
            order by a.updatedAt desc
            """)
    List<Asset> search(@Param("search") String search);

    @Override
    @EntityGraph(attributePaths = {"company", "model", "category", "status", "location"})
    Optional<Asset> findById(Long id);

    @EntityGraph(attributePaths = {"company", "model", "category", "status", "location"})
    Optional<Asset> findByQrToken(String qrToken);
    Optional<Asset> findByAssetTagIgnoreCase(String assetTag);
    Optional<Asset> findTopByAssetTagStartingWithOrderByAssetTagDesc(String prefix);

    boolean existsByAssetTagIgnoreCase(String assetTag);
    boolean existsByAssetTagIgnoreCaseAndIdNot(String assetTag, Long id);
    boolean existsByManufacturerSerialNumberIgnoreCase(String manufacturerSerialNumber);
    boolean existsByManufacturerSerialNumberIgnoreCaseAndIdNot(String manufacturerSerialNumber, Long id);

    @Query("""
            select count(a) from Asset a
            where a.company.id = :lookupId
               or a.model.id = :lookupId
               or a.category.id = :lookupId
               or a.status.id = :lookupId
               or a.location.id = :lookupId
            """)
    long countUsingLookup(@Param("lookupId") Long lookupId);
}
