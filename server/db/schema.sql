-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- SOURCES
CREATE TABLE IF NOT EXISTS sources (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  domain_name VARCHAR(255) NOT NULL,
  credibility_score DECIMAL(5,2) DEFAULT NULL,
  last_updated TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sources_domain (domain_name)
) ENGINE=InnoDB;

-- SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  original_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  date_submitted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_submissions_user (user_id),
  CONSTRAINT fk_submissions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ARTICLES
CREATE TABLE IF NOT EXISTS articles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id INT UNSIGNED NOT NULL,
  source_id INT UNSIGNED NOT NULL,
  title VARCHAR(255),
  author_name VARCHAR(255),
  publish_date DATE,
  text_content TEXT,
  PRIMARY KEY (id),
  KEY idx_articles_submission (submission_id),
  KEY idx_articles_source (source_id),
  CONSTRAINT fk_articles_submission
    FOREIGN KEY (submission_id) REFERENCES submissions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_articles_source
    FOREIGN KEY (source_id) REFERENCES sources(id)
) ENGINE=InnoDB;

-- CREDIBILITY SCORES
CREATE TABLE IF NOT EXISTS credibility_scores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_id INT UNSIGNED NOT NULL,
  overall_score DECIMAL(5,2),
  confidence_level DECIMAL(5,2),
  verdict VARCHAR(100),
  analysis_notes TEXT,
  date_scored TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_scores_article (article_id),
  CONSTRAINT fk_scores_article
    FOREIGN KEY (article_id) REFERENCES articles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- CLAIMS
CREATE TABLE IF NOT EXISTS claims (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_id INT UNSIGNED NOT NULL,
  claim_text TEXT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_claims_article (article_id),
  CONSTRAINT fk_claims_article
    FOREIGN KEY (article_id) REFERENCES articles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- EVIDENCE LINKS
CREATE TABLE IF NOT EXISTS evidence_links (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  claim_id INT UNSIGNED NOT NULL,
  evidence_url TEXT NOT NULL,
  match_result VARCHAR(100),
  PRIMARY KEY (id),
  KEY idx_evidence_claim (claim_id),
  CONSTRAINT fk_evidence_claim
    FOREIGN KEY (claim_id) REFERENCES claims(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- LOGS
CREATE TABLE IF NOT EXISTS logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  action VARCHAR(255),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_logs_user (user_id),
  CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;