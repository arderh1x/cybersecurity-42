import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import proxy from "express-http-proxy";

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


app.use("/", proxy("http://localhost:3000", {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => { // proxyReqOpts - request options which will send to 3000, srcReq - client's info
        console.log(srcReq.headers.cookie);
        return proxyReqOpts;
    }
}));

app.listen(PORT, () => {
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
})