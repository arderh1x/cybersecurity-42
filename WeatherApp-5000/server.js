import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

const versionPath = new URL("version.txt", import.meta.url);
const version = fs.readFileSync(versionPath, "utf-8").trim();
const configPath = new URL("config.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
let mode = config.mode;
const args = process.argv;
const modeIndex = args.indexOf("--mode");
if (modeIndex !== -1 && args[modeIndex + 1]) mode = args[modeIndex + 1]; // if --mode exists and if value after --mode also exists
console.log(`[System] Starting ${config.appName} v.${version}...`);


app.get("/weather.js", (req, res) => {
    if (mode === "breach1") { // in cmd: node WeatherApp-5000/server.js --mode breach1
        res.type("text/javascript").send(`
        alert("HACKED: I can see your cookies: " +
            document.cookie + " and User: " +
            document.getElementById('username').innerText)`);
    }

    else res.sendFile(path.join(__dirname, "weather.js"));
});

app.listen(PORT, () => {
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})