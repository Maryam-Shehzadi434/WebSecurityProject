// ============================================================
//  EDUCATION PORTAL  --  SAFE (HARDENED) VERSION
//  Same app and same pages as ../vulnerable, but every attack is
//  now blocked. Read each "FIX:" comment to see what changed.
// ============================================================
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');                 // for the CSRF token
const { DatabaseSync } = require('node:sqlite');

const app = express();
const db = new DatabaseSync('./database.db');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'demo', resave: false, saveUninitialized: true }));

function mustLogin(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// FIX (CSRF): give every session a secret random token and make it
// available to all templates as `csrfToken`.
app.use((req, res, next) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(16).toString('hex');
  res.locals.csrfToken = req.session.csrf;
  next();
});

app.get('/', (req, res) => res.redirect('/login'));

// ---------- LOGIN (SQL Injection fixed) ----------
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // FIX (SQLi): use ? placeholders. The values are sent separately from the
  // SQL, so ' OR '1'='1 is treated as a plain string, not as code.
  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND password = ?'
  ).get(username, password);
  if (user) { req.session.user = user; return res.redirect('/dashboard'); }
  res.render('login', { error: 'Wrong username or password.' }); // no raw errors leaked
});

app.get('/dashboard', mustLogin, (req, res) =>
  res.render('dashboard', { user: req.session.user }));

// ---------- REFLECTED XSS fixed ----------
function escapeHtml(s) {
  // FIX (XSS): turn dangerous characters into harmless text.
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
app.get('/welcome', (req, res) => {
  const name = escapeHtml(req.query.name || 'Guest'); // escaped before output
  res.send(`<link rel="stylesheet" href="/style.css">
    <div class="card"><h1>Welcome ${name}!</h1>
    <a href="/dashboard">Back to dashboard</a></div>`);
});

// ---------- STORED XSS fixed ----------
app.get('/comments', (req, res) => {
  const comments = db.prepare('SELECT * FROM comments').all();
  res.render('comments', { comments, user: req.session.user });
});
app.post('/comments', mustLogin, (req, res) => {
  // Parameterized insert (safe). The real fix for stored XSS is in the
  // template: comments.ejs now prints with <%= %> which auto-escapes.
  db.prepare('INSERT INTO comments (username, content) VALUES (?, ?)')
    .run(req.session.user.username, req.body.content);
  res.redirect('/comments');
});

// ---------- DOM-based XSS fixed ----------
app.get('/dom-xss', (req, res) => res.render('dom-xss'));

// ---------- CSRF fixed ----------
app.get('/profile', mustLogin, (req, res) =>
  res.render('profile', { user: req.session.user }));
app.post('/update-email', mustLogin, (req, res) => {
  // FIX (CSRF): the form must send back the secret token. An outside page
  // cannot know it, so forged requests are rejected here.
  if (req.body._csrf !== req.session.csrf) {
    return res.status(403).render('profile',
      { user: req.session.user, msg: 'Blocked: invalid CSRF token.' });
  }
  const email = req.body.email;
  const id = req.session.user.id;
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id);
  req.session.user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.render('profile', { user: req.session.user, msg: 'Email updated to ' + email });
});

// ---------- SEARCH (SQL Injection fixed) ----------
app.get('/search', mustLogin, (req, res) => {
  const q = req.query.q;
  let results = [];
  if (q !== undefined) {
    // FIX (SQLi): placeholder again. UNION injection no longer works because
    // the whole input is just the search text, never SQL.
    results = db.prepare(
      "SELECT username, email FROM users WHERE username LIKE ?"
    ).all('%' + q + '%');
  }
  res.render('search', { results, q, sql: null, error: null });
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

app.listen(3001, () =>
  console.log('SAFE Education Portal running at http://localhost:3001'));
