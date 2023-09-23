const express = require("express");
const puppeteer = require("puppeteer");
const CharacterAI = require("node_characterai");

const app = express();
const characterAI = new CharacterAI();
let isAuthed = false;
let browser;

app.use(express.json());

async function initializeBrowser() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const pages = await browser.pages();
  const page = pages[0];
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    request.continue();
  });
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
      await characterAI.authenticateWithToken(accessToken);
      isAuthed = true;
    }

    if (!browser) {
      await initializeBrowser();
    }

    const chat = await characterAI.createOrContinueChat(characterId);
    const start = Date.now();

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
