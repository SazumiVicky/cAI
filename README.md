#### About the CharacterAI Web API
The CharacterAI Web API is a server application built using Node.js, Express.js, Puppeteer, and the <b>node_characterai</b> module. This application serves as a bridge between users and an external service, in this case, the CharacterAI service that enables the creation of intelligent chatbots.

#### Key Features:

- <b>Token Authentication:</b> The web API allows users to authenticate themselves with the CharacterAI service using a valid token. This token is used to access the CharacterAI service.
- <b>Usage of Puppeteer:</b> The application uses the Puppeteer module to manage the Chromium browser used for interacting with the CharacterAI service.
- <b>Request Queue:</b> To avoid conflicts when multiple users access the API simultaneously, the application uses the ```async.queue``` module to manage request queues.
- <b>Handling Concurrent Requests:</b> The application has been updated to efficiently handle multiple requests from different users simultaneously, avoiding issues with invalid token authentication.
- <b>JSON Response:</b> The web API provides responses in JSON format containing information about execution time, response text, and the relevant developer.

#### Usage:

<p>Users can access this API by sending a GET request with the inclusion of parameters <code>id</code> (character ID), <code>teks</code> (text to be processed), and <code>token</code> (authentication token) through the URL. The API will respond with a JSON format containing the text processing results.</p>

#### Notes:

<p>Ensure that the authentication token used is valid and complies with any usage restrictions imposed by the CharacterAI service. Additionally, this application has been updated to address issues with invalid token authentication in concurrent request scenarios.

The CharacterAI Web API can be used to integrate the CharacterAI service with other applications or services you create, enabling the development of intelligent and responsive chatbots.</p>

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
```

#### Thanks To

- [realcoloride/node_characterai](https://github.com/realcoloride/node_characterai)
