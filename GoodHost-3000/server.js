import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // I did it after finding URL class... I'll keep both variants

const app = express();
const PORT = 3000;

const versionPath = new URL("version.txt", import.meta.url); // path.resolve() didn't include server directory, so I searched better way to make path
const version = fs.readFileSync(versionPath, "utf-8").trim();
const configPath = new URL("config.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
let mode = config.mode;
const args = process.argv;
const modeIndex = args.indexOf("--mode");
if (modeIndex !== -1 && args[modeIndex + 1]) mode = args[modeIndex + 1];
console.log(`[System] Starting ${config.appName} v.${version}...`);


switch (mode) {
    case "mode1":
        app.use(cors());
        break;

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
        break;
}


app.get("/emails", (req, res) => {
    const emails = JSON.parse(fs.readFileSync(new URL("data.json", import.meta.url), "utf8"));
    res.json(emails);
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/main.js", (req, res) => {
    res.sendFile(path.join(__dirname, "main.js"));
});

app.listen(PORT, () => {
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})