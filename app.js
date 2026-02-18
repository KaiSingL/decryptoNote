// ================= LOCAL STORAGE =================

const STORAGE_KEY = 'decrypto_notes';

function getGames() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to parse games:', e);
    return {};
  }
}

function saveGames(games) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (e) {
    console.error('Failed to save games:', e);
    alert('Failed to save. Storage may be full.');
  }
}

function generateId() {
  return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ================= LANDING PAGE =================

function initLandingPage() {
  renderGamesList();
  setupBatchActions();
}

function createGame() {
  const games = getGames();
  const id = generateId();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const gameName = `Game ${dateStr} ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  
  games[id] = {
    id,
    name: gameName,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ownTeam: {
      rounds: [],
      currentRound: 1,
      current: { hints: ['', '', '', ''], positions: [1, 2, 3, 4] }
    },
    opponentTeam: {
      guessedTerms: ['', '', '', ''],
      rounds: [],
      currentRound: 1,
      current: { hints: ['', '', '', ''], positions: [1, 2, 3, 4] }
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
    const date = new Date(game.createdAt);
    const createdDate = date.toISOString().split('T')[0];
    
    return `
      <div class="game-card" data-id="${game.id}">
        <input type="checkbox" class="game-card-checkbox" data-id="${game.id}">
        <div class="game-card-info" onclick="openGame('${game.id}')">
          <div class="game-card-name">${escapeHtml(game.name)}</div>
          <div class="game-card-meta">
            <span>${createdDate}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Show batch actions if any checked
  updateBatchActions();
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
    
    const games = getGames();
    ids.forEach(id => delete games[id]);
    saveGames(games);
    renderGamesList();
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
  
  // Setup back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
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

  // Setup collapsible term guess section
  const termGuessHeader = document.querySelector('.term-guess-header');
  if (termGuessHeader) {
    termGuessHeader.addEventListener('click', () => {
      termGuessHeader.parentElement.classList.toggle('collapsed');
    });
  }

  // Setup finalize buttons
  document.getElementById('ownTeamFinalizeBtn').addEventListener('click', () => finalizeRound('ownTeam'));
  document.getElementById('opponentTeamFinalizeBtn').addEventListener('click', () => finalizeRound('opponentTeam'));

  // Setup hint input modal
  setupHintModal();

  // Render tables
  renderTables();
  
  // Setup tap handlers
  setupRoundRowTaps();
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

function setupRoundRowTaps() {
  const ownTeamBody = document.getElementById('ownTeamBody');
  const opponentTeamBody = document.getElementById('opponentTeamBody');
  
  setupTapsForTable(ownTeamBody);
  setupTapsForTable(opponentTeamBody);
}

function setupTapsForTable(tbody) {
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('.completed-row');
  let lastTapTime = 0;
  let lastTapRow = null;
  
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      const now = Date.now();
      const teamType = row.dataset.team;
      const index = parseInt(row.dataset.index);
      
      // Check if this is a tap on the same row
      if (lastTapRow === row && (now - lastTapTime) < 300) {
        openEditRound(teamType, index);
        lastTapRow = null;
        lastTapTime = 0;
      } else {
        lastTapRow = row;
        lastTapTime = now;
      }
    });
  });
}

