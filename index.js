const { GoogleGenerativeAI,  HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const prompt = require('prompt-sync')();
const express = require('express');
const app = express();
const fetch = require('node-fetch')
const port = 3000;

const requestCache = new Map();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  }
];

require('dotenv').config();
// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


async function generateReview(id) {
  // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings});
  const songData = await require('./songData.js')(id);
  if (songData.error != null || songData.error != undefined) {
    return {prompt: null, songs: songData};
  }

  const prompt = "Pretend you are a music reviewer who has had a really bad day and hates the music that you are reviewing (however, do not mention that you are having a bad day, but still try to be feisty). Using this data of a playlist of songs, write a short paragraph of your review of the playlist. Be sure to reference the song names, artists and popularity ratings (however do not mention the number specifically, 0-25 is unpopular, 25-50 is kinda popular, 50-75 is fairly popular, and 75-100 is mainstream. Also do not mention that they are mainstream or fairly popular) in your review. Be sure to give a rating at the end on a new line on its own, saying \"RATING: X/10\". Have an extremely rare chance to be nice and actually like the playlist. Be sure to not always give the rating a 0 or a 1, try to diversify your ratings. When you are going to use the word \"sonic\", try to use a synonym of sonic instead, however do not overload your usage of these synonyms. Be sure to include anything that you feel like fits into the review, and be sure to diversify your insults. You are talking to the creator of this playlist, so be sure to refer to them. Try not to go so hard that you would be flagged as sexually explicit, hate speech, harassment, or mention dangerous content, but don't hold back on your insults unless they can get flagged. Do not bold or italicize or underline anything. Ignore the URL in the data, that is not relevant to your review.\n" + JSON.stringify(songData);

  const result = await model.generateContent(prompt)
  const response = await result.response;
  const text = response.text();
  return {prompt: text, songs: songData}
}

app.post('/api/:spotifyID', async (req, res) => {
  let spotifyID = req.params.spotifyID;
  let vanity = null;
  console.log(`Making a POST request to /${spotifyID}`);

    let found = false;
    requestCache.forEach((x, id) => { 
      if (id == spotifyID) {
         spotifyID = id
         found = true;
      }
    })


  if (requestCache.has(spotifyID)) {
    console.log("Returning cached data")
     return res.json(requestCache.get(spotifyID));
  }


  const dataSent = await generateReview(spotifyID);

  res.json(dataSent)
  
    console.log("Cached Data")
    requestCache.set(spotifyID, dataSent)
    setTimeout(() => {
        if (requestCache.has(spotifyID)) requestCache.delete(spotifyID)
    }, 600000)
});


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
