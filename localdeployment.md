# Running the Server Locally
**CS 411W — Team Blue | Misinformation Detector**

---

## Step 1 — Get the HF Token from Shawn

Shawn has the team's Hugging Face API token. Get it from him directly.

---

## Step 2 — Create a .env File

Inside the `server/` folder, create a new file called `.env` and add this line:

```
HF_TOKEN=hf_theTokenShawnGaveYou
```

Replace `hf_theTokenShawnGaveYou` with the actual token.

> ⚠️ This file is already in `.gitignore` in the ROOT DIRECTORY, so it will never be pushed to GitHub. Every teammate needs to create it manually on their own machine.

---

## Step 3 — Install Dependencies

Open a terminal in your IDE, navigate to the `server/` folder, and run:

```bash
cd server
npm install
```

---

## Step 4 — Start the Server

```bash
node index.js
```

You should see:
```
Server running at http://localhost:3000
Token loaded: YES ✓
```

Then open `client/index.html` with Live Server in your IDE to use the app.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Token loaded: NO ✗` | Check `server/.env` exists and has no spaces or quotes around the token |
| `401 Unauthorized` | Token is incorrect — get the correct one from Shawn |
| `Cannot find package '...'` | Run `npm install` inside the `server/` folder |
| `503` error from HF | Model is warming up — wait 20 seconds and try again |
| `npm: command not found` | Install Node.js from [nodejs.org](https://nodejs.org) and restart Your IDE |
