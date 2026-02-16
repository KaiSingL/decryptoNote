// ================= LOCAL STORAGE =================

const STORAGE_KEY = 'decrypto_notes';

function getGames() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function generateId() {
  return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ================= LANDING PAGE =================

function initLandingPage() {
  renderGamesList();
  setupEditModal();
  setupBatchActions();
}

function createGame() {
  const games = getGames();
  const id = generateId();
  const now = new Date();
  const gameName = `Game ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  
  games[id] = {
    id,
    name: gameName,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    currentRound: 1,
    ownTeam: {
      rounds: [],
      current: { hints: ['', '', ''], positions: [1, 2, 3] }
    },
    opponentTeam: {
      guessedTerms: ['', '', '', ''],
      rounds: [],
      current: { hints: ['', '', ''], positions: [1, 2, 3] }
    }
  };

  saveGames(games);
  window.location.href = `game.html?id=${id}`;
}

function renderGamesList() {
  const games = getGames();
  const gamesList = document.getElementById('gamesList');
  const emptyState = document.getElementById('emptyState');
  const batchActions = document.getElementById('batchActions');

  const gamesArray = Object.values(games).sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  if (gamesArray.length === 0) {
    gamesList.innerHTML = '';
    emptyState.classList.remove('hidden');
    batchActions.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  
  gamesList.innerHTML = gamesArray.map(game => {
    const createdDate = new Date(game.createdAt).toLocaleDateString();
    const round = game.currentRound || 1;
    
    return `
      <div class="game-card" data-id="${game.id}">
        <input type="checkbox" class="game-card-checkbox" data-id="${game.id}">
        <div class="game-card-info" onclick="openGame('${game.id}')">
          <div class="game-card-name">${escapeHtml(game.name)}</div>
          <div class="game-card-meta">
            <span>${createdDate}</span>
            <span>Round ${round}</span>
          </div>
        </div>
        <div class="game-card-actions">
          <button class="btn-icon-sm" onclick="event.stopPropagation(); editGame('${game.id}')" aria-label="Edit game">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon-sm danger" onclick="event.stopPropagation(); deleteGame('${game.id}')" aria-label="Delete game">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Show batch actions if any checked
  updateBatchActions();
}

function setupEditModal() {
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editGameForm');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const backdrop = modal.querySelector('.modal-backdrop');
  const closeBtn = modal.querySelector('.modal-close');

  const closeModal = () => {
    modal.classList.add('hidden');
    form.reset();
  };

  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editGameId').value;
    const name = document.getElementById('editGameName').value.trim();
    
    const games = getGames();
    if (games[id]) {
      games[id].name = name || 'Game';
      games[id].updatedAt = new Date().toISOString();
      saveGames(games);
    }
    
    closeModal();
    renderGamesList();
    
    // Update current page if on game page
    if (window.location.pathname.includes('game.html')) {
      document.getElementById('gameNameDisplay').textContent = name || 'Game';
    }
  });
}

function setupBatchActions() {
  const gamesList = document.getElementById('gamesList');
  const selectedCount = document.getElementById('selectedCount');
  const deleteBtn = document.getElementById('deleteSelectedBtn');

  gamesList.addEventListener('change', (e) => {
    if (e.target.classList.contains('game-card-checkbox')) {
      updateBatchActions();
    }
  });

  deleteBtn.addEventListener('click', () => {
    const checked = document.querySelectorAll('.game-card-checkbox:checked');
    const ids = Array.from(checked).map(cb => cb.dataset.id);
    
    if (ids.length === 0) return;
    
    if (confirm(`Delete ${ids.length} game(s)?`)) {
      const games = getGames();
      ids.forEach(id => delete games[id]);
      saveGames(games);
      renderGamesList();
    }
  });
}

function updateBatchActions() {
  const checked = document.querySelectorAll('.game-card-checkbox:checked');
  const batchActions = document.getElementById('batchActions');
  const selectedCount = document.getElementById('selectedCount');
  
  if (checked.length > 0) {
    batchActions.classList.remove('hidden');
    selectedCount.textContent = `${checked.length} selected`;
  } else {
    batchActions.classList.add('hidden');
  }
}

function openGame(id) {
  window.location.href = `game.html?id=${id}`;
}

function editGame(id) {
  const games = getGames();
  const game = games[id];
  if (!game) return;

  document.getElementById('editGameId').value = id;
  document.getElementById('editGameName').value = game.name;
  document.getElementById('editModal').classList.remove('hidden');
}