function renderTeamTable(teamType, teamData) {
  const tbody = document.getElementById(`${teamType}Body`);
  const answerDisplay = document.getElementById(`${teamType}Answer`);
  
  if (!tbody) return;

  const rounds = teamData.rounds || [];
  const current = teamData.current || { hints: ['', '', '', ''], positions: [1, 2, 3, 4] };
  
  let html = '';
  
  // Render completed rounds with draggable hints
  rounds.forEach((round, index) => {
    const hints = round.hints || ['', '', ''];
    const positions = round.positions || [1, 2, 3, 4];
    const answer = calculateAnswer(positions);
    
    const previousAnswers = rounds.slice(0, index).map(r => r.answer);
    const isDuplicate = previousAnswers.includes(answer);
    
    const hintAtColumn = [null, null, null, null];
    for (let hintIdx = 0; hintIdx < 3; hintIdx++) {
      const col = positions[hintIdx];
      if (col >= 1 && col <= 4) {
        hintAtColumn[col - 1] = { hintIndex: hintIdx, hintValue: hints[hintIdx] };
      }
    }
    
    html += `
      <tr class="completed-row editable-row" data-team="${teamType}" data-round-index="${index}">
        <td>${round.round}</td>
        <td class="hint-col" data-col-index="0" data-hint-index="${hintAtColumn[0]?.hintIndex ?? -1}">
          ${renderHintCellFromColumn(0, hintAtColumn[0], teamType, index)}
        </td>
        <td class="hint-col" data-col-index="1" data-hint-index="${hintAtColumn[1]?.hintIndex ?? -1}">
          ${renderHintCellFromColumn(1, hintAtColumn[1], teamType, index)}
        </td>
        <td class="hint-col" data-col-index="2" data-hint-index="${hintAtColumn[2]?.hintIndex ?? -1}">
          ${renderHintCellFromColumn(2, hintAtColumn[2], teamType, index)}
        </td>
        <td class="hint-col drop-cell" data-col-index="3" data-hint-index="${hintAtColumn[3]?.hintIndex ?? -1}">
          ${renderHintCellFromColumn(3, hintAtColumn[3], teamType, index)}
        </td>
        <td class="answer-cell ${isDuplicate ? 'answer-duplicate' : ''}"><strong>${escapeHtml(answer)}</strong></td>
      </tr>
    `;
  });

  // Render current round with draggable hints
  // Each hint (1, 2, 3) is in its own cell, can be dragged to swap columns
  // Click on cell (not drag handle) opens modal to enter hint
  const currentHints = current.hints || ['', '', '', ''];
  const currentPositions = current.positions || [1, 2, 3, 4];
  const currentRoundNum = teamData.currentRound || rounds.length + 1;

  const currentAnswer = calculateAnswer(currentPositions);
  const allCompletedAnswers = rounds.map(r => r.answer);
  const isCurrentDuplicate = allCompletedAnswers.includes(currentAnswer);

  // Render 4 columns with hints positioned accordingly
  // Find which hint is at each column (1-4)
  const hintAtColumn = [null, null, null, null]; // [col1 hint, col2 hint, col3 hint, col4 hint]
  for (let hintIdx = 0; hintIdx < 3; hintIdx++) {
    const pos = currentPositions[hintIdx];
    if (pos >= 1 && pos <= 4) {
      hintAtColumn[pos - 1] = { hintIndex: hintIdx, hintValue: currentHints[hintIdx] };
    }
  }

  html += `
    <tr class="current-row" data-team="${teamType}">
      <td>${currentRoundNum}</td>
      <td class="hint-col" data-col-index="0" data-hint-index="${hintAtColumn[0]?.hintIndex ?? -1}">
        ${renderHintCellFromColumn(0, hintAtColumn[0], teamType)}
      </td>
      <td class="hint-col" data-col-index="1" data-hint-index="${hintAtColumn[1]?.hintIndex ?? -1}">
        ${renderHintCellFromColumn(1, hintAtColumn[1], teamType)}
      </td>
      <td class="hint-col" data-col-index="2" data-hint-index="${hintAtColumn[2]?.hintIndex ?? -1}">
        ${renderHintCellFromColumn(2, hintAtColumn[2], teamType)}
      </td>
      <td class="hint-col drop-cell" data-col-index="3" data-hint-index="${hintAtColumn[3]?.hintIndex ?? -1}">
        ${renderHintCellFromColumn(3, hintAtColumn[3], teamType)}
      </td>
      <td class="answer-cell ${isCurrentDuplicate ? 'answer-duplicate' : ''}"><strong>${currentAnswer}</strong></td>
    </tr>
  `;

  tbody.innerHTML = html;
  
  // Update answer display
  answerDisplay.textContent = calculateAnswer(currentPositions);

  // Setup drag and drop and click handlers
  setupDragAndDrop(teamType);
}

function renderHintCell(hintIndex, hintValue, positionNum, teamType) {
  const hasHint = hintValue && hintValue.trim().length > 0;
  return `
    <div class="hint-cell" data-hint-index="${hintIndex}" data-col-index="${hintIndex}" data-position="${positionNum}" data-team="${teamType}">
      <span class="hint-number">${positionNum || ''}</span>
      <span class="hint-text ${hasHint ? '' : 'empty'}">
        ${hasHint ? escapeHtml(hintValue) : 'Tap to Edit'}
      </span>
    </div>
  `;
}

