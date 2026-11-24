# Web Security Project — Education Portal (Vulnerable vs. Safe)

**Information Security — Assignment 2, Part 2 (Blue Team Focus)**

A full-stack Education Portal built to demonstrate how common web
vulnerabilities work **and** how they are properly fixed. The same application
is provided in two versions that share the exact same features:

| Folder | What it is |
|--------|------------|
| `part2/vulnerable/` | Deliberately insecure — every attack below works end-to-end. |
| `part2/safe/`       | The same app, hardened — every attack is blocked. |

The only difference between the two folders is the security code, so the
before/after comparison is clear.

## Group Members
- Mariam Shahzadi — 23F-3030
- Hareem Hamid — 23F-3105
- Radia Shehzad — 23F-3099

## Use case
An Education Portal where students log in, read and post course comments,
search for other students, and update their profile email. These ordinary
features are exactly where the vulnerabilities live.

## Tech stack
- **Node.js + Express** — web server
- **EJS** — HTML templates
- **SQLite** — a real SQL database, **built into Node.js** (`node:sqlite`), so
  there is no database server to install. A setup script creates the `.db` file.

## How to run (Windows)
Install **Node.js (LTS)** from <https://nodejs.org>. Nothing else is needed — no
MySQL, no database server, no Linux, no virtual machine.

**Vulnerable version — Terminal 1 (port 3000):**
```
cd part2\vulnerable
npm install
node db-setup.js
node app.js
```
Open <http://localhost:3000>

**Safe version — Terminal 2 (port 3001):**
```
cd part2\safe
npm install
node db-setup.js
node app.js
```
Open <http://localhost:3001>

Both run at the same time so each attack can be shown working (3000) and
blocked (3001) side by side. Demo login: `admin` / `admin123`.

## Vulnerabilities implemented (and their fixes)

| # | Vulnerability | Fix in the safe version |
|---|---------------|--------------------------|
| 1 | Reflected XSS | HTML-escape input before output |
| 2 | Stored XSS | Escape output with EJS `<%= %>` |
| 3 | DOM-based XSS | Use `textContent`, not `innerHTML` |
| 4 | CSRF | Per-session CSRF token, checked on POST |
| 5 | SQL Injection — Easy (login bypass) | Parameterized query (`?` placeholders) |
| 6 | SQL Injection — Intermediate (error leak) | Generic error, no DB details leaked |
| 7 | SQL Injection — Advanced (UNION) | Parameterized query |

All payloads are documented in [`PAYLOADS.md`](PAYLOADS.md), and the full report
with screenshots is `Part2_Web_Security_Report_FINAL.docx`.

## Project structure
```
part2/
  vulnerable/   insecure version (port 3000)
  safe/         hardened version (port 3001)
  attack/       the CSRF attacker pages
  README.md
PAYLOADS.md
Part2_Web_Security_Report_FINAL.docx
screenshots/
```
