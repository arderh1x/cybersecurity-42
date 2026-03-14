import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import proxy from "express-http-proxy";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

const configPath = new URL("config.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
let mode = config.mode;
const args = process.argv;
const modeIndex = args.indexOf("--mode");
if (modeIndex !== -1 && args[modeIndex + 1]) mode = args[modeIndex + 1];
console.log(`[System] Starting ${config.appName} v.${config.version}...`);

const CA_BUNDLE = [fs.readFileSync("https-certificates/cert.pem")]
const httpsAgent = new https.Agent({ ca: CA_BUNDLE });

app.use("/", proxy("https://localhost:3443", {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => { // proxyReqOpts - request options which will send to 3000, srcReq - client's info
        proxyReqOpts.agent = httpsAgent;
        //proxyReqOpts.headers["x-proxy"] = "true";
        if (mode === "breach") console.log(srcReq.headers.cookie); // I forgot.
        return proxyReqOpts;
    }
}));

app.listen(PORT, () => {
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})