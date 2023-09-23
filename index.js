const express = require("express");
const puppeteer = require("puppeteer");
const CharacterAI = require("node_characterai");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const characterAI = new CharacterAI();
const sessions = {};
const databaseFilePath = path.join(__dirname, "database.json");

app.use(express.json());

async function initializeBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  browser.on('disconnected', () => {
    console.log('Browser disconnected. Reinitializing...');
    initializeBrowser();
  });

  return browser;
}

app.get("/", async (req, res) => {
  const characterId = req.query.id;
  const message = req.query.teks;
  const accessToken = req.query.token;

  try {
    if (!characterId || !message || !accessToken) {
      throw new Error("Missing required parameters");
    }

    if (!sessions[accessToken]) {
      sessions[accessToken] = {
        isAuthenticated: false,
        browser: null,
      };
    }

    const session = sessions[accessToken];

    if (!session.isAuthenticated) {
      await characterAI.authenticateWithToken(accessToken);
      session.isAuthenticated = true;
    }

    if (!session.browser) {
      session.browser = await initializeBrowser();
    }

    const chat = await characterAI.createOrContinueChat(characterId);
    const start = Date.now();

    const page = (await session.browser.pages())[0];
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

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(jsonResponse, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
