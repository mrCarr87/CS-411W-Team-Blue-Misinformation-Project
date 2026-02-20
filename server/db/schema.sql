    CREATE DATABASE IF NOT EXISTS misinfo_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

    USE misinfo_db;

    -- Trusted Sources
    CREATE TABLE IF NOT EXISTS sources (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    domain_name      VARCHAR(255) NOT NULL,
    tier             ENUM('trusted','recognizable','unknown','disinfo') NOT NULL DEFAULT 'unknown',
    is_trusted       TINYINT(1) NOT NULL DEFAULT 0,
    credibility_score DECIMAL(5,2) NULL,
    notes            TEXT NULL,
    last_updated     TIMESTAMP NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sources_domain (domain_name),
    KEY idx_sources_trusted (is_trusted),
    KEY idx_sources_tier (tier)
    ) ENGINE=InnoDB;

    -- Dataset Update
    CREATE TABLE IF NOT EXISTS dataset_versions (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    version_tag VARCHAR(64) NOT NULL,
    notes       TEXT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_dataset_version_tag (version_tag)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS fact_checks (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    dataset_version_id  INT UNSIGNED NOT NULL,
    claim_text          TEXT NOT NULL,
    verdict             ENUM('true','false','mixed','misleading','unverified') NOT NULL,
    rationale           TEXT NULL,
    evidence_url        TEXT NULL,
    source_domain       VARCHAR(255) NULL,
    date_verified       DATE NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_fc_version (dataset_version_id),
    CONSTRAINT fk_fc_version
        FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB;
