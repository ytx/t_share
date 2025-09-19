# Database Design - Template Share

## Overview
PostgreSQL database schema for the Template Share application.

## Tables

### users
User account information
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    display_name VARCHAR(100),
    google_id VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- for username/password login
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### scenes
Template categorization
```sql
CREATE TABLE scenes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tags
Template tagging system
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color code
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### projects
Project management
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


### templates
Main template data
```sql
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    scene_id INTEGER REFERENCES scenes(id),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published
    is_public BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### template_versions
Template version history
```sql
CREATE TABLE template_versions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    scene_id INTEGER REFERENCES scenes(id),
    status VARCHAR(20) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, version_number)
);
```

### template_tags
Template and tag relationship
```sql
CREATE TABLE template_tags (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, tag_id)
);
```

### template_usage
Template usage tracking per user
```sql
CREATE TABLE template_usage (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, user_id)
);
```

### user_variables
User-specific variables
```sql
CREATE TABLE user_variables (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);
```

### project_variables
Project-specific variables
```sql
CREATE TABLE project_variables (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, name)
);
```

### documents
Saved documents
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    title VARCHAR(200),
    content TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_preferences
User editor and UI preferences
```sql
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light', -- light, dark
    editor_keybinding VARCHAR(20) DEFAULT 'default', -- default, vim, emacs
    editor_show_line_numbers BOOLEAN DEFAULT TRUE,
    editor_word_wrap BOOLEAN DEFAULT TRUE,
    editor_show_whitespace BOOLEAN DEFAULT FALSE,
    panel_split_ratio DECIMAL(3,2) DEFAULT 0.5, -- left panel ratio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes
```sql
-- Performance indexes
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_scene_id ON templates(scene_id);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE INDEX idx_templates_updated_at ON templates(updated_at);

CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX idx_template_tags_template_id ON template_tags(template_id);
CREATE INDEX idx_template_tags_tag_id ON template_tags(tag_id);

CREATE INDEX idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX idx_template_usage_user_id ON template_usage(user_id);
CREATE INDEX idx_template_usage_last_used_at ON template_usage(last_used_at);

CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Full text search indexes
CREATE INDEX idx_templates_title_search ON templates USING gin(to_tsvector('english', title));
CREATE INDEX idx_templates_content_search ON templates USING gin(to_tsvector('english', content));
```

## Data Flow

### Template Management
1. Create template → templates table
2. Update template → new record in template_versions
3. Add tags → template_tags relationship
4. Search templates → use indexes for performance

### Document Creation
1. Select template → increment usage_count in template_usage, update last_used_at
2. Apply variables → substitute user_variables and project_variables
3. Save document → documents table with project association

### User Authentication
1. Google login → create/update users with google_id
2. Username/password → create/update users with password_hash
3. Admin mode → managed in frontend state only

## Migration Strategy
1. Create tables in dependency order
2. Add indexes after initial data load
3. Set up triggers for updated_at timestamps
4. Create default scenes and tags
5. Create admin user account