import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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


app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public"))); // GET

const bookingsArr = [];
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
    bookingsArr.push(booking);

    console.log('Received new booking: ', booking);
    res.send(`<meta http-equiv="refresh" content="1; url=/">` + // 1 sec redirect to main page
        `<h1>We got your booking!</h1>
        <p>Name: ${escapingForHTML(name)}</p>
        <p>Surname: ${escapingForHTML(surname)}</p>
        <p>Email: ${escapingForHTML(email)}</p>
        <p>Age: ${escapingForHTML(age)}</p>
        <p>Date: ${escapingForHTML(date)}</p>`)
    //res.redirect("/");
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