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
const session_TTL = 0.5 * 60 * 1000; // change first number to 2 (for 2 minutes)

function requireAuth(req, res, next) {
    const cookies = req.headers.cookie;
    if (!cookies) return res.status(401).send({ error: "Not logged in" });
    const cookieArr = cookies.split(";").map(c => c.trim());
    const sessionID = cookieArr
        .find(c => c.startsWith("SessionID="))
        .substring("SessionID=".length);

    if (fs.existsSync(sessionsFile)) {
        sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
    }

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


app.post("/api/login", express.text(), (req, res) => {
    const username = req.body.trim();
    if (!username) return res.status(400).send("Empty username field.");

    const sessionID = crypto.randomUUID();
    if (mode === "cookie-insecure") res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/`);  // ...
    else if (mode === "cookie-httpOnly") res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/; HttpOnly`);
    else if (mode === "cookie-secure") res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/api; HttpOnly; Secure;`);
    else res.setHeader('Set-Cookie', `SessionID=${sessionID}; Path=/api; HttpOnly`);

    if (fs.existsSync(sessionsFile)) {
        sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
    }

    sessions.push({
        username: username,
        cookie: sessionID,
        createdAt: Date.now(),
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
    res.send({ username: req.session.username });
});

app.get("/api/emails", requireAuth, (req, res) => {
    const emails = JSON.parse(fs.readFileSync(new URL("emails.json", import.meta.url), "utf8"));
    res.json(emails);
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
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})