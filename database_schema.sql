-- Database Schema for FocusDeck App

-- 1. Create Tables

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    custom_id VARCHAR(50),
    type VARCHAR(50), -- 'standard', 'TAM_premium'
    logo TEXT,
    contacts JSON DEFAULT NULL,
    services JSON DEFAULT NULL,
    docs JSON DEFAULT NULL,
    monitoring JSON DEFAULT NULL,
    company VARCHAR(100) DEFAULT 'Arsys',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_id INT,
    color VARCHAR(50),
    status VARCHAR(50), -- 'active', 'closed', 'cancelled'
    jira_link TEXT,
    doc_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS contexts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    project_id INT,
    client_id INT,
    context_id INT,
    is_today BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'done', 'in_progress', 'waiting_for', 'someday'
    scheduled_date DATE DEFAULT NULL,
    reminder_freq VARCHAR(20) DEFAULT NULL, -- 'once', 'daily', 'weekly'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (context_id) REFERENCES contexts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS subtasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    position INT DEFAULT 0,
    status_comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dependencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    blocked_by_task_id INT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_by_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 2. Initial Data

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('notification_email', 'jamezcua@arsys.es');

-- 3. Migration Commands (Run manually if tables already exist and are missing columns)

-- ALTER TABLE tasks ADD COLUMN scheduled_date DATE DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN reminder_freq VARCHAR(20) DEFAULT NULL;
-- ALTER TABLE subtasks ADD COLUMN status_comment TEXT DEFAULT NULL;
