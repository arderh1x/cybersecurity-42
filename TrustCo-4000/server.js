import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

const versionPath = new URL("version.txt", import.meta.url);
const version = fs.readFileSync(versionPath, "utf-8").trim();
const configPath = new URL("config.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
let mode = config.mode;
const args = process.argv;
const modeIndex = args.indexOf("--mode");
if (modeIndex !== -1 && args[modeIndex + 1]) mode = args[modeIndex + 1];
console.log(`[System] Starting ${config.appName} v.${version}...`);


if (mode === "mode1") app.use(cors());

app.get("/support.js", (req, res) => {
    res.sendFile(path.join(__dirname, "support.js"));
});

app.get("/styles.css", (req, res) => {
    res.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/messages", (req, res) => {
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, "messages.json"), "utf8"));
    res.json(messages);
});

app.listen(PORT, () => {
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})