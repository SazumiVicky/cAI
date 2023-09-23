#### Step-by-Step Explanation:

#### 1. Import the required modules:
```javascript
const express = require("express");
const puppeteer = require("puppeteer");
const CharacterAI = require("node_characterai");
const async = require("async");
```

#### 2. Create an Express app:
```javascript
const app = express();
```

#### 3. Use the express.json() middleware to parse JSON requests:
```javascript
app.use(express.json());
```

#### 4. Create an async queue to handle requests:
```javascript
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
}, 
