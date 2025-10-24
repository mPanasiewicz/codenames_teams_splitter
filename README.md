# Codenames Team Splitter

A web application for splitting Codenames players into balanced teams, tracking spymasters, and recording game statistics.

## Features

- 🎲 Random team splitting with automatic spymaster assignment
- 💾 Persistent storage of game history
- 🏆 Win statistics tracking
- 📜 Game history with full team rosters
- 🎮 Clean, responsive UI with Tailwind CSS

## Tech Stack

**Backend:**
- Node.js + Express
- SQLite3 database
- CORS enabled

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5
- Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd codenames
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

## Running the Application

### Option 1: Local Development

1. Start the backend server:
```bash
cd backend
npm start
```
The server will run on http://localhost:3000

2. Open the frontend:
```bash
open frontend/index.html
```
Or simply open `frontend/index.html` in your browser.

### Option 2: Docker

Run both frontend and backend with Docker Compose:
```bash
docker-compose up
```
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Usage

1. **Add Players**: Enter player names in the input field and click "Add"
2. **Split Teams**: Click "Split Teams" to randomly assign players to Red and Blue teams
3. **Mark Winner**: After the game, click the winning team's button
4. **Save Game**: Click "Save Spymasters" to record the game in history
5. **View History**: Scroll down to see past games and statistics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spymasters` | Get most recent spymasters |
| GET | `/api/spymasters/history` | Get last 10 games |
| GET | `/api/spymasters/stats` | Get win statistics |
| POST | `/api/spymasters` | Save game result |
| DELETE | `/api/spymasters/:id` | Delete specific game |
| DELETE | `/api/spymasters` | Clear all history |

## Project Structure

```
codenames/
├── backend/
│   ├── server.js         # Express server & API routes
│   ├── package.json      # Backend dependencies
│   ├── Dockerfile        # Backend container config
│   └── database.db       # SQLite database (auto-generated)
├── frontend/
│   └── index.html        # Single-page application
├── docker-compose.yml    # Docker orchestration
└── README.md
```

## Database Schema

```sql
CREATE TABLE spymasters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  red_spymaster TEXT NOT NULL,
  blue_spymaster TEXT NOT NULL,
  red_team TEXT,           -- JSON array of players
  blue_team TEXT,          -- JSON array of players
  winner TEXT,             -- 'red' or 'blue'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Default Players

The app comes with 10 default players:
- Beth, Melissa, Ava, Paweł, Steve, Piotr, Lucas, Maciej, Shalini, Orlane

Players can be added or removed through the UI.

## License

MIT
