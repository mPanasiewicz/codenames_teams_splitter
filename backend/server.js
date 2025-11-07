const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS spymasters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      red_spymaster TEXT NOT NULL,
      blue_spymaster TEXT NOT NULL,
      red_team TEXT,
      blue_team TEXT,
      winner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`ALTER TABLE spymasters ADD COLUMN red_team TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding red_team column:', err.message);
    }
  });
  
  db.run(`ALTER TABLE spymasters ADD COLUMN blue_team TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding blue_team column:', err.message);
    }
  });

  db.run(`ALTER TABLE spymasters ADD COLUMN black_card TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding black_card column:', err.message);
    }
  });
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
        id: row.id,
        redSpymaster: row.red_spymaster,
        blueSpymaster: row.blue_spymaster,
        redTeam: row.red_team ? JSON.parse(row.red_team) : [],
        blueTeam: row.blue_team ? JSON.parse(row.blue_team) : [],
        winner: row.winner,
        blackCard: row.black_card,
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
  const { redSpymaster, blueSpymaster, redTeam, blueTeam, winner, blackCard } = req.body;

  if (!redSpymaster || !blueSpymaster) {
    return res.status(400).json({ error: 'Both spymasters are required' });
  }

  db.run(
    'INSERT INTO spymasters (red_spymaster, blue_spymaster, red_team, blue_team, winner, black_card) VALUES (?, ?, ?, ?, ?, ?)',
    [redSpymaster, blueSpymaster, JSON.stringify(redTeam || []), JSON.stringify(blueTeam || []), winner || null, blackCard || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: 'Spymasters saved successfully',
        redSpymaster,
        blueSpymaster,
        redTeam,
        blueTeam,
        winner: winner || null,
        blackCard: blackCard || null
      });
    }
  );
});

app.delete('/api/spymasters/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM spymasters WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted successfully' });
  });
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
