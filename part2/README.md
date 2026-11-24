# Education Portal — Web Security Project (Part 2, Blue Team Focus)

A small full-stack **Education Portal** built to show how common web
vulnerabilities work **and** how they are fixed. The exact same app is
provided in two versions:

| Folder | What it is |
|--------|------------|
| `vulnerable/` | Deliberately insecure. Every attack below works end-to-end. |
| `safe/`       | The same app, hardened. Every attack is blocked. |

The difference between the two folders is *only* the security code, so you can
compare them side by side.

---

## Use case

An **Education Portal** where students log in, read and post course comments,
search for other students, and update their profile email. These ordinary
features are exactly where the vulnerabilities live.

## Tech stack

- **Node.js** + **Express** — the web server
- **EJS** — HTML page templates
- **SQLite** — a real SQL database. It is **built into Node.js** (`node:sqlite`),
  so the whole database is just one file (`database.db`) that a setup script
  creates. **No database server to install.**

Everything is plain, commented JavaScript so each line can be explained.

---

## What you need to install (Windows 11)

1. Install **Node.js LTS (v22 or newer)** from <https://nodejs.org> — download
   the Windows installer and click *Next* until it finishes.
2. That's it. **You do NOT need MySQL, XAMPP, a database server, Kali Linux,
   or a virtual machine.** A normal Chrome or Edge browser on Windows is all
   you need to demonstrate the attacks.

To check it installed, open **Command Prompt** or **PowerShell** and run:

```
node -v
```

You should see a version number like `v22.x.x`.

---

## How to run

> Run these in Command Prompt or PowerShell. Do the **vulnerable** version
> first, demonstrate the attacks, then stop it (`Ctrl + C`) and run the
> **safe** version to show each attack is blocked. Both use port 3000, so run
> only one at a time.

### Vulnerable version

```
cd vulnerable
npm install
node db-setup.js        (creates the database — run once)
node app.js
```

Then open **http://localhost:3000** in your browser.

### Safe version

```
cd safe
npm install
node db-setup.js
node app.js
```

Then open **http://localhost:3000** again.

**Demo logins:** `admin` / `admin123`  •  `alice` / `alice2024`

---

## The vulnerabilities and their fixes

| # | Vulnerability | Where | Fix in the safe version |
|---|---------------|-------|--------------------------|
| 1 | **Reflected XSS** | `/welcome?name=...` | HTML-escape the input before output |
| 2 | **Stored XSS** | comments page | Print with EJS `<%= %>` (auto-escapes) |
| 3 | **DOM-based XSS** | `/dom-xss` (URL `#hash`) | Use `textContent` instead of `innerHTML` |
| 4 | **CSRF** | change email form | Per-session secret CSRF token, checked on submit |
| 5 | **SQL Injection — Easy** | login form | Parameterized query (`?` placeholders) |
| 6 | **SQL Injection — Intermediate** | login (error leak) | Don't show raw DB errors to the user |
| 7 | **SQL Injection — Advanced (UNION)** | student search | Parameterized query |

### The exact payloads

- **Reflected XSS:** open `http://localhost:3000/welcome?name=<script>alert('Reflected XSS fired!')</script>`
- **Stored XSS:** post this as a comment: `<script>alert('Stored XSS fired!')</script>`
- **DOM-based XSS:** open `http://localhost:3000/dom-xss#<img src=x onerror=alert('DOM XSS fired!')>`
- **CSRF:** while logged in, open `part2/attack/csrf-attack.html` — it silently changes your email to `hacked@evil.com`
- **SQLi Easy (login bypass):** username `admin' OR '1'='1`  password: anything
- **SQLi Intermediate (error-based):** username `admin'`  — the raw SQL error leaks
- **SQLi Advanced (UNION chain)**, type each in the student search box in order:
  1. `zzz' UNION SELECT 1, 2 --`  → confirms the query has 2 columns
  2. `zzz' UNION SELECT name, type FROM sqlite_master --`  → lists table names
  3. `zzz' UNION SELECT sql, '' FROM sqlite_master WHERE name='users' --`  → shows the users table's columns
  4. `zzz' UNION SELECT username, password FROM users --`  → dumps all usernames and passwords

Screenshots of every attack succeeding (vulnerable) and being blocked (safe)
are in the `../screenshots/` folder and in the report document.

---

## Project structure

```
part2/
  vulnerable/        insecure version
    app.js           all the insecure routes (commented)
    db-setup.js      creates database.db from seed-data.sql
    seed-data.sql    database tables + starting data
    views/           EJS pages
    public/style.css
  safe/              hardened version (same layout, "FIX:" comments)
  attack/
    csrf-attack.html the malicious page used for the CSRF demo
  README.md
```