function renderHintCellFromColumn(colIndex, hintData, teamType, roundIndex = null) {
  const roundAttr = roundIndex !== null ? ` data-round-index="${roundIndex}"` : '';
  
  if (!hintData) {
    return `<div class="hint-cell empty-cell" data-col-index="${colIndex}" data-team="${teamType}"${roundAttr}></div>`;
  }
  
  const { hintIndex, hintValue } = hintData;
  const hasHint = hintValue && hintValue.trim().length > 0;
  const hintNum = hintIndex + 1;
  
  return `
    <div class="hint-cell" data-hint-index="${hintIndex}" data-col-index="${colIndex}" data-team="${teamType}"${roundAttr}>
      <span class="hint-number">${hintNum}</span>
      <span class="hint-text ${hasHint ? '' : 'empty'}">
        ${hasHint ? escapeHtml(hintValue) : 'Tap to edit'}
      </span>
    </div>
  `;
}

function setupDragAndDrop(teamType) {
  const tbody = document.getElementById(`${teamType}Body`);
  const rows = tbody.querySelectorAll('.editable-row, .current-row');
  
  rows.forEach(row => {
    const allCells = row.querySelectorAll('.hint-col');
    const roundIndex = row.dataset.roundIndex !== undefined ? parseInt(row.dataset.roundIndex) : null;
    
    let draggedCell = null;
    let draggedHintIndex = -1;
    let draggedColIndex = -1;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let hasMoved = false;

    const cleanupDragState = () => {
      if (draggedCell) {
        draggedCell.classList.remove('dragging');
      }
      allCells.forEach(c => c.classList.remove('drag-over'));
      draggedCell = null;
      draggedHintIndex = -1;
      draggedColIndex = -1;
      pointerId = null;
      isDragging = false;
      hasMoved = false;
    };

    allCells.forEach((cell) => {
      const hintIndex = cell.dataset.hintIndex !== undefined ? parseInt(cell.dataset.hintIndex) : -1;
      const colIndex = parseInt(cell.dataset.colIndex);

      cell.addEventListener('pointerdown', (e) => {
        if (hintIndex === -1) return;
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        draggedCell = cell;
        draggedHintIndex = hintIndex;
        draggedColIndex = colIndex;
        pointerId = e.pointerId;
        isDragging = false;
        hasMoved = false;
        cell.setPointerCapture(e.pointerId);
      });

      cell.addEventListener('pointermove', (e) => {
        if (!draggedCell || draggedCell !== cell || pointerId === null) return;
        
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        
        if (!hasMoved && (dx > 10 || dy > 10)) {
          hasMoved = true;
          isDragging = true;
          cell.classList.add('dragging');
        }

        if (isDragging) {
          const x = e.clientX;
          const y = e.clientY;
          allCells.forEach(c => {
            if (c !== draggedCell) {
              const rect = c.getBoundingClientRect();
              if (x >= rect.left && x <= rect.right &&
                  y >= rect.top && y <= rect.bottom) {
                c.classList.add('drag-over');
              } else {
                c.classList.remove('drag-over');
              }
            }
          });
        }
      });

      cell.addEventListener('pointerup', (e) => {
        if (!draggedCell || draggedCell !== cell || pointerId === null) return;
        const currentPointerId = pointerId;
        const currentHintIndex = draggedHintIndex;
        const currentColIndex = draggedColIndex;
        const wasDragging = isDragging;
        const didMove = hasMoved;

        try {
          cell.releasePointerCapture(currentPointerId);
        } catch (err) {}

        if (wasDragging && didMove && currentHintIndex !== -1) {
          const targetCell = Array.from(allCells).find(c => {
            if (c === draggedCell) return false;
            const rect = c.getBoundingClientRect();
            return e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
          });

          if (targetCell) {
            const targetColIndex = parseInt(targetCell.dataset.colIndex);
            
            if (!isNaN(targetColIndex) && !isNaN(currentColIndex) &&
                targetColIndex !== currentColIndex) {
              
              cleanupDragState();
              
              const games = getGames();
              const game = games[currentGameId];
              if (game) {
                const team = game[teamType];
                let positions;
                
                if (roundIndex !== null) {
                  positions = [...(team.rounds[roundIndex].positions || [1, 2, 3, 4])];
                } else {
                  positions = [...(team.current.positions || [1, 2, 3, 4])];
                }
                
                const sourcePosition = currentColIndex + 1;
                const targetPosition = targetColIndex + 1;
                
                const hintAtTargetCol = positions.indexOf(targetPosition);
                
                positions[currentHintIndex] = targetPosition;
                
                if (hintAtTargetCol !== -1 && hintAtTargetCol !== currentHintIndex && hintAtTargetCol < 3) {
                  positions[hintAtTargetCol] = sourcePosition;
                }
                
                if (roundIndex !== null) {
                  team.rounds[roundIndex].positions = positions;
                  team.rounds[roundIndex].answer = calculateAnswer(positions);
                } else {
                  team.current.positions = positions;
                }
                
                game.updatedAt = new Date().toISOString();
                saveGames(games);
                renderTables();
              }
              return;
            }
          }
        }

        cleanupDragState();
        
        if (!didMove && currentHintIndex !== -1) {
          openHintModal(teamType, currentHintIndex, roundIndex);
        }
      });

      cell.addEventListener('pointercancel', (e) => {
        if (pointerId !== null && draggedCell) {
          try {
            draggedCell.releasePointerCapture(pointerId);
          } catch (err) {}
        }
        cleanupDragState();
      });

      cell.addEventListener('lostpointercapture', (e) => {
        cleanupDragState();
      });
    });
  });
}

