const express = require("express");
const puppeteer = require("puppeteer");
const CharacterAI = require("node_characterai");

const app = express();
const characterAI = new CharacterAI();
let isAuthed = false;

app.use(express.json());

app.get("/", async (req, res) => {
  const characterId = req.query.id;
  const message = req.query.teks;
  const accessToken = req.query.token;

  try {
    if (!isAuthed) {
      await characterAI.authenticateWithToken(accessToken);
      isAuthed = true;
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox'],
    });

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

    await browser.close();

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(jsonResponse, null, 2));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
