const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const collectionName = "artHistory";


const searchSchema = new mongoose.Schema({
    query: { type: String, required: true },
    artwork: {
        id: Number,
        title: String,
        artist: String,
        imageURL: String
    },
    timestamp: { type: Date, default: Date.now }
}, {
    collection: collectionName

})

const searchHist = mongoose.models.searchHist || mongoose.model('searchHist', searchSchema);


router.use((req, res, next) => {
    console.log(`router request made`);
    next();
});



router.get(`/show-history`, async (req, res) => {
    try {
        const results = await searchHist.find().select(`query`).lean();
        let listem = ``;

        result.forEach(elem => { const quext = elem.query || `N/A`; listem += `<li>${quext} </li>` });




        const answer = `<p><em>Found: ${result.length} queries</em></p>
                        <ul>${listem}</ul>`;

        res.send(
            `<!DOCTYPE html>
                <html lang="en" id="historypage">
                    <head>
                    <link rel="stylesheet" href="style.css">
                    <link href="https://fonts.googleapis.com/css2?family=Amarante&family=Jacquard+12&display=swap" rel="stylesheet">  
                    <meta charset="utf-8" > 
                    <title>Search</title>	
                    </head>
                    <h1>View Past searches:</h1>
                    ${answer}
                    <br>
                    <a href="homepage.shtml">back to home</a>
                    </html>`);
    } catch (e) {
        console.error(e);
        res.status(400).send("history failed. ");
    }
});

module.exports = router; 
