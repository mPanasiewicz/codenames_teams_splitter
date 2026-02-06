# Agent Guidelines for Codenames Team Splitter

## Build/Run Commands
- **Start backend**: `cd backend && npm start` (runs on port 3000)
- **Start frontend**: Open `frontend/index.html` in browser or use `docker-compose up`
- **Docker**: `docker-compose up` (backend:3000, frontend:8080)
- **No tests/linting configured** - verify manually after changes

## Code Style

### Backend (Node.js/Express)
- **Language**: JavaScript (CommonJS), no TypeScript
- **Imports**: Use `require()` at top of file
- **Naming**: camelCase for variables/functions, snake_case for DB columns
- **Error handling**: Return JSON with `{ error: message }` and appropriate status codes
- **DB**: SQLite3 with callbacks (not promises). Check for "duplicate column name" in ALTER errors
- **Routes**: Express router pattern with `app.get()`, `app.post()`, `app.delete()`

### Frontend (Vanilla JS)
- **Language**: Plain JavaScript (ES6+) embedded in HTML
- **Styling**: Tailwind CDN classes, inline styles for animations
- **Naming**: camelCase for JS, kebab-case for HTML IDs/classes
- **API calls**: async/await with fetch, API_URL constant for endpoints
- **Error handling**: Show user-friendly messages via `showMessage()` function
- **DOM**: Direct manipulation with `getElementById()`, `createElement()`
