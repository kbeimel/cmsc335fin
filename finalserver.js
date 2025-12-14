const path = require('path');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { title } = require('process');
const app = express();
const API_BASE = 'https://api.artic.edu/api/v1/artworks/search';


require("dotenv").config({
    path: path.resolve(__dirname, "credentialsDontPost/.env"),
});

const def_port = 4000;
const u_port = parseInt(process.argv[2]);
const port = u_port || def_port;
const httpSuccessStatus = 200;

const databaseName = "CMSC335DB";
const collectionName = "artHistory";
const uri = process.env.MONGO_CONNECTION_STRING;
const searchSchema = new mongoose.Schema({
    query: { type: String, required: true },
    artwork: {
        id: Number,
        title: String,
        artist: String,
        imageUrl: String
    },
    timestamp: { type: Date, default: Date.now }
}, {
    collection: collectionName

})

const searchHist = mongoose.model('searchHist', searchSchema);

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).then(() => console.log('mongoose connected')).catch(err => console.error('mongoose error:', err));


app.get('/', (req, res) => { res.redirect('/homepage.shtml'); });

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));



app.post('/make-search', async (req, res) => { //was submit-application

    const query = req.body.q;

    if (!query) {
        return res.status(400).send("missing search query");
    }

    let work = null;

    try {
        const apiURL = `${API_BASE}?q=${query}&fields=id,title,artist_display,image_id&limit=1`;

        const apiResponse = await axios.get(apiURL);
        const { data, config } = apiResponse.data;

        if (data.length === 0) {
            return res.status(400).send("no results found. please try another search term.");
        }

        const artwork = data[0];
        const baseURL = config.iiif_url;
        let imageURL = null;

        if (artwork.image_id) {
            imageURL = `${baseURL}/${artwork.image_id}/full/843,/0/default.jpg`
        }

        work = {
            id: artwork.id,
            title: artwork.title,
            artist: artwork.artist_display,
            imageUrl: imageURL,
        };

        await searchHist.create({
            query: query,
            artwork: work
        });


        res.send(`<!DOCTYPE html>
                <html lang="en">
                    <head>
                    <link rel="stylesheet" href="style.css">  
                    <meta charset="utf-8" > 
                    <title>Search</title>	
                    </head>
                    <h1>${work.title}</h1>
                    <strong>Artist:</strong> ${work.artist} <br>
                    <img src=${imageURL}/>
                    <br>
                    <a href="homepage.shtml">back to home</a>
`);

    } catch (e) {
        console.error(e);
        res.end();
    }

}
)



app.get('/show-history', async (req, res) => {

    try {
        result = await searchHist.find().lean();

        let answer = "";

        result.forEach(elem => answer += `${elem} <br>`);
        answer += `Found: ${result.length} queries`;
        res.send(answer);
    } catch (e) {
        console.error(e);
    }

});


app.post('/clear-history', async (req, res) => {

    try {
        const result = await searchHist.deleteMany({});
        const numm = result.deletedCount;
        res.send(`
<!DOCTYPE html>
<html lang="en">
    <head>
    <link rel="stylesheet" href="style.css">  
    <meta charset="utf-8" > 
	<title>Clear History</title>	
	</head>
    <h1>success.</h1>
    ${numm} queries were removed.
    <hr>
    <a href="homepage.shtml">back to home</a>`);
    } catch (e) {
        res.send(e);
    }
});


app.listen(port, () => {
    console.log(`Web server is running at http://localhost:${port}`);
});