function deleteGame(id) {
  if (!confirm('Delete this game?')) return;
  
  const games = getGames();
  delete games[id];
  saveGames(games);
  renderGamesList();
}

// ================= GAME PAGE =================

let currentGameId = null;
let currentTab = 'ownTeam';

function initGamePage() {
  const params = new URLSearchParams(window.location.search);
  currentGameId = params.get('id');
  
  if (!currentGameId) {
    window.location.href = 'index.html';
    return;
  }

  const games = getGames();
  const game = games[currentGameId];
  
  if (!game) {
    window.location.href = 'index.html';
    return;
  }

  // Setup UI
  document.getElementById('gameNameDisplay').textContent = game.name;
  document.getElementById('roundCounter').textContent = `Round ${game.currentRound || 1}`;
  
  // Setup back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Setup delete game
  document.getElementById('deleteGameBtn').addEventListener('click', () => {
    if (confirm('Delete this game?')) {
      const games = getGames();
      delete games[currentGameId];
      saveGames(games);
      window.location.href = 'index.html';
    }
  });

  // Setup editable name
  document.getElementById('gameNameDisplay').addEventListener('click', () => {
    const newName = prompt('Enter game name:', game.name);
    if (newName && newName.trim()) {
      game.name = newName.trim();
      game.updatedAt = new Date().toISOString();
      saveGames(games);
      document.getElementById('gameNameDisplay').textContent = game.name;
    }
  });

  // Setup tabs
  setupTabs();

  // Setup opponent term guess inputs
  setupOpponentTermInputs();

  // Setup finalize buttons
  document.getElementById('ownTeamFinalizeBtn').addEventListener('click', () => finalizeRound('ownTeam'));
  document.getElementById('opponentTeamFinalizeBtn').addEventListener('click', () => finalizeRound('opponentTeam'));

  // Setup edit round modal
  setupEditRoundModal();

  // Render tables
  renderTables();
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      currentTab = tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      document.getElementById(`${tab}Tab`).classList.add('active');
    });
  });
}

function setupOpponentTermInputs() {
  const games = getGames();
  const game = games[currentGameId];
  if (!game) return;

  const guessedTerms = game.opponentTeam.guessedTerms || ['', '', '', ''];
  
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`opponentTerm${i + 1}`);
    if (input) {
      input.value = guessedTerms[i] || '';
      
      input.addEventListener('input', () => {
        game.opponentTeam.guessedTerms[i] = input.value;
        game.updatedAt = new Date().toISOString();
        saveGames(games);
      });
    }
  }
}

function renderTables() {
  const games = getGames();
  const game = games[currentGameId];
  if (!game) return;

  renderTeamTable('ownTeam', game.ownTeam);
  renderTeamTable('opponentTeam', game.opponentTeam);
}

function renderTeamTable(teamType, teamData) {
  const tbody = document.getElementById(`${teamType}Body`);
  const answerDisplay = document.getElementById(`${teamType}Answer`);
  
  if (!tbody) return;

  const rounds = teamData.rounds || [];
  const current = teamData.current || { hints: ['', '', ''], positions: [1, 2, 3] };
  
  let html = '';
  
  // Render completed rounds
  rounds.forEach((round, index) => {
    const answer = round.answer || '-';
    const hints = round.hints || ['', '', ''];
    const positions = round.positions || [1, 2, 3];
    
    // Create hint array based on positions: position[i] = which hint is at column i+1
    const hintAtColumn = ['', '', '', ''];
    positions.forEach((hintIdx, colIdx) => {
      if (colIdx < 4 && hintIdx >= 1 && hintIdx <= 3) {
        hintAtColumn[colIdx] = hints[hintIdx - 1] || '';
      }
    });
    
    html += `
      <tr onclick="openEditRound('${teamType}', ${index})">
        <td>${round.round}</td>
        <td>${escapeHtml(hintAtColumn[0] || '')}</td>
        <td>${escapeHtml(hintAtColumn[1] || '')}</td>
        <td>${escapeHtml(hintAtColumn[2] || '')}</td>
        <td>${escapeHtml(hintAtColumn[3] || '')}</td>
        <td><strong>${escapeHtml(answer)}</strong></td>
      </tr>
    `;
  });

  // Render current round with draggable hints
  // Each hint (1, 2, 3) is in its own cell, and can be dragged to swap columns
  const currentHints = current.hints || ['', '', ''];
  const currentPositions = current.positions || [1, 2, 3]; // positions[i] = column where hint i+1 is (1-3)

  html += `
    <tr class="current-row" data-team="${teamType}">
      <td>Current</td>
      <td class="hint-col" data-col="0">
        ${renderDraggableHintCell(0, currentHints[0], teamType)}
      </td>
      <td class="hint-col" data-col="1">
        ${renderDraggableHintCell(1, currentHints[1], teamType)}
      </td>
      <td class="hint-col" data-col="2">
        ${renderDraggableHintCell(2, currentHints[2], teamType)}
      </td>
      <td class="hint-col" data-col="3">
        <span class="current-row-hint">4</span>
      </td>
      <td><strong>${calculateAnswer(currentPositions)}</strong></td>
    </tr>
  `;

  tbody.innerHTML = html;
  
  // Update answer display
  answerDisplay.textContent = calculateAnswer(currentPositions);

  // Setup drag and drop
  setupDragAndDrop(teamType);
  setupHintInputs(teamType);
}

