package com.acme.assetmanagement.asset;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface AssetTagSequenceRepository extends JpaRepository<AssetTagSequence, LocalDate> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select sequence from AssetTagSequence sequence where sequence.sequenceDate = :date")
    Optional<AssetTagSequence> findLockedByDate(@Param("date") LocalDate date);
}
