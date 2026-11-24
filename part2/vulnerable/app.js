// ============================================================
//  EDUCATION PORTAL  --  VULNERABLE VERSION
//  Every route here is written insecurely ON PURPOSE so we can
//  demonstrate the attack. The matching fix is in ../safe/app.js.
//  (This is a classroom demo, like OWASP WebGoat / DVWA.)
// ============================================================
const express = require('express');
const session = require('express-session');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const db = new DatabaseSync('./database.db');

app.set('view engine', 'ejs');                 // use EJS templates in /views
app.use(express.urlencoded({ extended: true })); // read form POST data
app.use(express.static('public'));             // serve style.css
app.use(session({ secret: 'demo', resave: false, saveUninitialized: true }));

// Small helper: only let logged-in users see a page
function mustLogin(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

app.get('/', (req, res) => res.redirect('/login'));

// ---------- LOGIN  (SQL Injection: Easy) ----------
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // VULNERABLE: the username/password are pasted straight into the SQL.
  // Typing  ' OR '1'='1  makes the WHERE always true -> login bypass.
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  try {
    const user = db.prepare(sql).get();
    if (user) { req.session.user = user; return res.redirect('/dashboard'); }
    res.render('login', { error: 'Wrong username or password.' });
  } catch (e) {
    // VULNERABLE (Intermediate SQLi): we leak the raw database error to the page.
    res.render('login', { error: 'SQL error: ' + e.message });
  }
});

app.get('/dashboard', mustLogin, (req, res) =>
  res.render('dashboard', { user: req.session.user }));

// ---------- REFLECTED XSS ----------
app.get('/welcome', (req, res) => {
  const name = req.query.name || 'Guest';
  // VULNERABLE: the name from the URL is put straight into the HTML.
  //   /welcome?name=<script>alert(1)</script>  runs the script.
  res.send(`<link rel="stylesheet" href="/style.css">
    <div class="card"><h1>Welcome ${name}!</h1>
    <a href="/dashboard">Back to dashboard</a></div>`);
});

// ---------- STORED XSS  (comments) ----------
app.get('/comments', (req, res) => {
  const comments = db.prepare('SELECT * FROM comments').all();
  res.render('comments', { comments, user: req.session.user });
});
app.post('/comments', mustLogin, (req, res) => {
  // VULNERABLE: the comment is saved as-is, and the page prints it with <%- %>
  // (unescaped), so a <script> comment runs for everyone who opens the page.
  db.prepare('INSERT INTO comments (username, content) VALUES (?, ?)')
    .run(req.session.user.username, req.body.content);
  res.redirect('/comments');
});

// ---------- DOM-based XSS ----------
app.get('/dom-xss', (req, res) => res.render('dom-xss'));

// ---------- CSRF  (change email with no token) ----------
app.get('/profile', mustLogin, (req, res) =>
  res.render('profile', { user: req.session.user }));
app.post('/update-email', mustLogin, (req, res) => {
  // VULNERABLE: no CSRF token. Any outside page can POST here using the
  // victim's logged-in cookie and silently change their email.
  const email = req.body.email;
  const id = req.session.user.id;
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id);
  // reload the whole user so the new email persists in the session
  req.session.user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.render('profile', { user: req.session.user, msg: 'Email updated to ' + email });
});

// ---------- SEARCH  (SQL Injection: Advanced / UNION) ----------
app.get('/search', mustLogin, (req, res) => {
  const q = req.query.q;
  let results = [], sql = '';
  if (q !== undefined) {
    // VULNERABLE: search term pasted into SQL. A UNION SELECT lets the
    // attacker read ANY table (e.g. usernames + passwords).
    sql = `SELECT username, email FROM users WHERE username LIKE '%${q}%'`;
    try { results = db.prepare(sql).all(); }
    catch (e) { return res.render('search', { results: [], q, sql, error: e.message }); }
  }
  res.render('search', { results, q, sql, error: null });
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

app.listen(3000, () =>
  console.log('VULNERABLE Education Portal running at http://localhost:3000'));
