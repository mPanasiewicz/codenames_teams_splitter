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

app.get('/api/spymasters/player-stats', (req, res) => {
  db.all('SELECT red_spymaster, blue_spymaster, created_at FROM spymasters ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const playerStats = {};

    rows.forEach(row => {
      const redSpymaster = row.red_spymaster;
      const blueSpymaster = row.blue_spymaster;
      const createdAt = new Date(row.created_at);

      if (redSpymaster) {
        if (!playerStats[redSpymaster]) {
          playerStats[redSpymaster] = {
            name: redSpymaster,
            timesAsSpymaster: 0,
            lastSpymasterDate: null
          };
        }
        playerStats[redSpymaster].timesAsSpymaster += 1;
        if (!playerStats[redSpymaster].lastSpymasterDate || createdAt > playerStats[redSpymaster].lastSpymasterDate) {
          playerStats[redSpymaster].lastSpymasterDate = createdAt;
        }
      }

      if (blueSpymaster) {
        if (!playerStats[blueSpymaster]) {
          playerStats[blueSpymaster] = {
            name: blueSpymaster,
            timesAsSpymaster: 0,
            lastSpymasterDate: null
          };
        }
        playerStats[blueSpymaster].timesAsSpymaster += 1;
        if (!playerStats[blueSpymaster].lastSpymasterDate || createdAt > playerStats[blueSpymaster].lastSpymasterDate) {
          playerStats[blueSpymaster].lastSpymasterDate = createdAt;
        }
      }
    });

    const now = new Date();
    const result = Object.values(playerStats).map(stat => ({
      name: stat.name,
      timesAsSpymaster: stat.timesAsSpymaster,
      lastSpymasterDate: stat.lastSpymasterDate ? stat.lastSpymasterDate.toISOString() : null,
      daysSinceLastSpymaster: stat.lastSpymasterDate
        ? Math.floor((now - stat.lastSpymasterDate) / (1000 * 60 * 60 * 24))
        : null
    }));

    res.json(result);
  });
});

app.get('/api/spymasters/advanced-stats', (req, res) => {
  db.all('SELECT red_spymaster, blue_spymaster, red_team, blue_team, winner, created_at FROM spymasters WHERE winner IS NOT NULL ORDER BY created_at ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const playerStats = {};

    // Initialize player tracking
    const initPlayer = (name) => {
      if (!playerStats[name]) {
        playerStats[name] = {
          name,
          winsAsSpymaster: 0,
          winsAsOperative: 0,
          currentSpymasterStreak: 0,
          maxSpymasterStreak: 0,
          currentOperativeStreak: 0,
          maxOperativeStreak: 0,
          currentOverallStreak: 0,
          maxOverallStreak: 0
        };
      }
    };

    // Process each game in chronological order
    rows.forEach(row => {
      const winner = row.winner;
      const redTeam = row.red_team ? JSON.parse(row.red_team) : [];
      const blueTeam = row.blue_team ? JSON.parse(row.blue_team) : [];

      let winningSpymaster = null;
      let winningOperatives = [];
      let losingSpymaster = null;
      let losingOperatives = [];

      if (winner === 'red') {
        winningSpymaster = redTeam[0] || row.red_spymaster;
        winningOperatives = redTeam.slice(1);
        losingSpymaster = blueTeam[0] || row.blue_spymaster;
        losingOperatives = blueTeam.slice(1);
      } else if (winner === 'blue') {
        winningSpymaster = blueTeam[0] || row.blue_spymaster;
        winningOperatives = blueTeam.slice(1);
        losingSpymaster = redTeam[0] || row.red_spymaster;
        losingOperatives = redTeam.slice(1);
      }

      // Get all players from both teams
      const allPlayers = [...redTeam, ...blueTeam].filter((p, i, arr) => arr.indexOf(p) === i);
      allPlayers.forEach(initPlayer);

      // Update winning spymaster stats
      if (winningSpymaster) {
        initPlayer(winningSpymaster);
        playerStats[winningSpymaster].winsAsSpymaster += 1;
        playerStats[winningSpymaster].currentSpymasterStreak += 1;
        playerStats[winningSpymaster].currentOverallStreak += 1;

        if (playerStats[winningSpymaster].currentSpymasterStreak > playerStats[winningSpymaster].maxSpymasterStreak) {
          playerStats[winningSpymaster].maxSpymasterStreak = playerStats[winningSpymaster].currentSpymasterStreak;
        }
        if (playerStats[winningSpymaster].currentOverallStreak > playerStats[winningSpymaster].maxOverallStreak) {
          playerStats[winningSpymaster].maxOverallStreak = playerStats[winningSpymaster].currentOverallStreak;
        }
      }

      // Update winning operatives stats
      winningOperatives.forEach(operative => {
        if (operative) {
          initPlayer(operative);
          playerStats[operative].winsAsOperative += 1;
          playerStats[operative].currentOperativeStreak += 1;
          playerStats[operative].currentOverallStreak += 1;

          if (playerStats[operative].currentOperativeStreak > playerStats[operative].maxOperativeStreak) {
            playerStats[operative].maxOperativeStreak = playerStats[operative].currentOperativeStreak;
          }
          if (playerStats[operative].currentOverallStreak > playerStats[operative].maxOverallStreak) {
            playerStats[operative].maxOverallStreak = playerStats[operative].currentOverallStreak;
          }
        }
      });

      // Reset losing spymaster streaks
      if (losingSpymaster) {
        initPlayer(losingSpymaster);
        playerStats[losingSpymaster].currentSpymasterStreak = 0;
        playerStats[losingSpymaster].currentOverallStreak = 0;
      }

      // Reset losing operatives streaks
      losingOperatives.forEach(operative => {
        if (operative) {
          initPlayer(operative);
          playerStats[operative].currentOperativeStreak = 0;
          playerStats[operative].currentOverallStreak = 0;
        }
      });
    });

    // Find top performers
    const players = Object.values(playerStats);

    const maxWinsAsSpymaster = Math.max(0, ...players.map(p => p.winsAsSpymaster));
    const maxWinsAsOperative = Math.max(0, ...players.map(p => p.winsAsOperative));
    const maxSpymasterStreak = Math.max(0, ...players.map(p => p.maxSpymasterStreak));
    const maxOperativeStreak = Math.max(0, ...players.map(p => p.maxOperativeStreak));
    const maxOverallStreak = Math.max(0, ...players.map(p => p.maxOverallStreak));

    const result = {
      mostWinsAsSpymaster: players.filter(p => p.winsAsSpymaster === maxWinsAsSpymaster && maxWinsAsSpymaster > 0).map(p => ({ name: p.name, wins: p.winsAsSpymaster })),
      mostWinsAsOperative: players.filter(p => p.winsAsOperative === maxWinsAsOperative && maxWinsAsOperative > 0).map(p => ({ name: p.name, wins: p.winsAsOperative })),
      highestSpymasterStreak: players.filter(p => p.maxSpymasterStreak === maxSpymasterStreak && maxSpymasterStreak > 0).map(p => ({ name: p.name, streak: p.maxSpymasterStreak })),
      highestOperativeStreak: players.filter(p => p.maxOperativeStreak === maxOperativeStreak && maxOperativeStreak > 0).map(p => ({ name: p.name, streak: p.maxOperativeStreak })),
      highestOverallStreak: players.filter(p => p.maxOverallStreak === maxOverallStreak && maxOverallStreak > 0).map(p => ({ name: p.name, streak: p.maxOverallStreak })),
      allPlayerStats: players
    };

    res.json(result);
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
