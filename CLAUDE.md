# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Team Knowledge Base Management Tool** - a web-based document management system designed for team collaboration. The project is currently in the **fully functional** stage with all major features implemented.

**Tech Stack:**
- Backend: Python 3.9+ with FastAPI
- Database: SQLite 3 with aiosqlite (async operations)
- Frontend: React 18 + TypeScript + Ant Design + Vite
- Authentication: JWT with PassLib (bcrypt) + python-jose
- File Storage: Local filesystem (uploads/ directory)
- State Management: Redux Toolkit + Zustand (frontend)
- HTTP Client: Axios (frontend), httpx (backend testing)

## Architecture

The project follows a **three-tier architecture**:
1. **Frontend (React)**: User interface with Ant Design components
2. **Backend (FastAPI)**: RESTful API services with Python
3. **Database (SQLite)**: Document metadata and user data

**Key Design Constraints:**
- Search is **title-only** (no full-text search in initial version)
- **Local deployment only** (no cloud/server deployment)
- **Simplified features**: No email verification, password recovery initially
- **Three-tier permissions**: Admin > Editor > Viewer
- Document visibility levels: public/team/private
- File upload size limits and type restrictions

**Database Implementation Details:**
- Uses aiosqlite for async SQLite operations
- Database connection configured with Row factory for dict conversion
- Critical: `conn.row_factory = aiosqlite.Row` must be set for proper data conversion
- Database manager provides abstracted query execution with automatic connection handling
- All queries return dictionaries for easy JSON serialization

## Development Commands

### Backend Development
```bash
cd backend
pip install -r requirements.txt                    # Install dependencies (includes aiosqlite)
# OR: pip install -e ".[dev]"                     # Install with dev tools
cp .env.example .env                               # Setup environment
python -m src.scripts.migrate                     # Initialize database
python -m src.scripts.seed                        # Seed initial data
uvicorn src.main:app --host 0.0.0.0 --port 8000   # Run production server (RECOMMENDED)
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000  # Development server (see notes below)
```

**⚠️ Important: uvicorn --reload Issues**
- The `--reload` flag causes database conversion errors with aiosqlite.Row objects
- For stable development, use the server WITHOUT `--reload` flag
- Authentication and database operations only work correctly without `--reload`
- If you need auto-restart, manually restart the server when making changes

### Frontend Development
```bash
cd frontend
npm install                                        # Install dependencies
npm run dev                                        # Run dev server (port 3000)
npm run build                                      # Production build
npm run preview                                    # Preview build
```

### Code Quality
```bash
# Backend
cd backend
pip install -e ".[dev]"                           # Install with dev dependencies (includes testing tools)
python -m pytest                                  # Run tests (once test files exist)
python -m pytest tests/                           # Run all tests in tests/ directory
python -m pytest tests/test_auth.py               # Run specific test file
python -m pytest -k "test_login"                  # Run tests matching pattern
python -m pytest -v                               # Run tests with verbose output
python -m pytest -m "not slow"                    # Skip slow tests
python -m pytest -m unit                          # Run only unit tests
python -m pytest -m integration                   # Run only integration tests
black src/ tests/                                 # Format code
isort src/ tests/                                 # Sort imports
flake8 src/ tests/                                # Lint code
mypy src/                                         # Type checking

# Frontend
cd frontend
npm run lint                                       # ESLint
npm run type-check                                # TypeScript check
# Note: No testing framework currently configured for frontend
```

## Project Structure

The main project is in the root directory:

- `docs/`: Complete design documentation in Chinese
  - `需求文档/产品需求文档.md`: Requirements specification
  - `设计文档/详细设计文档.md`: Detailed technical design
  - `架构设计/系统架构设计.md`: System architecture
  - `API文档/API接口文档.md`: API reference
  - `设计文档/数据库设计文档.md`: Database schema design
- `backend/`: FastAPI Python backend
  - `src/`: Source code (fully implemented)
  - `requirements.txt`: Python dependencies
  - `pyproject.toml`: Project configuration
  - `.env.example`: Environment variables template
  - `uploads/`: File storage directory
  - `database/`: SQLite database files
- `frontend/`: React TypeScript frontend
  - `src/`: Source code (fully implemented)
  - `package.json`: Node.js dependencies
  - `vite.config.ts`: Vite configuration
  - `public/`: Static assets

## Key Design Decisions

1. **Search Limitation**: Only document title search, not full-text content search
2. **Simplified Auth**: Basic registration/login without email verification
3. **File Storage**: Local filesystem only, no cloud storage
4. **Permissions**: Document visibility (public/team/private) + role-based access
5. **Local Deployment**: Designed for local team use, not server deployment

## Database Schema

Core entities (see `docs/设计文档/数据库设计文档.md` for details):
- **users**: User accounts with roles (admin/editor/viewer), authentication data
- **documents**: Document metadata with file paths, visibility settings
- **tags**: Document categorization and labeling system
- **document_tags**: Many-to-many relationship between documents and tags
- **document_permissions**: Fine-grained access control per document
- **operation_logs**: Audit trail for user actions and system events

Key relationships:
- Users create and manage documents
- Documents can have multiple tags
- Document permissions control access per user/role
- All operations are logged for audit purposes

## API Design

RESTful API with FastAPI auto-generated OpenAPI docs:
- Authentication: JWT Bearer tokens
- File upload: Multipart form data
- Search: Query parameters with title search
- Permissions: Role-based + document-level access control

## Implementation Status

**✅ Completed:**
- Requirements analysis and documentation
- System architecture design and database schema implementation
- Backend API foundation with FastAPI including:
  - Complete authentication system (login/register/JWT)
  - Document management API (CRUD operations, file upload/download)
  - Tag management API (CRUD operations)
  - User management API
  - Database layer with aiosqlite integration
  - Authentication middleware with proper route exemption
