CREATE DATABASE IF NOT EXISTS hr_evaluation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_evaluation;

CREATE TABLE IF NOT EXISTS `USER` (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  department VARCHAR(100) NULL,
  position VARCHAR(100) NULL,
  role ENUM('admin','evaluatee','evaluator') NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ROUND (
  round_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('draft','open','closed') NOT NULL DEFAULT 'draft'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS TOPIC (
  topic_id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL,
  topic_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  CONSTRAINT fk_topic_round FOREIGN KEY (round_id) REFERENCES ROUND(round_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DUTIES (
  duty_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  round_id INT NOT NULL,
  status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  UNIQUE KEY uq_duty_user_round (user_id, round_id),
  CONSTRAINT fk_duty_user FOREIGN KEY (user_id) REFERENCES `USER`(user_id),
  CONSTRAINT fk_duty_round FOREIGN KEY (round_id) REFERENCES ROUND(round_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS INDICATOR (
  indicator_id INT AUTO_INCREMENT PRIMARY KEY,
  topic_id INT NOT NULL,
  indicator_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 1,
  evaluation_type ENUM('BOOLEAN','RATING') NOT NULL DEFAULT 'RATING',
  level_description JSON NULL,
  evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  CONSTRAINT fk_indicator_topic FOREIGN KEY (topic_id) REFERENCES TOPIC(topic_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ASSESSMENT (
  assessment_id INT AUTO_INCREMENT PRIMARY KEY,
  duty_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  assessment_type ENUM('SELF','COMMITTEE') NOT NULL,
  committee_role ENUM('CHAIRMAN','COMMITTEE') NULL,
  overall_comment TEXT NULL,
  signature_path VARCHAR(255) NULL,
  status ENUM('PENDING','DRAFT','SUBMITTED') NOT NULL DEFAULT 'PENDING',
  submitted_at DATETIME NULL,
  UNIQUE KEY uq_assessment_assignment (duty_id, evaluator_id, assessment_type),
  CONSTRAINT fk_assessment_duty FOREIGN KEY (duty_id) REFERENCES DUTIES(duty_id),
  CONSTRAINT fk_assessment_evaluator FOREIGN KEY (evaluator_id) REFERENCES `USER`(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS SCORE (
  score_id INT AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT NOT NULL,
  indicator_id INT NOT NULL,
  score_value DECIMAL(5,2) NULL,
  comment TEXT NULL,
  UNIQUE KEY uq_score_assessment_indicator (assessment_id, indicator_id),
  CONSTRAINT fk_score_assessment FOREIGN KEY (assessment_id) REFERENCES ASSESSMENT(assessment_id),
  CONSTRAINT fk_score_indicator FOREIGN KEY (indicator_id) REFERENCES INDICATOR(indicator_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS SCORE_DETAIL (
  detail_id INT AUTO_INCREMENT PRIMARY KEY,
  score_id INT NOT NULL,
  detail_text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_detail_score FOREIGN KEY (score_id) REFERENCES SCORE(score_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS EVIDENCE (
  evidence_id INT AUTO_INCREMENT PRIMARY KEY,
  score_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  evidence_url TEXT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evidence_score FOREIGN KEY (score_id) REFERENCES SCORE(score_id)
) ENGINE=InnoDB;

-- Demo accounts are inserted by backend/seed.js so passwords can be securely hashed.
