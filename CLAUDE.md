# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web application for splitting Codenames players into balanced teams, tracking spymasters, and recording game statistics. Built with vanilla JavaScript frontend and Node.js/Express backend with SQLite database.

## Architecture

**Backend (backend/server.js)**
- Single Express server file with all API routes
- SQLite3 database with callback-based API (not promises)
- Database migrations handled inline with ALTER TABLE statements that ignore "duplicate column name" errors
- JSON serialization for array fields (red_team, blue_team) stored as TEXT columns

**Frontend (frontend/index.html)**
- Single-page application with embedded JavaScript
- Direct DOM manipulation (getElementById, createElement)
- Tailwind CSS via CDN for styling
- API calls use fetch with async/await

**Database Schema**
- Single table: `spymasters` with columns: id, red_spymaster, blue_spymaster, red_team (JSON TEXT), blue_team (JSON TEXT), winner, created_at

## Development Commands

### Running the Application

**Local development:**
```bash
cd backend
npm install   # First time only
npm start     # Starts server on http://localhost:3000
```

Then open `frontend/index.html` in a browser.

**Docker:**
```bash
docker-compose up
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

### Testing

No test framework is currently configured. Verify changes manually by:
1. Starting the backend server
2. Opening frontend in browser
3. Testing player management, team splitting, and game recording features

## Code Style Guidelines

### Backend (Node.js)
- **Module system**: CommonJS (`require()`, not ES6 imports)
- **Naming**: camelCase for variables/functions, snake_case for database columns
- **Database**: SQLite3 with callbacks. Always check for `"duplicate column name"` in ALTER TABLE errors
- **Error responses**: Return JSON with `{ error: message }` and appropriate HTTP status codes
- **Route pattern**: Express methods directly on `app` object (e.g., `app.get()`, `app.post()`)

### Frontend (JavaScript)
- **No build step**: Plain JavaScript (ES6+) embedded in HTML file
- **Styling**: Tailwind CSS classes via CDN, inline styles for animations
- **Naming**: camelCase for JavaScript, kebab-case for HTML IDs/classes
- **API configuration**: Use `API_URL` constant for endpoint base URL
- **Error handling**: Display user-friendly messages via `showMessage()` helper function
- **DOM operations**: Direct manipulation, no framework

## API Endpoints

All endpoints prefixed with `/api/spymasters`:

- `GET /api/spymasters` - Get most recent spymasters
- `GET /api/spymasters/history` - Get last 10 games
- `GET /api/spymasters/stats` - Get win statistics (red vs blue counts)
- `POST /api/spymasters` - Save game result (body: redSpymaster, blueSpymaster, redTeam, blueTeam, winner)
- `DELETE /api/spymasters/:id` - Delete specific game
- `DELETE /api/spymasters` - Clear all history

## Key Implementation Details

### Database Initialization
On startup, the server:
1. Creates `spymasters` table if it doesn't exist
2. Attempts to add `red_team` and `blue_team` columns via ALTER TABLE
3. Ignores errors for duplicate columns (idempotent migrations)

### Team Data Storage
Team rosters are stored as JSON-stringified arrays in TEXT columns:
- Serialization: `JSON.stringify(team)` before INSERT
- Deserialization: `JSON.parse(row.red_team)` after SELECT
- Handle null values with fallback to empty arrays

### Frontend-Backend Communication
- Frontend uses `fetch()` with async/await
- Backend enables CORS for cross-origin requests
- Response format follows camelCase convention for consistency
