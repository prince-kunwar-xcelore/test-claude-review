const express = require("express");
const mysql = require("mysql");
const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "admin123",   // SECURITY: hardcoded credential in source code
  database: "myapp",
});

// SECURITY: SQL Injection — user input concatenated directly into query
app.get("/user", (req, res) => {
  const username = req.query.username;
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message }); // SECURITY: leaks internal error details
    res.json(results);
  });
});

// SECURITY: XSS — unsanitized user input reflected back as HTML
app.get("/greet", (req, res) => {
  const name = req.query.name;
  res.send(`<h1>Hello, ${name}</h1>`);
});

// SECURITY: Insecure direct object reference — no authorization check
app.get("/profile/:id", (req, res) => {
  const userId = req.params.id;
  db.query(`SELECT * FROM users WHERE id = ${userId}`, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results[0]);
  });
});

// SECURITY: Command injection — shell command built from user input
const { exec } = require("child_process");
app.post("/ping", (req, res) => {
  const host = req.body.host;
  exec(`ping -c 1 ${host}`, (err, stdout) => {
    res.send(stdout);
  });
});

// SECURITY: Storing plain-text password instead of a hash
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.query(
    `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`,
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("User registered");
    }
  );
});

app.listen(3000, () => console.log("Server running on port 3000"));