function renderDraggableHintCell(hintIndex, hintValue, teamType) {
  const hintNum = hintIndex + 1;
  return `
    <div class="hint-cell" draggable="true" data-hint-index="${hintIndex}">
      <span class="drag-handle">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      </span>
      <span class="current-row-hint">${hintNum}</span>
      <input type="text" class="hint-input" value="${escapeHtml(hintValue || '')}" data-hint-index="${hintIndex}">
    </div>
  `;
}

function setupHintInputs(teamType) {
  const tbody = document.getElementById(`${teamType}Body`);
  const rows = tbody.querySelectorAll('.current-row');
  const row = rows[0];
  if (!row) return;

  const games = getGames();
  const game = games[currentGameId];
  if (!game) return;

  const team = game[teamType];
  const hints = team.current.hints || ['', '', ''];

  // Setup all hint inputs
  row.querySelectorAll('.hint-input').forEach(input => {
    const hintIndex = parseInt(input.dataset.hintIndex);
    
    if (!isNaN(hintIndex)) {
      input.addEventListener('input', () => {
        team.current.hints[hintIndex] = input.value;
        game.updatedAt = new Date().toISOString();
        saveGames(games);
      });

      // Restore value
      input.value = hints[hintIndex] || '';
    }
  });
}

function setupDragAndDrop(teamType) {
  const tbody = document.getElementById(`${teamType}Body`);
  const rows = tbody.querySelectorAll('.current-row');
  const row = rows[0];
  if (!row) return;

  const hintCells = row.querySelectorAll('.hint-cell');
  const tdCells = row.querySelectorAll('.hint-col');
  let draggedCell = null;
  let draggedTdIndex = -1;

  hintCells.forEach((cell, index) => {
    if (!cell.classList.contains('hint-cell')) return;
    if (!cell.hasAttribute('draggable')) return;

    cell.addEventListener('dragstart', (e) => {
      draggedCell = cell;
      draggedTdIndex = index;
      cell.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'swap';
    });

    cell.addEventListener('dragend', () => {
      cell.classList.remove('dragging');
      hintCells.forEach(c => c.classList.remove('drag-over'));
      draggedCell = null;
      draggedTdIndex = -1;
    });

    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedCell !== cell) {
        cell.classList.add('drag-over');
      }
    });

    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drag-over');
    });

    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      
      if (!draggedCell || draggedCell === cell) return;

      const targetTdIndex = index;

      // Only allow swapping within columns 0-2 (not column 3)
      if (targetTdIndex > 2 || draggedTdIndex > 2) return;

      // Swap positions in data
      const games = getGames();
      const game = games[currentGameId];
      if (!game) return;

      const team = game[teamType];
      const positions = [...(team.current.positions || [1, 2, 3])];

      // Swap: the hint at draggedTdIndex swaps column with hint at targetTdIndex
      const temp = positions[draggedTdIndex];
      positions[draggedTdIndex] = positions[targetTdIndex];
      positions[targetTdIndex] = temp;

      team.current.positions = positions;
      game.updatedAt = new Date().toISOString();
      saveGames(games);
      renderTables();
    });
  });
}

