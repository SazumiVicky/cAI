const express = require("express");
const puppeteer = require("puppeteer-core");
const CharacterAI = require("node_characterai");

const app = express();
const characterAI = new CharacterAI();
let isAuthed = false;
const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkVqYmxXUlVCWERJX0dDOTJCa2N1YyJ9.eyJpc3MiOiJodHRwczovL2NoYXJhY3Rlci1haS51cy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTAyNjgwMDIwNDI0NTEyMDQ2NjMiLCJhdWQiOlsiaHR0cHM6Ly9hdXRoMC5jaGFyYWN0ZXIuYWkvIiwiaHR0cHM6Ly9jaGFyYWN0ZXItYWkudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY5NTM3NTU2MywiZXhwIjoxNjk3OTY3NTYzLCJhenAiOiJkeUQzZ0UyODFNcWdJU0c3RnVJWFloTDJXRWtucVp6diIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwifQ.nCLmRwJpH4q0bKwpnjhitQi0uMeo-Cuhm9Hrl8Xj851OA9IY-4d2cHmTx3XDSCrP53shvK-vWA0RfhRwWW_7zCJ-2l7rdq5hTqhlZLco7F1V9dhWGjwfACyae12M9YKZUKJEJxcmcJufJtNf3gLSbTvLzWSppKw2aOt5ekh51yd7ub_zrT-86l6vksX0DwEFN2M8-5WiEkCCD0pJxR8o3d23mNSW6e8AAL6u66KL4Y8IvANteXHtqXI4xlYdt76JbgZyV293itgJ52jmcY6cxGuvGzhQQuLTyCNWIE8km7iHJM08JMrlc1dYqXk0UA4h0r9xPjT3ZLcsVhmEG4CwXw";

app.use(express.json());

app.get("/", async (req, res) => {
  const characterId = req.query.id;
  const message = req.query.teks;

  try {
    if (!isAuthed) {
      await characterAI.authenticateWithToken(accessToken);
      isAuthed = true;
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
    });

    const chat = await characterAI.createOrContinueChat(characterId);
    const start = Date.now();

    const response = await chat.sendAndAwaitResponse(message, true);

    const end = Date.now();
    const elapsedTime = end - start;

    const jsonResponse = {
      Developer: "Sazumi Viki",
      Loader: `${elapsedTime} ms`,
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
