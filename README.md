# Decrypto Notes

A simple web app for tracking [Decrypto](https://boardgamegeek.com/boardgame/225694/decrypto) game rounds. Built with vanilla HTML, CSS, and JavaScript.

## Features

- Track hints and answers for both teams
- Drag and drop hints to reorder positions
- Store term guesses for the opponent team
- Auto-calculates answers from hint positions
- Data persists in localStorage
- Works offline (PWA)
- Mobile-friendly responsive design

## Getting Started

### Local Development

Open `index.html` directly in a browser, or use a local server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .
```

Then visit `http://localhost:8000`

### Deploy to GitHub Pages

1. Push code to a GitHub repository
2. Go to Settings → Pages
3. Select `main` branch and click Save
4. App will be live at `https://yourusername.github.io/decryptoNote/`

## Project Structure

```
├── index.html      # Landing page (game list)
├── game.html       # Game interface
├── styles.css      # All styles
├── app.js          # All JavaScript
├── icons/          # PWA icons
└── site.webmanifest
```

## How It Works

### Hint Positioning

- Hints 1-3 correspond to the first, second, and third digits of the answer
- Drag hints to swap their column positions
- Column 4 is available as an extra slot
- The answer is automatically calculated from hint positions

### Data Storage

All data is stored in `localStorage` under the key `decrypto_notes`. No server required.

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no build tools)
- [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible) font
- CSS custom properties for theming
- PWA-ready with manifest and icons