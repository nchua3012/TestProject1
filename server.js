const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const nlp = require("compromise");
const Sentiment = require("sentiment"); // Import Sentiment.js


const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const sentiment = new Sentiment();

// Predefined emotion dictionary for matching adjectives to feelings
const emotionDictionary = {
    happy: ["happy", "excited", "joyful", "great", "fantastic", "awesome", "cheerful"],
    sad: ["sad", "down", "unhappy", "depressed", "melancholy"],
    angry: ["angry", "furious", "frustrated", "annoyed"],
    stressed: ["stressed", "overwhelmed", "burnt out"],
    relaxed: ["relaxed", "calm", "chill", "peaceful"],
    tired: ["tired", "exhausted", "sleepy", "fatigued"]
};

function analyzeEntry(entryString) {
    if (!entryString) return { location: "Unknown", feeling: "Neutral" };

    // Use Compromise NLP to extract adjectives and places
    let doc = nlp(entryString);
    let adjectives = doc.adjectives().out("array").map(adj => adj.toLowerCase());
    let locations = doc.places().out("array");

    // Extract location: If found, use the first one, else default to "Unknown"
    let location = locations.length ? locations.join(", ") : "Unknown";

    // Default feeling is "Neutral"
    let detectedFeeling = "Neutral";

    // Try to match adjectives with predefined emotions
    for (let [emotion, words] of Object.entries(emotionDictionary)) {
        if (adjectives.some(adj => words.includes(adj))) {
            detectedFeeling = emotion.charAt(0).toUpperCase() + emotion.slice(1); // Capitalize the emotion
            break;
        }
    }

    // If no emotion found, use Sentiment.js to analyze overall sentiment
    if (detectedFeeling === "Neutral") {
        let sentimentScore = sentiment.analyze(entryString).score;
        if (sentimentScore > 2) {
            detectedFeeling = "Happy"; // Positive sentiment
        } else if (sentimentScore < -2) {
            detectedFeeling = "Sad"; // Negative sentiment
        } else {
            detectedFeeling = "Neutral"; // Neutral sentiment
        }
    }

    // Return both location and feeling
    console.log(`Extracted -> Location: ${location}, Feeling: ${detectedFeeling}`);

    return { location, feeling: detectedFeeling };
}


app.post("/submit", (req, res) => {
    let { name, entryString } = req.body;

    // Run NLP analysis to extract location & feeling
    let analysis = analyzeEntry(entryString);

    let newData = {
        name,
        entryString,
        location: analysis.location,  // Store location
        feeling: analysis.feeling     // Store feeling
    };

    console.log("Saving Data:", newData);  // Check if data is processed correctly

    // Read current data, add new entry, and save to data.json
    fs.readFile("data.json", (err, data) => {
        let jsonData = [];
        if (!err && data.length) {
            jsonData = JSON.parse(data);
        }

        jsonData.push(newData);  // Add new data entry

        fs.writeFile("data.json", JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                res.status(500).send("Error saving data");
            } else {
                res.send("Data saved successfully");
            }
        });
    });
});


app.get("/data", (req, res) => {
    fs.readFile("data.json", (err, data) => {
        if (err) {
            res.status(500).send("Error reading data");
        } else {
            res.json(JSON.parse(data));
        }
    });
});


app.get("/userlist", (req, res) => {
    res.sendFile(path.join(__dirname, "userlist.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
