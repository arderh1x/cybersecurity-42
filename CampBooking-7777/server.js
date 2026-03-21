import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync, constants } from "node:sqlite";
//import sqlite from "sqlite3";
//import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 7777;

const configPath = new URL("config.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
let mode = config.mode;
const args = process.argv;
const modeIndex = args.indexOf("--mode");
if (modeIndex !== -1 && args[modeIndex + 1]) mode = args[modeIndex + 1];
console.log(`[System] Starting ${config.appName} v.${config.version}...`);


const db = new DatabaseSync(path.join(__dirname, "database.db")); // { readOnly: true }
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    age INTEGER NOT NULL,
    email TEXT NOT NULL,
    date TEXT NOT NULL
  )
`);

db.setAuthorizer((actionCode, arg1, arg2, dbName, triggerOrView) => {
    const badActions = [constants.SQLITE_DROP_TABLE, constants.SQLITE_DELETE, constants.SQLITE_ALTER_TABLE];
    if (badActions.includes(actionCode)) return constants.SQLITE_DENY;
    return constants.SQLITE_OK;
});

app.get("/nuke", (req, res) => {
    try {
        db.exec(`DROP TABLE bookings`);
        res.status(200).send("oh... 💥💥💥💥💥💥"); // xd
    }
    catch (e) {
        console.log("Error while DROP TABLE: ", e.message);
        res.status(401).send("don't allowed to DROP");
    }
});

app.get("/get-all", (req, res) => {
    const sql = "SELECT * FROM bookings";
    const result = db.prepare(sql).all();
    console.log(result);
    res.send(result);
});

app.get("/search-bookings", (req, res) => {
    const searchName = req.query.name;
    const sql = "SELECT * FROM bookings WHERE name = ?";
    const result = db.prepare(sql).all(searchName);

    console.log(result);
    res.send(result);
});


app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public"))); // GET

app.post("/submit-booking", (req, res) => {
    if (!req.body) return res.send(400); // can crash server if req.body is not exist

    const { name, surname, email, age, date } = req.body; // destructuring for convenience
    if (!name || !surname || !email || !age || !date) return res.status(400).send("bad empty");

    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) return res.status(400).send("bad email");

    const ageInt = +age;
    if (Number.isNaN(ageInt)) return res.status(400).send("bad age - type");
    else if (ageInt < 5 || ageInt > 100) return res.status(400).send("bad age - value");

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return res.status(400).send("bad date - type");

    const [year, month, day] = date.split("-").map(e => +e);
    const dateD = new Date(year, month - 1, day);
    if (dateD.getFullYear() !== year || dateD.getMonth() !== month - 1 || dateD.getDate() !== day)
        return res.status(400).send("bad date - value");

    const booking = { name, surname, email, age, date };
    console.log('Received new booking: ', booking);

    const sql = `INSERT INTO bookings (name, surname, email, age, date) VALUES (?, ?, ?, ?, ?)`;
    const result = db.prepare(sql).all(name, surname, email, +age, date);

    res.send(`<meta http-equiv="refresh" content="1; url=/">` + // 1 sec redirect to main page
        `<h1>We got your booking!</h1>
        <p>Name: ${escapingForHTML(name)}</p>
        <p>Surname: ${escapingForHTML(surname)}</p>
        <p>Email: ${escapingForHTML(email)}</p>
        <p>Age: ${escapingForHTML(age)}</p>
        <p>Date: ${escapingForHTML(date)}</p>`)
});

const escapingForHTML = (str) => {
    if (typeof str !== "string") return str;
    return str.replace(/[<>]/g, (match) => {
        if (match === "<") return "&lt;";
        else if (match === ">") return "&gt;";
        else return match;
    });
}


app.listen(PORT, () => {
    console.log(`[System] Server started in mode "${mode}" on port ${PORT}.`);
});