- Frontend React application with:
  - Complete UI components using Ant Design
  - Document management pages (list, upload, edit, download)
  - Tag management pages
  - User authentication and profile management
  - API service layer with Axios interceptors
  - Redux Toolkit state management
  - Path aliases configured (@/components, @/services, etc.)
- Database migrations and seeding scripts
- Vite proxy configuration for API requests

**🚧 Current Status:**
- **Fully functional system** with all major features implemented
- Authentication, document management, and tag management working
- File upload/download operations functional
- All API endpoints properly secured with JWT authentication
- Debug logging available (AUTH_DEBUG) for troubleshooting

**🔧 Critical Fixes Applied:**
1. **Authentication Middleware**: Fixed route exemption logic to prevent authentication bypass
2. **API Route Ordering**: Resolved FastAPI route conflicts (stats vs parameterized routes)
3. **Frontend API Integration**: Fixed all direct API calls to use centralized service layer
4. **URL Routing**: Resolved FastAPI redirect issues by adding trailing slashes to API URLs

**📋 Default Test Accounts (after seeding):**
- **Admin**: admin@example.com / admin123
- **Editor**: editor@example.com / editor123
- **Viewer**: viewer@example.com / viewer123

## Testing Infrastructure

**Backend Testing:**
- Testing framework configured in `pyproject.toml` with pytest and pytest-asyncio
- Test markers available: `unit`, `integration`, `slow`
- Testing dependencies included in optional `[dev]` group
- **Status**: Testing framework ready, no test files exist yet
- **Test Location**: Create tests in `backend/tests/` directory
- Example test structure:
  ```python
  # backend/tests/test_auth.py
  import pytest
  from httpx import AsyncClient

  @pytest.mark.asyncio
  @pytest.mark.unit
  async def test_login():
      # Test implementation here
      pass
  ```

**Frontend Testing:**
- **Status**: No testing framework currently configured
- Recommended: Add Vitest + React Testing Library for modern React testing
- Only ESLint and TypeScript checking currently available

**Database Testing Considerations:**
- Tests will need async setup with pytest-asyncio
- Requires proper aiosqlite Row factory configuration
- Should use separate test database for isolation

## Context Recovery

When resuming work on this project:
1. Read `docs/需求文档/产品需求文档.md` for requirements
2. Review `docs/设计文档/详细设计文档.md` for implementation details
3. Check the current implementation status in this file
4. Start with backend API implementation or frontend components as needed

The project has comprehensive design documentation and a fully implemented functional system.

## Backend Architecture Overview

**Service Layer Pattern:**
- `src/routes/`: FastAPI route handlers for API endpoints
- `src/services/`: Business logic services (UserService, etc.)
- `src/config/`: Configuration and database management
- `src/types/schemas.py`: Pydantic models for data validation
- `src/utils/`: Utility functions (auth, file handling, etc.)
- `src/middleware/`: Custom middleware (auth, CORS, etc.)

**Authentication Flow:**
1. User submits login credentials via `/api/auth/login`
2. UserService validates email/password against database
3. JWT token generated with user info (id, email, role)
4. Token returned to client for subsequent authenticated requests
5. AuthMiddleware validates tokens on protected routes

**Database Layer:**
- `DatabaseManager.execute_query()` handles all database operations
- Automatic connection management with proper Row factory setup
- Returns dictionaries for easy JSON serialization
- Supports fetch_one, fetch_all, and insert operations

**Known Issues & Solutions:**
- uvicorn `--reload` mode breaks aiosqlite.Row conversion - run without reload
- CORS configured for multiple localhost ports for development
- Global exception handler logs errors to both console and error.log file

## Frontend API Architecture

**Centralized API Service Pattern:**
- `src/services/api.ts`: All API calls go through Axios-based service classes
- `authAPI`, `documentsAPI`, `tagsAPI`, `usersAPI` instances exported for use
- Automatic JWT token injection via Axios request interceptors
- Centralized error handling and response processing
- All API URLs must include trailing slashes to match FastAPI route definitions

**Path Aliases Configuration:**
- `@/components`: React components
- `@/services`: API service classes
- `@/utils`: Utility functions
- `@/types`: TypeScript type definitions
- `@/store`: Redux state management
- `@/pages`: Page components

**Critical Frontend Configuration:**
- Vite proxy configured to forward `/api/*` requests to backend on port 8000
- All API calls use relative URLs (no hardcoded localhost:8000 references)
- Frontend API service base URL set to empty string to force proxy usage
- Frontend dev server runs on port 3000 by default

**Authentication Flow:**
1. Login returns JWT token stored in localStorage
2. Axios interceptors automatically add `Authorization: Bearer <token>` headers
3. 401 responses trigger automatic logout and redirect to login page
4. Authentication state managed via Redux Toolkit

## Common Development Issues

**API Request Problems:**
- **Issue**: Direct requests to localhost:8000 without authentication
- **Solution**: Ensure all API calls use the centralized service classes from `api.ts`
- **Check**: No `fetch()` calls should exist in components, only API service methods

**Authentication Bypass:**
- **Issue**: Routes not properly protected by authentication middleware
- **Solution**: Verify route paths don't accidentally match exemption patterns in middleware
- **Critical**: Root path "/" must be exact match, not prefix match in exemptions

**FastAPI Route Conflicts:**
- **Issue**: Parameterized routes like `/{id}` matching before specific routes like `/stats`
- **Solution**: Define specific routes before parameterized routes in router files

**URL Redirect Issues:**
- **Issue**: API calls without trailing slashes trigger FastAPI redirects that lose headers
- **Solution**: All API URLs in frontend service must include trailing slashes (e.g., `/api/documents/`)