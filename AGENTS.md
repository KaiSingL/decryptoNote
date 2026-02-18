# AGENTS.md - Decrypto Notes

This is a simple vanilla HTML/CSS/JS project for tracking Decrypto game rounds. No build tools required.

---

## 1. Running the Project

### Development
Open `index.html` directly in a browser, or use a local server:
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (if available)
npx serve .
```

Then visit `http://localhost:8000`

### GitHub Pages Deployment
1. Push code to a GitHub repository
2. Go to Settings → Pages
3. Select `main` branch and click Save
4. App will be live at `https://username.github.io/repo-name/`

### Linting
No formal linter configured. For basic JS validation:
```bash
# Check JS syntax with Node
node --check app.js
```

### Testing
No tests exist. Manual testing via browser.

---

## 2. Code Style Guidelines

### File Structure
- `index.html` - Landing page (game list)
- `game.html` - Game interface with tabs
- `styles.css` - All CSS (mobile-first)
- `app.js` - All JavaScript logic

### HTML Guidelines
- Use semantic HTML5 elements
- Include `viewport` meta tag for mobile
- Use `aria-label` for icon-only buttons
- Use `inputmode` attribute for numeric inputs

### CSS Guidelines
- Use CSS custom properties (variables) for colors
- Follow mobile-first approach with `@media (min-width: 768px)`
- Minimum touch target size: 44x44px
- Use Atkinson Hyperlegible font (from Google Fonts)
- Color palette:
  - Primary: `#0891B2` (cyan)
  - CTA: `#059669` (green)
  - Background: `#ECFEFF`
  - Text: `#164E63`
- Use BEM-like class naming: `.game-card`, `.game-card__info`

### JavaScript Guidelines

#### Naming Conventions
- Functions: `camelCase` (e.g., `renderGamesList`, `setupTabs`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `STORAGE_KEY`)
- DOM elements: descriptive (e.g., `gamesList`, `createModal`)

#### Functions
- Use function declarations (not arrow functions for top-level)
- Group related functions with section comments:
```javascript
// ================= LOCAL STORAGE =================

// ================= LANDING PAGE =================
```

#### Error Handling
- Use `try-catch` for JSON parsing:
```javascript
function getGames() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to parse games:', e);
    return {};
  }
}
```

#### Security
- Always escape HTML when inserting user data:
```javascript
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

#### DOM Manipulation
- Use `classList.add/remove` for toggling classes
- Use event delegation for dynamic elements
- Cache DOM queries when used multiple times

#### Data Persistence
- All data stored in `localStorage` under key `decrypto_notes`
- Data structure:
```javascript
{
  "game_id": {
    id: "game_id",
    name: "Game Jan 1, 12:00 PM",
    createdAt: "ISO timestamp",
    updatedAt: "ISO timestamp",
    currentRound: 1,
    ownTeam: {
      rounds: [{ round: 1, hints: [...], positions: [...], answer: "123" }],
      current: { hints: ["", "", ""], positions: [1, 2, 3] }
    },
    opponentTeam: {
      guessedTerms: ["", "", "", ""],
      rounds: [...],
      current: { hints: ["", "", ""], positions: [1, 2, 3] }
    }
  }
}
```

#### Drag and Drop
- Use native HTML5 drag/drop API
- Set `draggable="true"` on draggable elements
- Use `dataTransfer.effectAllowed = 'swap'` for reorder operations

---

## 3. Making Changes

### Adding Features
1. Keep HTML in `index.html` or `game.html`
2. Add CSS to `styles.css`
3. Add JS to `app.js`
4. Test on mobile (375px) and desktop (768px+)

### Common Tasks

**Add new tab to game page:**
1. Add `<button class="tab-btn" data-tab="newTab">` in game.html
2. Add `<section id="newTabTab" class="tab-content">`
3. Add event listener in `setupTabs()` function

**Add new form modal:**
1. Add modal HTML in appropriate file
2. Add `setupXxxModal()` function in app.js
3. Call from `initLandingPage()` or `initGamePage()`

**Modify data structure:**
1. Update `createGame()` to include new fields
2. Update render functions to display new data
3. Handle migration in getter functions if needed

---

## 4. Accessibility Requirements

- Color contrast minimum 4.5:1
- Focus states on all interactive elements
- Labels for all form inputs
- `aria-label` for icon-only buttons
- Keyboard navigable (tab order)
- Support `prefers-reduced-motion`

---

## 6. Hint Positioning Workflow

### Overview
Hint 1 - 3 means the first, second, third digit.
In the current row, hints 1-3 can be positioned in columns 1-4. Users can:
- Move hints around by dragging (hint swaps position with target column)
- Click/tap to open edit modal to enter hint text
- Position a hint in column 4 (extra hint position)

### Data Structure
```javascript
// positions array: which column (1-4) each hint is placed in
// positions[0] = column where hint 1 is (1-4)
// positions[1] = column where hint 2 is (1-4)
// positions[2] = column where hint 3 is (1-4)
// positions[3] = placeholder for hint 4 (not used)

// Example: hint 1 in col 2, hint 2 in col 4, hint 3 in col 3
// positions = [2, 4, 3]  // hint1 at col2, hint2 at col4, hint3 at col3
// Answer = "243" (digit 1 = col of hint1, digit 2 = col of hint2, digit 3 = col of hint3)
```

### Answer Calculation
- Answer is 3 digits representing the column number of each hint
- digit 1 = column where hint 1 is placed
- digit 2 = column where hint 2 is placed
- digit 3 = column where hint 3 is placed
- Example: hint1 at col2, hint2 at col4, hint3 at col3 → Answer: "243"

### Key Functions

**`renderTeamTable(teamType, teamData)`**
- Renders 4 columns (1, 2, 3, 4) for current row
- Iterates through hints and places each at its designated column
- Column 4 displays hint when a hint has position 4

**`renderHintCell(hintIndex, hintValue, positionNum, teamType)`**
- hintIndex: 0, 1, or 2 (index in hints array)
- hintValue: the hint word
- positionNum: which column this hint occupies (1-4)
- Renders a draggable hint cell

**`setupDragAndDrop(teamType)`**
- Handles pointer events for dragging hints between columns
- On drop: swap positions between source and target columns
- Supports dropping into column 4

**`calculateAnswer(positions)`**
- Returns 3-digit string from positions[0], positions[1], positions[2]
- Each digit is the hint number at that column

### Common Bugs to Avoid
1. **Column 4 not rendering hint**: Ensure `renderTeamTable` renders hint cell in column 4 when a hint has position 4
2. **Answer ignores column 4**: The answer is always 3 digits (columns 1-3), but column 4 hint can affect the answer via swap
3. **Hint modal only opens for columns 1-3**: Validate positionIndex 0-3, not 0-2
4. **Drag swap logic**: When dragging hint from col2 to col4, swap the position numbers (not indices)

---

## 7. Git Conventions

- Commit messages: clear, concise
- No need for conventional commits (simple project)
- Push to GitHub Pages branch for deployment