function calculateAnswer(positions) {
  if (!positions || positions.length < 3) return '-';
  
  // Answer is 3 digits representing which column each hint (1, 2, 3) is at
  // positions[hintIndex] = column number (1-4) where that hint is placed
  // digit 1 = column of hint1, digit 2 = column of hint2, digit 3 = column of hint3
  const answer = positions.slice(0, 3).map(pos => pos.toString());
  
  const result = answer.join('');
  return result || '-';
}

function finalizeRound(teamType) {
  const games = getGames();
  const game = games[currentGameId];
  if (!game) return;

  const team = game[teamType];
  const current = team.current;
  const hints = current.hints || ['', '', '', ''];
  const positions = current.positions || [1, 2, 3, 4];

  // Check if all hints are filled
  const hasAllHints = hints.slice(0, 3).every(h => h.trim());
  if (!hasAllHints) {
    alert('Please fill in all 3 hints before finalizing.');
    return;
  }

  // Calculate answer
  const answer = calculateAnswer(positions);

  // Add to rounds
  const roundData = {
    round: team.currentRound || team.rounds.length + 1,
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
  team.current = { hints: ['', '', '', ''], positions: [1, 2, 3, 4] };

  // Increment team's round counter
  team.currentRound = (team.currentRound || team.rounds.length) + 1;
  game.updatedAt = new Date().toISOString();

  saveGames(games);

  // Update UI
  renderTables();
}

// ================= HINT INPUT MODAL =================

function setupHintModal() {
  const modal = document.getElementById('hintModal');
  const form = document.getElementById('hintForm');
  const cancelBtn = document.getElementById('cancelHintBtn');
  const closeBtn = document.getElementById('closeHintModal');
  const backdrop = modal.querySelector('.modal-backdrop');

  const closeModal = () => {
    modal.classList.add('hidden');
    form.reset();
  };

  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const teamType = document.getElementById('hintTeamType').value;
    const positionIndex = parseInt(document.getElementById('hintPositionIndex').value);
    const roundIndexInput = document.getElementById('hintRoundIndex').value;
    const roundIndex = roundIndexInput !== '' ? parseInt(roundIndexInput) : null;
    const hintWord = document.getElementById('hintWord').value.trim();

    if (isNaN(positionIndex) || positionIndex < 0 || positionIndex > 3) {
      closeModal();
      return;
    }

    const games = getGames();
    const game = games[currentGameId];
    
    if (game && game[teamType]) {
      const team = game[teamType];
      if (roundIndex !== null && team.rounds[roundIndex]) {
        team.rounds[roundIndex].hints[positionIndex] = hintWord;
      } else {
        team.current.hints[positionIndex] = hintWord;
      }
      game.updatedAt = new Date().toISOString();
      saveGames(games);
      renderTables();
    }

    closeModal();
  });
}

function openHintModal(teamType, positionIndex, roundIndex = null) {
  const games = getGames();
  const game = games[currentGameId];
  if (!game) return;

  const team = game[teamType];
  let currentHint = '';
  
  if (roundIndex !== null && team.rounds[roundIndex]) {
    currentHint = team.rounds[roundIndex].hints[positionIndex] || '';
  } else {
    currentHint = (team.current.hints && team.current.hints[positionIndex]) || '';
  }

  document.getElementById('hintTeamType').value = teamType;
  document.getElementById('hintPositionIndex').value = positionIndex;
  document.getElementById('hintRoundIndex').value = roundIndex !== null ? roundIndex : '';
  document.getElementById('hintPositionNum').textContent = positionIndex + 1;
  document.getElementById('hintWord').value = currentHint;

  document.getElementById('hintModal').classList.remove('hidden');
  setTimeout(() => {
    const input = document.getElementById('hintWord');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, 50);
}

// ================= UTILITIES =================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
