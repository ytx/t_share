# API Design - Template Share

## Overview
RESTful API design for the Template Share application.

## Authentication
- **JWT Token**: Used for session management
- **Google OAuth**: Primary authentication method
- **Username/Password**: Fallback authentication for development

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Endpoints

### Authentication
```
POST /api/auth/google          # Google OAuth login
POST /api/auth/login           # Username/password login
POST /api/auth/logout          # Logout
GET  /api/auth/me              # Get current user info
POST /api/auth/refresh         # Refresh JWT token
```

### Users
```
GET    /api/users              # Get users list (admin only)
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user (admin only)
POST   /api/users/:id/admin-mode  # Toggle admin mode
```

### Templates
```
GET    /api/templates          # Get templates with search/filter
POST   /api/templates          # Create new template
GET    /api/templates/:id      # Get template by ID
PUT    /api/templates/:id      # Update template
DELETE /api/templates/:id      # Delete template
POST   /api/templates/:id/use  # Mark template as used (increment counter)

GET    /api/templates/:id/versions     # Get template version history
GET    /api/templates/:id/versions/:version  # Get specific version
POST   /api/templates/:id/restore/:version   # Restore to specific version
```

### Scenes
```
GET    /api/scenes             # Get all scenes
POST   /api/scenes             # Create scene (admin only)
PUT    /api/scenes/:id         # Update scene (admin only)
DELETE /api/scenes/:id         # Delete scene (admin only)
```

### Tags
```
GET    /api/tags               # Get all tags
POST   /api/tags               # Create tag
PUT    /api/tags/:id           # Update tag
DELETE /api/tags/:id           # Delete tag
```

### Projects
```
GET    /api/projects           # Get user's projects
POST   /api/projects           # Create project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project

GET    /api/projects/:id/members    # Get project members
POST   /api/projects/:id/members    # Add project member
DELETE /api/projects/:id/members/:userId  # Remove project member
```

### Variables
```
GET    /api/variables/user           # Get user variables
POST   /api/variables/user           # Create user variable
PUT    /api/variables/user/:id       # Update user variable
DELETE /api/variables/user/:id       # Delete user variable

GET    /api/variables/project/:projectId    # Get project variables
POST   /api/variables/project/:projectId    # Create project variable
PUT    /api/variables/project/:projectId/:id     # Update project variable
DELETE /api/variables/project/:projectId/:id     # Delete project variable
```

### Documents
```
GET    /api/documents          # Get user's documents
POST   /api/documents          # Save document
GET    /api/documents/:id      # Get document by ID
PUT    /api/documents/:id      # Update document
DELETE /api/documents/:id      # Delete document

GET    /api/projects/:id/documents    # Get project documents
```

### Preferences
```
GET    /api/preferences        # Get user preferences
PUT    /api/preferences        # Update user preferences
```

### Data Management (Admin only)
```
POST   /api/admin/export       # Export data
POST   /api/admin/import       # Import data
GET    /api/admin/stats        # Get system statistics
```

## Request/Response Examples

### Template Search
```http
GET /api/templates?keyword=meeting&scene=1&creator=john&status=published&tags=work,urgent&sort=last_used_at&order=desc&page=1&limit=20

Response:
{
  "data": [
    {
      "id": 1,
      "title": "Meeting Minutes Template",
      "description": "Standard meeting minutes format",
      "content": "# Meeting Minutes\n\n## Date: {{date}}\n...",
      "scene": {
        "id": 1,
        "name": "Meeting"
      },
      "tags": [
        {"id": 1, "name": "work", "color": "#blue"},
        {"id": 2, "name": "urgent", "color": "#red"}
      ],
      "status": "published",
      "created_by": {
        "id": 1,
        "display_name": "John Doe"
      },
      "usage_count": 15,
      "last_used_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T09:00:00Z",
      "updated_at": "2024-01-10T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### Create Template
```http
POST /api/templates
{
  "title": "Daily Report Template",
  "content": "# Daily Report {{date}}\n\n## Tasks Completed\n- [ ] Task 1\n- [ ] Task 2\n\n## Notes\n{{notes}}",
  "description": "Template for daily work reports",
  "scene_id": 2,
  "tag_ids": [1, 3],
  "status": "published"
}

Response:
{
  "id": 25,
  "title": "Daily Report Template",
  "content": "# Daily Report {{date}}\n\n## Tasks Completed\n- [ ] Task 1\n- [ ] Task 2\n\n## Notes\n{{notes}}",
  "description": "Template for daily work reports",
  "scene": {
    "id": 2,
    "name": "Report"
  },
  "tags": [
    {"id": 1, "name": "work", "color": "#blue"},
    {"id": 3, "name": "daily", "color": "#green"}
  ],
  "status": "published",
  "version_number": 1,
  "created_at": "2024-01-20T15:30:00Z"
}
```

### Apply Template with Variables
```http
POST /api/templates/25/apply
{
  "project_id": 5,
  "variables": {
    "date": "2024-01-20",
    "notes": "Completed API documentation review"
  },
  "selected_lines": [1, 2, 3, 5, 7] // Optional: specific lines to include
}

Response:
{
  "content": "# Daily Report 2024-01-20\n\n## Tasks Completed\n- [ ] Task 1\n- [ ] Task 2\n\n## Notes\nCompleted API documentation review"
}
```

### Save Document
```http
POST /api/documents
{
  "project_id": 5,
  "title": "Daily Report - 2024-01-20",
  "content": "# Daily Report 2024-01-20\n\n## Tasks Completed\n- [x] Review API documentation\n- [x] Update database schema\n\n## Notes\nCompleted API documentation review",
  "content_markdown": "# Daily Report 2024-01-20..."
}

Response:
{
  "id": 15,
  "title": "Daily Report - 2024-01-20",
  "project": {
    "id": 5,
    "name": "Web Development"
  },
  "created_at": "2024-01-20T16:45:00Z"
}
```

## Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title",
      "value": ""
    }
  }
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error