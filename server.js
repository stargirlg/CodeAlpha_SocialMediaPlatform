const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./social.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('SQLite database connected.');
});

// Create tables for users, posts, comments, and likes
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, content TEXT, likes INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, username TEXT, text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Auth Routes
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
    if (err) return res.status(400).json({ error: "Username already taken" });
    res.json({ message: "Account created successfully!" });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (err || !user) return res.status(401).json({ error: "Invalid username or password" });
    res.json({ message: "Login successful", username: user.username });
  });
});

// Post & Feed Routes
app.get('/api/posts', (req, res) => {
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(posts);
  });
});

app.post('/api/posts', (req, res) => {
  const { username, content } = req.body;
  if (!content) return res.status(400).json({ error: "Post content cannot be empty" });
  db.run("INSERT INTO posts (username, content) VALUES (?, ?)", [username, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Post published!" });
  });
});

app.post('/api/posts/:id/like', (req, res) => {
  const postId = req.params.id;
  db.run("UPDATE posts SET likes = likes + 1 WHERE id = ?", [postId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Post liked!" });
  });
});

// Comments Routes
app.get('/api/posts/:id/comments', (req, res) => {
  db.all("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC", [req.params.id], (err, comments) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(comments);
  });
});

app.post('/api/posts/:id/comments', (req, res) => {
  const { username, text } = req.body;
  db.run("INSERT INTO comments (post_id, username, text) VALUES (?, ?, ?)", [req.params.id, username, text], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Comment added!" });
  });
});

app.listen(PORT, () => console.log(`Social Media app running at http://localhost:${PORT}`));