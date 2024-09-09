// Import necessary packages
const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Initialize Express app
const app = express();

// File with saved renders
const renderFile = 'renders.csv';

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Use the public directory for static files
app.use(express.static(path.join(__dirname, 'public')));

const allLocations = ['beach', 'room'];
const allExpressions = ['nervous', 'laughing', 'disappointed', 'mortified', 'smile', 'beaming', 'neutral', 'elated', 'flustered', 'exasperated', 'skeptical', 'embarrassed', 'awkward', 'Admiration'];
const nudeStates = ['true', 'false'];

app.get('/balls', async (req, res) => {
  let location = req.query.location;
  let expression = req.query.expression;
  let nude = req.query.nude;
  // Check if we have a saved render for these parameters
  let url;
  if (fs.existsSync(renderFile)) {
    const data = fs.readFileSync(renderFile, 'utf8');
    const lines = data.split('\r\n');
    for (let line of lines) {
      const parts = line.split('|');
      if (parts[0] === location && parts[1] === expression && parts[2] === nude) {
        url = parts[3];
        break;
      }
    }
  }

  // If we didn't find an existing render, make a new one
  if (!url) {
    // Use Puppeteer to capture a screenshot
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({
      width: 700,
      height: 512
    });

    await page.goto(`http://localhost:3000/render?location=${location}&expression=${expression}&nude=${nude}`, {
      waitUntil: 'networkidle2',
    });

    const screenshotBuffer = await page.screenshot();

    await browser.close();

    // Upload to Catbox
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('userhash', '');
    form.append('fileToUpload', screenshotBuffer, {
      filename: `screenshot_${expression}_${nude}.png`,
      contentType: 'image/png'
    });

    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form
    });

    url = await catboxResponse.text();

    // Store the render for these parameters
    fs.appendFileSync(renderFile, `${location}|${expression}|${nude}|${url}\r\n`, 'utf-8');
  }

  // Redirect to the URL of the image
  res.redirect(url);
});

app.get('/render', (req, res) => {
  let location = req.query.location;
  let expression = req.query.expression;
  let nude = req.query.nude; // Keep it as a string

  res.render('index', {location: location, expression: expression, nude}); // Convert string to boolean only when rendering
});

app.get('/batchrender', async (req, res) => {
  for (let location of allLocations) {
    for (let expression of allExpressions) {
      for (let nude of nudeStates) {
        const url = `http://localhost:3000/?location=${location}&expression=${expression}&nude=${nude}`

        // Visit each URL in headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setViewport({
          width: 700,
          height: 512
        });

        await page.goto(url, {
          waitUntil: 'networkidle2',
        });

        // Close the headless browser after each render to save resources.
        await browser.close();
      }
    }
  }

  res.send('Done batch rendering!');
});

// Listen on port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000.");
});

/*
// Import necessary packages
const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

// Initialize Express app
const app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Use the public directory for static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
    let location = req.query.location;
    let expression = req.query.expression;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
	
	await page.setViewport({
		width: 512,
		height: 288
	});

    // Puppeteer will visit the URL and render the page.
    await page.goto(`http://localhost:3000/render?location=${location}&expression=${expression}`, {
        waitUntil: 'networkidle0', // Wait until all resources are loaded.
    });

    // Take screenshot of the rendered page.
    const screenshotBuffer = await page.screenshot();

    // Close the headless browser.
    await browser.close();

    // Send back the screenshot as a response.
    res.type('image/png').send(screenshotBuffer);
});

app.get('/render', (req, res) => {
  let location = req.query.location;
  let expression = req.query.expression;

  res.render('index', {location: location, expression: expression});
});

// Listen on port 3000, can be any port
app.listen(3000, () => {
  console.log("Server started on port 3000.");
});
*/