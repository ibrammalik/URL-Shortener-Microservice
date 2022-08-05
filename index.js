require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shortid = require("shortid");
const dns = require("dns");
const app = express();

//set up bodyParse package
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

//use encoding in password for special characters
//connect to database
mongoose.connect(process.env["MONGO_URI"], { useNewUrlParser: true, useUnifiedTopology: true });

//creating new schema
let urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

//accessing model
let modelURL = mongoose.model("modelURL", urlSchema);

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

//short url api
app.post("/api/shorturl", (req, res) => {
  let original_url = req.body.url;
  let short_url = shortid.generate();
  let urlHostname = () => {
    const matches = original_url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    return matches && matches[1];
  };

  dns.lookup(urlHostname(), (err, addresses, family) => {
    if (err || urlHostname() === null) {
      res.send({ "error": 'invalid url' });
    } else {
      modelURL.create({ original_url: original_url, short_url: short_url }, (err, data) => {
        if (err) return handleError(err);
        console.log("Saved! ->" + data);
        // saved!
      });
      res.json({ original_url, short_url });
    }
  });

});

//
app.get("/api/shorturl/:id?", (req, res) => {
  modelURL.findOne({ short_url: req.params.id }, (err, data) => {
    if (err) return handleError(err);
    else if (data === null) {
      res.json({ "error": "No short URL found for the given input" });
    } else {
      res.redirect(data.original_url);
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
