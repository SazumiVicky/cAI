const express = require("express");
const CharacterAI = require("node_characterai");

const app = express();
const characterAI = new CharacterAI();
let isAuthed = false;

app.use(express.json());

app.get("/", async (req, res) => {
  const characterId = req.query.id;
  const message = req.query.teks;

  try {
    if (!isAuthed) {
      await characterAI.authenticateAsGuest();
      isAuthed = true;
    }

    const chat = await characterAI.createOrContinueChat(characterId);
    const start = Date.now();

    const response = await chat.sendAndAwaitResponse(message, true);

    const end = Date.now();
    const elapsedTime = end - start;

    const jsonResponse = {
      Developer: "Sazumi Viki",
      Loader: `${elapsedTime} ms`,
      Response: response.text
    };

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(jsonResponse, null, 2));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});