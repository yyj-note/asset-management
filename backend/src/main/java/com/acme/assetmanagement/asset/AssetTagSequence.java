package com.acme.assetmanagement.asset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "asset_tag_sequences")
public class AssetTagSequence {
    @Id
    @Column(name = "sequence_date", nullable = false)
    private LocalDate sequenceDate;

    @Column(name = "last_sequence_value", nullable = false)
    private int lastValue;

    protected AssetTagSequence() {}

    public AssetTagSequence(LocalDate sequenceDate, int lastValue) {
        this.sequenceDate = sequenceDate;
        this.lastValue = lastValue;
    }

    public LocalDate getSequenceDate() { return sequenceDate; }
    public int getLastValue() { return lastValue; }
    public void setLastValue(int lastValue) { this.lastValue = lastValue; }
}
