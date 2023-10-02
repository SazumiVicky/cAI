const express = require("express");
const puppeteer = require("puppeteer");
const CharacterAI = require("node_characterai");
const async = require("async");

const app = express();

app.use(express.json());

let browser;

async function initializeBrowser() {
  if (browser) {
    return browser;
  }

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    browser.on('disconnected', () => {
      console.log('Browser disconnected. Reinitializing...');
      setTimeout(initializeBrowser, 1000);
    });

    return browser;
  } catch (error) {
    console.error('Failed to initialize the browser:', error);
    throw error;
  }
}

const queue = async.queue(async (task, callback) => {
  const { characterId, message, accessToken, res } = task;

  try {
    if (!characterId || !message || !accessToken) {
      throw new Error("Missing required parameters");
    }

    const isolatedCharacterAI = new CharacterAI();
    await isolatedCharacterAI.authenticateWithToken(accessToken);

    const chat = await isolatedCharacterAI.createOrContinueChat(characterId);
    const start = Date.now();

    const browser = await initializeBrowser();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.removeAllListeners('request');
    page.on('request', (request) => {
      request.continue();
    });

    const response = await chat.sendAndAwaitResponse(message, true);

    const end = Date.now();
    const elapsedTime = end - start;

    const jsonResponse = {
      Developer: "Sazumi Viki",
      Loaded: `${elapsedTime} ms`,
      Response: response.text,
    };

    await browser.close();

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(jsonResponse, null, 2));

    if (typeof callback === 'function') {
      callback();
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });

    if (typeof callback === 'function') {
      callback(error);
    }
  }
}, 1);

app.get("/", (req, res) => {
  const characterId = req.query.id;
  const message = req.query.teks;
  const accessToken = req.query.token;

  queue.push({ characterId, message, accessToken, res }, (error) => {
    if (error) {
      console.error("Error in queue callback:", error.message);
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
