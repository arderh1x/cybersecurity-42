import express from "express";

const app = express();
const PORT = 3000;

app.use((req, res) => {
    res.redirect(301, `https://localhost:3443${req.url}`);
});

app.listen(PORT, () => {
    console.log(`[System] Insecure Server (HTTP) started on port ${PORT}.`);
})