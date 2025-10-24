const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS spymasters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      red_spymaster TEXT NOT NULL,
      blue_spymaster TEXT NOT NULL,
      winner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

app.get('/api/spymasters', (req, res) => {
  db.get('SELECT * FROM spymasters ORDER BY created_at DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.json({ redSpymaster: null, blueSpymaster: null });
    }
    res.json({
      redSpymaster: row.red_spymaster,
      blueSpymaster: row.blue_spymaster
    });
  });
});

app.get('/api/spymasters/history', (req, res) => {
  db.all('SELECT * FROM spymasters ORDER BY created_at DESC LIMIT 10', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      history: rows.map(row => ({
        redSpymaster: row.red_spymaster,
        blueSpymaster: row.blue_spymaster,
        winner: row.winner,
        createdAt: row.created_at
      }))
    });
  });
});

app.get('/api/spymasters/stats', (req, res) => {
  db.all('SELECT winner, COUNT(*) as count FROM spymasters WHERE winner IS NOT NULL GROUP BY winner', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const stats = { red: 0, blue: 0 };
    rows.forEach(row => {
      if (row.winner === 'red') stats.red = row.count;
      if (row.winner === 'blue') stats.blue = row.count;
    });
    res.json(stats);
  });
});

app.post('/api/spymasters', (req, res) => {
  const { redSpymaster, blueSpymaster, winner } = req.body;
  
  if (!redSpymaster || !blueSpymaster) {
    return res.status(400).json({ error: 'Both spymasters are required' });
  }
  
  db.run(
    'INSERT INTO spymasters (red_spymaster, blue_spymaster, winner) VALUES (?, ?, ?)',
    [redSpymaster, blueSpymaster, winner || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: 'Spymasters saved successfully',
        redSpymaster,
        blueSpymaster,
        winner: winner || null
      });
    }
  );
});

app.delete('/api/spymasters', (req, res) => {
  db.run('DELETE FROM spymasters', function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Spymasters cleared successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
