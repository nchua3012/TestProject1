const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware to serve static files (e.g., images, CSS, JS)
app.use(express.static(__dirname));  // This will serve static files from the root directory

// Body parser middleware to handle form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve the userlist page
app.get('/userlist', (req, res) => {
    res.sendFile(path.join(__dirname, 'userlist.html'));  // Make sure 'userlist.html' is in the root directory
});

// Fetch the user data (from data.json) and serve it
app.get('/data', (req, res) => {
    fs.readFile('data.json', (err, data) => {
        if (err) {
            res.status(500).send('Error reading data');
        } else {
            res.json(JSON.parse(data));  // Return user data as JSON
        }
    });
});

// Handle form submission to save user data
app.post('/submit', (req, res) => {
    const newData = req.body;

    fs.readFile('data.json', (err, data) => {
        let jsonData = [];
        if (!err && data.length) {
            jsonData = JSON.parse(data);  // Parse existing data
        }

        const exists = jsonData.some(user => user.email === newData.email);
        if (exists) {
            res.status(400).send('This email is already registered.');
        } else {
            jsonData.push(newData);  // Add new user data

            fs.writeFile('data.json', JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    res.status(500).send('Error saving data');
                } else {
                    res.send('Data saved successfully');
                }
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
