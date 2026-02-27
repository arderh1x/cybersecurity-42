import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // I did it after finding URL class... I'll keep both variants

const app = express();
const PORT = 3000;

const configPath = new URL("config.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
let mode = config.mode;
const args = process.argv;
const modeIndex = args.indexOf("--mode");
if (modeIndex !== -1 && args[modeIndex + 1]) mode = args[modeIndex + 1];
console.log(`[System] Starting ${config.appName} v.${config.version}...`);


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());

switch (mode) {
    case "mode1": break;
    case "csp-balanced-fetch": break;
    case "mode-insecure": break;
    case "mode-sri-active": break;

    case "csp-strict":
        app.use((req, res, next) => {
            res.setHeader("Content-Security-Policy", "default-src 'self';");
            next();
        });
        break;

    case "csp-balanced":
        app.use((req, res, next) => {
            res.setHeader("Content-Security-Policy", "default-src 'self'; img-src *; style-src *; " +
                "script-src 'self' http://localhost:4000 http://localhost:6001;");
            next();
        });
        break;

    case "csp-balanced-fetch":
        app.use((req, res, next) => {
            res.setHeader("Content-Security-Policy", "default-src 'self'; img-src *; style-src *; " +
                "script-src 'self' http://localhost:4000 http://localhost:6001; connect-src 'self' http://localhost:4000");
            next();
        });
        break; // I put back this code in switch for attack demonstration

}


let sessions = [];
const sessionsFile = new URL("sessions.json", import.meta.url);
const session_TTL = 2 * 60 * 1000; // change first number to 2 (for 2 minutes)

function requireAuth(req, res, next) {
    const cookies = req.headers.cookie;
    if (!cookies) return res.status(401).send({ error: "Not logged in" });
    const cookieArr = cookies.split(";").map(c => c.trim());
    const sessionID = cookieArr
        .find(c => c.startsWith("SessionID="))
        .substring("SessionID=".length);

    if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));

    const session = sessions.find(s => s.cookie === sessionID);
    if (!session) return res.status(401).send({ error: "Not logged in" });

    if (Date.now() - session.createdAt > session_TTL) {
        sessions = sessions.filter(s => s !== session);
        fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
        return res.status(401).send({ error: "Session expired" });
    } // delete only on request and only requested session

    req.session = session;
    next();
}


app.post("/api/login", (req, res) => {
    const username = req.body.trim();
    if (!username) return res.status(400).send("Empty username field.");

    const sessionID = crypto.randomUUID();
    switch (mode) {
        case "cookie-insecure":
            res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/;`);
            break;

        case "cookie-httpOnly":
            res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/; HttpOnly;`);
            break;

        case "cookie-secure":
            res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/api; HttpOnly; Secure;`);
            break;

        case "cookie-sameSite-none":
            console.log("123");
            res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/api; HttpOnly; SameSite=None; Secure;`);
            break;

        case "cookie-sameSite-lax":
            res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/api; HttpOnly; SameSite=Lax;`);
            break;

        case "cookie-sameSite-strict":
            res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/api; HttpOnly; SameSite=Strict;`);
            break;

        default:
            res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/api; HttpOnly;`);
    }

    if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));

    sessions.push({
        username: username,
        cookie: sessionID,
        createdAt: Date.now(),
        _csrf_token: crypto.randomUUID() + "-T",
    });
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2)); // null is replacer (filter), 2 is space amount (for better reading)
    res.send("Login Successful!");
});

app.get("/api/logout", requireAuth, (req, res) => {
    sessions = sessions.filter(s => s !== req.session);
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    res.send("Logout Successful!");
});

app.get("/api/me", requireAuth, (req, res) => {
    res.send({
        username: req.session.username,
        _csrf_token: req.session._csrf_token,
    });
});


const emailsFile = new URL("emails.json", import.meta.url);
app.get("/api/emails", requireAuth, (req, res) => {
    const emails = JSON.parse(fs.readFileSync(emailsFile, "utf8"));
    res.json(emails);
});

app.get("/api/emails/delete/:id", requireAuth, (req, res) => {
    res.status(410).send("Deprecated deletion method - insecure."); // 410 gone
    // let emails = JSON.parse(fs.readFileSync(emailsFile, "utf8"));
    // emails = emails.filter(e => e.id != req.params.id);
    // fs.writeFileSync(emailsFile, JSON.stringify(emails, null, 2));
    // res.send("deleted");
});

app.post("/api/emails/delete/:id", requireAuth, (req, res) => {
    const token = req.body._csrf_token.trim();
    if (token !== req.session._csrf_token) return res.status(403).send("Forbidden - CSRF.");

    let emails = JSON.parse(fs.readFileSync(emailsFile, "utf8"));
    emails = emails.filter(e => e.id != req.params.id);
    fs.writeFileSync(emailsFile, JSON.stringify(emails, null, 2));
    res.send("deleted");
});


app.get("/", (req, res) => {
    let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    html = html.replace(`<script src="http://localhost:6001/react-mock.js"`,
        `<script src="http://localhost:6001/react-mock.js"
             integrity="sha256-1c47stpx27K9A9z7HBSs6KL2Q80XXUj5yxk5QTeFyKU="
             crossorigin="anonymous"`
    );

    res.send(html);
});

app.get("/main.js", (req, res) => {
    res.sendFile(path.join(__dirname, "main.js"));
});

app.listen(PORT, () => {
    /* if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
    sessions = sessions.filter(s => Date.now() - s.createdAt < session_TTL);
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));  
    ---- clear all dead sessions on server start: can't be used with nodemon, so it's commented */

    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})