function calculateAnswer(positions) {
  if (!positions || positions.length < 3) return '-';
  
  // Create array where index = position-1, value = hint index + 1
  const answer = ['', '', ''];
  positions.forEach((pos, hintIndex) => {
    if (pos >= 1 && pos <= 3 && hintIndex < 3) {
      answer[pos - 1] = (hintIndex + 1).toString();
    }
  });
  
  const result = answer.join('');
  return result || '-';
}

function finalizeRound(teamType) {
  const games = getGames();
  const game = games[currentGameId];
  if (!game) return;

  const team = game[teamType];
  const current = team.current;
  const hints = current.hints || ['', '', ''];
  const positions = current.positions || [1, 2, 3];

  // Check if all hints are filled
  const hasAllHints = hints.every(h => h.trim());
  if (!hasAllHints) {
    alert('Please fill in all 3 hints before finalizing.');
    return;
  }

  // Calculate answer
  const answer = calculateAnswer(positions);

  // Add to rounds
  const roundData = {
    round: game.currentRound || 1,
    hints: [...hints],
    positions: [...positions],
    answer: answer
  };

  // Add guessed terms for opponent team
  if (teamType === 'opponentTeam') {
    roundData.guessedTerms = [...(team.guessedTerms || ['', '', '', ''])];
  }

  team.rounds.push(roundData);

  // Reset current round
  team.current = { hints: ['', '', ''], positions: [1, 2, 3] };

  // Increment round
  game.currentRound = (game.currentRound || 1) + 1;
  game.updatedAt = new Date().toISOString();

  saveGames(games);

  // Update UI
  document.getElementById('roundCounter').textContent = `Round ${game.currentRound}`;
  renderTables();
}

// ================= EDIT ROUND MODAL =================

function setupEditRoundModal() {
  const modal = document.getElementById('editRoundModal');
  const form = document.getElementById('editRoundForm');
  const cancelBtn = document.getElementById('cancelEditRoundBtn');
  const deleteBtn = document.getElementById('deleteRoundBtn');
  const backdrop = modal.querySelector('.modal-backdrop');
  const closeBtn = modal.querySelector('.modal-close');

  const closeModal = () => {
    modal.classList.add('hidden');
    form.reset();
  };

  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  deleteBtn.addEventListener('click', () => {
    const teamType = document.getElementById('editTeamType').value;
    const roundIndex = parseInt(document.getElementById('editRoundIndex').value);

    if (confirm('Delete this round?')) {
      const games = getGames();
      const game = games[currentGameId];
      if (game) {
        game[teamType].rounds.splice(roundIndex, 1);
        game.updatedAt = new Date().toISOString();
        saveGames(games);
        renderTables();
      }
      closeModal();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const teamType = document.getElementById('editTeamType').value;
    const roundIndex = parseInt(document.getElementById('editRoundIndex').value);
    const hint1 = document.getElementById('editHint1').value.trim();
    const hint2 = document.getElementById('editHint2').value.trim();
    const hint3 = document.getElementById('editHint3').value.trim();
    const answer = document.getElementById('editAnswer').value.trim();

    const games = getGames();
    const game = games[currentGameId];
    
    if (game && game[teamType].rounds[roundIndex]) {
      const round = game[teamType].rounds[roundIndex];
      round.hints = [hint1, hint2, hint3];
      round.answer = answer;

      // Recalculate positions from answer
      const positions = [];
      for (let i = 0; i < 3; i++) {
        const digit = answer[i];
        if (digit >= '1' && digit <= '3') {
          positions.push(parseInt(digit));
        } else {
          positions.push(i + 1);
        }
      }
      round.positions = positions;

      game.updatedAt = new Date().toISOString();
      saveGames(games);
      renderTables();
    }

    closeModal();
  });
}

function openEditRound(teamType, roundIndex) {
  const games = getGames();
  const game = games[currentGameId];
  if (!game) return;

  const round = game[teamType].rounds[roundIndex];
  if (!round) return;

  document.getElementById('editTeamType').value = teamType;
  document.getElementById('editRoundIndex').value = roundIndex;
  document.getElementById('editHint1').value = round.hints[0] || '';
  document.getElementById('editHint2').value = round.hints[1] || '';
  document.getElementById('editHint3').value = round.hints[2] || '';
  document.getElementById('editAnswer').value = round.answer || '';

  document.getElementById('editRoundModal').classList.remove('hidden');
}

// ================= UTILITIES =================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
