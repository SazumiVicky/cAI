const express = require("express");
const puppeteer = require("puppeteer");
const CharacterAI = require("node_characterai");

const app = express();
const characterAI = new CharacterAI();
let isAuthed = false;
let browser;

app.use(express.json());

async function initializeBrowser() {
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    browser.on('disconnected', () => {
      console.log('Browser disconnected. Reinitializing...');
      initializeBrowser();
    });

    const pages = await browser.pages();
    const page = pages[0];
    await page.setRequestInterception(true);

    page.on('request', (request) => {
      request.continue();
    });
  } catch (error) {
    console.error("Error initializing browser:", error);
    throw error;
  }
}

app.get("/", async (req, res) => {
  const characterId = req.query.id;
  const message = req.query.teks;
  const accessToken = req.query.token;

  try {
    if (!characterId || !message || !accessToken) {
      throw new Error("Missing required parameters");
    }

    if (!isAuthed) {
      try {
        await characterAI.authenticateWithToken(accessToken);
        isAuthed = true;
      } catch (authError) {
        console.error("Authentication error:", authError.message);
        res.status(401).json({ error: "Authentication token is invalid" });
        return;
      }
    }

    if (!browser) {
      await initializeBrowser();
    }

    const chat = await characterAI.createOrContinueChat(characterId);
    const start = Date.now();

    const page = (await browser.pages())[0];

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
