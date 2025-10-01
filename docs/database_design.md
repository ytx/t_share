# Database Design - T-SHARE

## Overview
PostgreSQL database schema for the T-SHARE (定型文管理・共有) application.

- **RDBMS**: PostgreSQL 15
- **ORM**: Prisma
- **Character Set**: UTF-8
- **Timezone**: UTC (converted to JST in application layer)

## Tables

### users
User account information with Google OAuth support

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),  -- Google profile picture URL
    google_id VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- for username/password login (bcrypt)
    is_admin BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**New fields since initial design:**
- `avatar_url`: Stores Google account profile picture URL, updated on every login
- `approval_status`: User approval workflow (pending/approved)
- `applied_at`, `approved_at`, `approved_by`: Approval tracking

### scenes
Template categorization by usage scenario

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
Template tagging system with color support

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color code (#RRGGBB)
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### projects
Project management with public/private visibility

```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) DEFAULT '#1976d2', -- header color (#RRGGBB)
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**New fields since initial design:**
- `is_public`: Public/private project visibility control
- `color`: Project header color for UI customization

### templates
Main template data with version history support

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

**Template features:**
- Variable substitution: `{{variable_name}}` format
- Checkbox functionality: `[?]` (unchecked default), `[*]` (checked default)
- Version history tracking
- Tag-based filtering (include/exclude/unused states)

### template_versions
Template version history for change tracking

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
Many-to-many relationship between templates and tags

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
Template usage tracking per user for statistics

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
User-specific variables for template substitution

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

**Usage:** Variables are substituted in templates using `{{variable_name}}` syntax.

### project_variables
Project-specific variables including auto-managed port assignments

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

**Auto-managed port variables:**
System automatically creates and manages port number variables when opening project edit modal:

| Variable Name | Purpose | Port Range |
|--------------|---------|------------|
| FRONTEND_PORT | Frontend application | 3200-3299 |
| BACKEND_PORT | Backend API server | 4200-4299 |
| DB_PORT | Database | 5200-5299 |

**Implementation:** `ensurePortsExist()` method detects missing port variables and auto-creates them.

### documents
Saved documents with project association and special document types

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

**Special document types** (identified by title pattern):

| Title Pattern | Purpose | Access Control |
|--------------|---------|----------------|
| `[PROJECT_SHARED]_{project_id}` | Project shared document | All project members |
| `[PERSONAL_MEMO]_{user_id}` | Personal memo | Creator only |

**Features:**
- Auto-save with 3-second debounce
- Unsaved changes indicator (icon in tab area)
- Multi-device sync (server-side storage)

### user_preferences
User editor and UI preferences with ACE editor theme support

```sql
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light', -- light, dark
    editor_keybinding VARCHAR(20) DEFAULT 'default', -- default, vim, emacs
    editor_show_line_numbers BOOLEAN DEFAULT TRUE,
    editor_word_wrap BOOLEAN DEFAULT TRUE,
    editor_show_whitespace BOOLEAN DEFAULT FALSE,
    editor_light_theme VARCHAR(50) DEFAULT 'github', -- ACE editor light theme
    editor_dark_theme VARCHAR(50) DEFAULT 'monokai', -- ACE editor dark theme
    editor_font_size INTEGER DEFAULT 14, -- font size in pixels
    panel_split_ratio DECIMAL(3,2) DEFAULT 0.5, -- left panel ratio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**New fields since initial design:**
- `editor_light_theme`: Separate theme for light mode (8 options)
- `editor_dark_theme`: Separate theme for dark mode (17 options)
- `editor_font_size`: Configurable font size (8-24px)

**ACE Editor themes:**
- **Light** (8): github, tomorrow, chrome, eclipse, textmate, xcode, katzenmilch, kuroir
- **Dark** (17): monokai, dracula, twilight, vibrant_ink, cobalt, tomorrow_night, tomorrow_night_blue, tomorrow_night_bright, tomorrow_night_eighties, idle_fingers, kr_theme, merbivore, merbivore_soft, mono_industrial, pastel_on_dark, solarized_dark, terminal

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

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_is_public ON projects(is_public);

CREATE INDEX idx_user_variables_user_id ON user_variables(user_id);
CREATE INDEX idx_project_variables_project_id ON project_variables(project_id);

-- Full text search indexes (PostgreSQL)
CREATE INDEX idx_templates_title_search ON templates USING gin(to_tsvector('english', title));
CREATE INDEX idx_templates_content_search ON templates USING gin(to_tsvector('english', content));
CREATE INDEX idx_documents_content_search ON documents USING gin(to_tsvector('english', content));
```

## Entity Relationships

```
users (1) ----< (N) templates [created_templates]
users (1) ----< (N) scenes [created_scenes]
users (1) ----< (N) tags [created_tags]
users (1) ----< (N) projects [created_projects]
users (1) ----< (N) user_variables
users (1) ----< (N) project_variables [creator]
users (1) ----< (N) documents [creator]
users (1) ----< (N) template_usage
users (1) ----< (N) template_versions
users (1) ---- (1) user_preferences
users (1) ----< (N) users [approver -> approved_users]

projects (1) ----< (N) project_variables
projects (1) ----< (N) documents

scenes (1) ----< (N) templates

templates (N) ----< (N) tags [via template_tags]
templates (1) ----< (N) template_versions
templates (1) ----< (N) template_usage
```

## Data Flow

### Template Management
1. **Create template** → `templates` table, auto-create first version in `template_versions`
2. **Update template** → update `templates`, create new record in `template_versions`
3. **Add tags** → create relationships in `template_tags`
4. **Search templates** → use indexes for performance, support three-state tag filter (include/exclude/unused)
5. **Admin mode** → view all templates vs. public + own templates only

### Template Insertion Workflow
1. **Select template** → increment `usage_count` in `template_usage`, update `last_used_at`
2. **Detect variables** → scan for `{{variable_name}}` patterns
3. **Detect checkboxes** → scan for `[?]` (unchecked) or `[*]` (checked) patterns
4. **Show modal** → if variables or checkboxes exist, display `VariableSubstitutionModal`
5. **Apply substitutions** → replace variables with user/project variable values
6. **Insert content** → insert into upper or lower editor with newline prefix

### Document Creation & Management
1. **Upper editor** → project-linked document with dropdown selection
2. **Lower editor** → split pane with two editors:
   - **Project editor** → project shared document `[PROJECT_SHARED]_{project_id}`
   - **Memo editor** → personal memo `[PERSONAL_MEMO]_{user_id}`
3. **Auto-save** → 3-second debounce, flush on tab switch
4. **Unsaved indicator** → small icon in tab area (prevents editor jumping)
5. **Save document** → `documents` table with project association

### Project Variable Auto-Management
1. **Open project edit modal** → trigger `updateProject()` API immediately
2. **Backend processing** → call `ensurePortsExist(projectId, createdBy)`
3. **Port detection** → check for missing `FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`
4. **Port allocation** → find next available port in range, create missing variables
5. **Display modal** → show edit modal with all port variables ready

### User Authentication
1. **Google login** → create/update `users` with `google_id` and `avatar_url`
2. **Avatar update** → refresh `avatar_url` on every login to keep current
3. **Username/password** → create/update `users` with `password_hash` (bcrypt)
4. **Approval workflow** → new users require admin approval (`approval_status`)
5. **Admin mode toggle** → frontend state for viewing all vs. filtered templates

### Data Export/Import
1. **Export** → JSON export from admin panel with all 12 tables
2. **Category selection** → choose which categories to import:
   - Users
   - Scenes & Templates
   - Projects & Documents
   - System Settings
3. **Import options**:
   - Clear existing data in selected categories
   - Preserve IDs from export file
4. **Validation** → Zod schema validation before import
5. **Transaction** → all imports executed in database transaction

## Migration Strategy

### Initial Setup
1. Create tables in dependency order (users → scenes/tags/projects → templates → relationships)
2. Set up foreign key constraints with appropriate CASCADE rules
3. Add indexes after initial data load for better performance
4. Create default admin user account
5. Optionally seed with initial scenes and tags

### Schema Updates (Prisma)
```bash
# After modifying schema.prisma
npx prisma migrate dev --name migration_name

# Apply to production
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate
```

### Data Backup & Restore
- **Backup**: Use admin panel JSON export (pretty format, all tables)
- **Restore**: Use admin panel JSON import with category selection
- **PostgreSQL dump**: `pg_dump` for complete database backup

## Security Considerations

1. **Password hashing**: bcrypt with salt rounds for local authentication
2. **OAuth security**: Google OAuth 2.0 with JWT token-based sessions
3. **SQL injection**: Prisma ORM provides parameterized queries
4. **Foreign key constraints**: CASCADE deletes where appropriate
5. **Access control**:
   - Public/private templates and projects
   - Special document access based on title pattern
   - Admin-only operations protected by middleware
6. **Avatar URLs**: Validated and sanitized from Google OAuth response

## Performance Optimization

1. **Indexing strategy**:
   - Foreign keys for JOIN operations
   - Frequently filtered columns (status, is_public, created_by)
   - Timestamps for sorting and pagination
2. **Full-text search**: PostgreSQL GIN indexes for text search
3. **Connection pooling**: Prisma connection pool management
4. **Query optimization**: Use `select` to limit returned fields
5. **Caching**: RTK Query cache management in frontend

## Constraints & Business Rules

1. **Unique constraints**:
   - `users.email`, `users.google_id`
   - `tags.name`
   - `(template_id, tag_id)` in template_tags
   - `(user_id, name)` in user_variables
   - `(project_id, name)` in project_variables
   - `(template_id, version_number)` in template_versions

2. **Deletion rules**:
   - Projects with documents cannot be deleted
   - Template deletion cascades to versions, tags, and usage records
   - User deletion cascades to user_variables and user_preferences

3. **Auto-creation rules**:
   - Port variables auto-created when opening project edit modal
   - First template version created when template is created
   - User preferences created with default values on first access

4. **Special documents**:
   - Title-based access control for shared/personal documents
   - Project shared docs visible to all project members
   - Personal memos visible only to creator
