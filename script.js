// Define the static player names
const ALL_PLAYER_NAMES = ['Jason', 'Don', 'Les', 'Rich'];
const GAME_SAVE_KEY = 'skullKingGameState';

// Get references to the HTML elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const threePlayersBtn = document.getElementById('three-players-btn');
const fourPlayersBtn = document.getElementById('four-players-btn');
const helpBtn = document.getElementById('help-btn');
const helpButtonContainer = document.getElementById('help-button-container');
const playerSelectionSection = document.getElementById('player-selection-section');
const playerButtonsContainer = document.getElementById('player-buttons-container');
const selectionMessage = document.getElementById('selection-message');
const startGameBtn = document.getElementById('start-game-btn');
const roundTitle = document.getElementById('round-title');
const roundTableContainer = document.getElementById('round-table-container');
const scoreTableBody = document.getElementById('score-table-body');
const summaryTableContainer = document.getElementById('summary-table-container');
const summaryTableHead = document.getElementById('summary-table-head');
const summaryTableBody = document.getElementById('summary-table-body');
const previousRoundBtn = document.getElementById('previous-round-btn');
const nextRoundBtn = document.getElementById('next-round-btn');
const newGameBtn = document.getElementById('new-game-btn');
const messageBox = document.getElementById('message-box');

// Help modal elements
const helpModal = document.getElementById('help-modal');
const backToGameBtn = document.getElementById('back-to-game-btn');

// Kraken modal elements
const krakenModal = document.getElementById('kraken-modal');
const krakenYesBtn = document.getElementById('kraken-yes-btn');
const krakenNoBtn = document.getElementById('kraken-no-btn');

// Load Game modal elements
const loadGameModal = document.getElementById('load-game-modal');
const savedRoundNumberSpan = document.getElementById('saved-round-number');
const resumeGameBtn = document.getElementById('resume-game-btn');
const newGameFromModalBtn = document.getElementById('new-game-from-modal-btn');

let playerCount = 0;
let selectedPlayers = [];
let gameData = [];
let currentRound = 1;

// Function to display a temporary message to the user
function showMessage(message) {
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 4000);
}

// --- LOCAL STORAGE FUNCTIONS ---
// Function to save the current game state to local storage
function saveGameState() {
    const state = {
        gameData: gameData,
        selectedPlayers: selectedPlayers,
        playerCount: playerCount,
        currentRound: currentRound
    };
    localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(state));
}

function parseSavedGameState() {
    const savedState = localStorage.getItem(GAME_SAVE_KEY);
    if (!savedState) {
        return null;
    }

    try {
        return JSON.parse(savedState);
    } catch (error) {
        clearSavedGame();
        showMessage("Saved game data was unreadable, so it was cleared.");
        return null;
    }
}

// Function to load the game state from local storage
function loadGameState() {
    const state = parseSavedGameState();
    if (!state) {
        return false;
    }

    gameData = state.gameData;
    selectedPlayers = state.selectedPlayers;
    playerCount = state.playerCount;
    currentRound = state.currentRound;
    return true;
}

// Function to clear the saved game state from local storage
function clearSavedGame() {
    localStorage.removeItem(GAME_SAVE_KEY);
}

// Function to start a new game by clearing local storage and reloading
function restartGame() {
    clearSavedGame();
    location.reload();
}

// Function to render the player name buttons on the setup screen
function renderPlayerButtons() {
    playerButtonsContainer.innerHTML = '';
    ALL_PLAYER_NAMES.forEach(name => {
        const button = document.createElement('button');
        button.textContent = name;
        button.classList.add(
            'player-btn', 
            'px-6', 'py-4', 
            'bg-gray-700', 
            'text-lg', 'text-white', 
            'font-semibold', 
            'rounded-xl', 
            'shadow', 
            'hover:bg-gray-600', 
            'focus:outline-none', 
            'focus:ring-2', 
            'focus:ring-red-500'
        );
        
        if (selectedPlayers.includes(name)) {
            button.classList.add('selected');
        }

        button.addEventListener('click', () => {
            togglePlayerSelection(name);
        });

        playerButtonsContainer.appendChild(button);
    });
}

// Function to update the selection message and button state
function updateSetupUI() {
    const numSelected = selectedPlayers.length;
    selectionMessage.textContent = `Selected players: ${numSelected} of ${playerCount}`;

    if (numSelected === playerCount) {
        startGameBtn.disabled = false;
    } else {
        startGameBtn.disabled = true;
    }
}

// Function to handle player button clicks (select/deselect)
function togglePlayerSelection(name) {
    const index = selectedPlayers.indexOf(name);
    if (index > -1) {
        selectedPlayers.splice(index, 1);
    } else {
        if (selectedPlayers.length < playerCount) {
            selectedPlayers.push(name);
        } else {
            showMessage(`Cannot select more than ${playerCount} players.`);
            return;
        }
    }
    renderPlayerButtons();
    updateSetupUI();
}

// Scoring Logic Function
function calculateRoundScore(bid, tricksWon, bonus, round) {
    let score = 0;
    // Handle null bids/tricks by treating them as 0 for scoring
    const effectiveBid = bid === null ? 0 : bid;
    const effectiveTricksWon = tricksWon === null ? 0 : tricksWon;

    // BUG FIX: Changed '==' to '===' for strict comparison to prevent type coercion issues.
    if (effectiveBid === effectiveTricksWon) {
        // Correct bid
        if (effectiveBid === 0) {
            score = round * 10;
        } else {
            score = effectiveBid * 20;
        }
        // Add bonus points if the bid was correct and a bonus was entered
        if (bonus !== null) {
            score += bonus;
        }
    } else {
        // Incorrect bid
        if (effectiveBid === 0) {
            // This is the new rule: -10 points per card dealt that round.
            // The number of cards dealt is equal to the round number.
            score = round * -10;
        } else {
            score = Math.abs(effectiveTricksWon - effectiveBid) * -10;
        }
    }
    return score;
}

function parseOptionalIntegerInput(input) {
    const value = input.value.trim();
    return value === '' ? null : parseInt(value, 10);
}

function parseOptionalBonusInput(input) {
    const value = input.value.trim();
    if (value === '') {
        return null;
    }

    if (!/^\d+$/.test(value)) {
        return NaN;
    }

    return parseInt(value, 10);
}

function validateCurrentRoundInputs() {
    let totalTricks = 0;

    for (let i = 0; i < playerCount; i++) {
        const bidInput = document.getElementById(`bid-${i}`);
        const tricksInput = document.getElementById(`tricks-${i}`);
        const bonusInput = document.getElementById(`bonus-${i}`);
        const bid = parseOptionalIntegerInput(bidInput);
        const tricks = parseOptionalIntegerInput(tricksInput);
        const bonus = parseOptionalBonusInput(bonusInput);

        const effectiveBid = bid === null ? 0 : bid;
        const effectiveTricks = tricks === null ? 0 : tricks;

        if (isNaN(effectiveBid) || isNaN(effectiveTricks) || effectiveBid > currentRound || effectiveBid < 0 || effectiveTricks > currentRound || effectiveTricks < 0) {
            return {
                isValid: false,
                message: "Invalid input. Please check bids and tricks won values."
            };
        }

        if (bonus !== null && (isNaN(bonus) || bonus < 0)) {
            return {
                isValid: false,
                message: "Invalid bonus. Please enter a whole number 0 or higher."
            };
        }

        totalTricks += effectiveTricks;
    }

    return {
        isValid: true,
        totalTricks: totalTricks
    };
}

// Function to recalculate total scores for all players up to the current round
function recalculateTotalScores() {
    selectedPlayers.forEach((player, index) => {
        let total = 0;
        for (let i = 0; i < 10; i++) {
            // Only add score if the round has been played
            if (gameData[index].roundScores[i] !== null) {
                total += gameData[index].roundScores[i];
            }
        }
        gameData[index].totalScore = total;
    });
}

// Function to render the final game summary table
function renderSummaryTable() {
    // Hide the round-by-round table and show the summary table
    roundTableContainer.classList.add('hidden');
    summaryTableContainer.classList.remove('hidden');

    // Update title and buttons for the end of the game
    roundTitle.textContent = "Final Scores";
    previousRoundBtn.classList.add('hidden');
    nextRoundBtn.classList.add('hidden');
    newGameBtn.classList.remove('hidden');
    newGameBtn.textContent = "Start New Game";
    
    // Clear previous table content
    summaryTableHead.innerHTML = '';
    summaryTableBody.innerHTML = '';
    
    // Create table header
    const headerRow = document.createElement('tr');
    let headerHtml = `<th class="px-4 py-2 border-b-2 border-gray-700 text-left text-sm leading-4 font-medium text-gray-400 uppercase tracking-wider">Player</th>`;
    for (let i = 1; i <= 10; i++) {
        headerHtml += `<th class="px-2 py-2 border-b-2 border-gray-700 text-center text-sm leading-4 font-medium text-gray-400 uppercase tracking-wider">R${i} Bid/Tricks</th>`;
    }
    headerHtml += `<th class="px-4 py-2 border-b-2 border-gray-700 text-center text-sm leading-4 font-medium text-gray-400 uppercase tracking-wider">Final Score</th>`;
    headerRow.innerHTML = headerHtml;
    summaryTableHead.appendChild(headerRow);

    // Find the highest score to determine the winner(s)
    let maxScore = -Infinity;
    gameData.forEach(player => {
        if (player.totalScore > maxScore) {
            maxScore = player.totalScore;
        }
    });

    // Populate the table with final game data
    gameData.forEach(player => {
        const tr = document.createElement('tr');
        tr.classList.add('border-b', 'border-gray-700', 'hover:bg-gray-600', 'transition-colors');
        const isWinner = player.totalScore === maxScore;

        // Player name cell
        let rowHtml = `<td class="px-4 py-4 whitespace-nowrap text-left font-medium text-white">${player.name}</td>`;
        
        // Bid/Tricks for each round
        for (let i = 0; i < 10; i++) {
            const bid = player.bids[i] !== null ? player.bids[i] : '-';
            const tricks = player.tricksWon[i] !== null ? player.tricksWon[i] : '-';
            rowHtml += `<td class="px-2 py-4 text-center text-white">${bid}/${tricks}</td>`;
        }

        // Final Score cell with conditional flashing class
        const winnerClass = isWinner ? 'winner-score-flash' : '';
        rowHtml += `<td class="px-4 py-4 text-center">
                        <span class="bg-red-600 text-white font-bold px-3 py-1 rounded-full inline-block min-w-[48px] text-center shadow-md ${winnerClass}">
                            ${player.totalScore}
                        </span>
                    </td>`;
        
        tr.innerHTML = rowHtml;
        summaryTableBody.appendChild(tr);
    });
}

// Function to update the gameData with current table input values
function updateGameDataFromTable() {
    selectedPlayers.forEach((playerName, index) => {
        const bidInput = document.getElementById(`bid-${index}`);
        const tricksInput = document.getElementById(`tricks-${index}`);
        const bonusInput = document.getElementById(`bonus-${index}`);
        
        // Convert empty strings to null for saving, and 0 for scoring calculations
        const bidValue = parseOptionalIntegerInput(bidInput);
        const tricksValue = parseOptionalIntegerInput(tricksInput);
        const bonusValue = parseOptionalBonusInput(bonusInput);

        gameData[index].bids[currentRound - 1] = bidValue;
        gameData[index].tricksWon[currentRound - 1] = tricksValue;
        gameData[index].bonuses[currentRound - 1] = bonusValue;

        // Re-calculate the score for the current round with the new values
        const roundScore = calculateRoundScore(bidValue, tricksValue, bonusValue, currentRound);
        gameData[index].roundScores[currentRound - 1] = roundScore;
    });
    recalculateTotalScores();
    saveGameState();
}

// Function to render the game scoring table
function renderScoreTable() {
    if (currentRound > 10) {
        renderSummaryTable();
        return;
    }

    // Hide the summary table and show the round-by-round table
    summaryTableContainer.classList.add('hidden');
    roundTableContainer.classList.remove('hidden');

    scoreTableBody.innerHTML = ''; // Clear table
    roundTitle.textContent = `Round ${currentRound} (${currentRound} Card${currentRound > 1 ? 's' : ''})`;

    // Show or hide the "Previous Round" button
    if (currentRound > 1) {
        previousRoundBtn.classList.remove('hidden');
    } else {
        previousRoundBtn.classList.add('hidden');
    }
    
    // On round 10, change the button text to "Show Final Scores"
    if (currentRound === 10) {
        nextRoundBtn.textContent = "Show Final Scores";
    } else {
        nextRoundBtn.textContent = "Next Round";
    }
    nextRoundBtn.classList.remove('hidden');
    newGameBtn.classList.add('hidden');

    selectedPlayers.forEach((playerName, index) => {
        const tr = document.createElement('tr');
        tr.classList.add('border-b', 'border-gray-700', 'hover:bg-gray-600', 'transition-colors');

        // Player Name Cell
        const nameCell = document.createElement('td');
        nameCell.textContent = playerName;
        nameCell.setAttribute('data-label', 'Player');
        nameCell.classList.add('px-4', 'py-4', 'whitespace-nowrap', 'text-left', 'font-medium', 'text-white');
        tr.appendChild(nameCell);

        // Bid Input Cell
        const bidCell = document.createElement('td');
        const bidInput = document.createElement('input');
        bidInput.type = 'number';
        const bidValue = gameData[index].bids[currentRound - 1];
        // Display empty string to allow for "null" input
        bidInput.value = bidValue !== null ? bidValue : '';
        bidInput.min = 0;
        bidInput.max = currentRound;
        bidInput.id = `bid-${index}`;
        bidInput.classList.add('w-20', 'bg-gray-700', 'text-white', 'rounded-md', 'px-2', 'py-1', 'text-center', 'focus:outline-none', 'focus:ring-2', 'focus:ring-red-400', 'focus:bg-gray-600');
        bidCell.setAttribute('data-label', 'Bid');
        bidCell.classList.add('px-4', 'py-4', 'text-center');
        bidCell.appendChild(bidInput);
        tr.appendChild(bidCell);

        // Tricks Won Input Cell
        const tricksWonCell = document.createElement('td');
        const tricksInput = document.createElement('input');
        tricksInput.type = 'number';
        const tricksValue = gameData[index].tricksWon[currentRound - 1];
        tricksInput.value = tricksValue !== null ? tricksValue : '';
        tricksInput.min = 0;
        tricksInput.max = currentRound;
        tricksInput.id = `tricks-${index}`;
        tricksInput.classList.add('w-20', 'bg-gray-700', 'text-white', 'rounded-md', 'px-2', 'py-1', 'text-center', 'focus:outline-none', 'focus:ring-2', 'focus:ring-red-400', 'focus:bg-gray-600');
        tricksWonCell.setAttribute('data-label', 'Tricks');
        tricksWonCell.classList.add('px-4', 'py-4', 'text-center');
        tricksWonCell.appendChild(tricksInput);
        tr.appendChild(tricksWonCell);

        // Bonus Input Cell (manually editable)
        const bonusCell = document.createElement('td');
        const bonusInput = document.createElement('input');
        bonusInput.type = 'number';
        const bonusValue = gameData[index].bonuses[currentRound - 1];
        bonusInput.value = bonusValue !== null ? bonusValue : '';
        bonusInput.min = 0;
        bonusInput.id = `bonus-${index}`;
        bonusInput.classList.add(
            'w-20', 'bg-gray-700', 'text-white', 'rounded-md', 'px-2', 'py-1', 'text-center', 
            'focus:outline-none', 'focus:ring-2', 'focus:ring-red-400', 'focus:bg-gray-600'
        );
        bonusCell.setAttribute('data-label', 'Bonus');
        bonusCell.classList.add('px-4', 'py-4', 'text-center');
        bonusCell.appendChild(bonusInput);
        tr.appendChild(bonusCell);

        // Round Score Cell
        const roundScoreCell = document.createElement('td');
        const roundScoreValue = gameData[index].roundScores[currentRound - 1];
        roundScoreCell.textContent = roundScoreValue !== null ? roundScoreValue : '';
        roundScoreCell.setAttribute('data-label', 'Score');
        roundScoreCell.classList.add('px-4', 'py-4', 'text-center', 'text-white', 'font-bold');
        tr.appendChild(roundScoreCell);
        
        // Total Score Cell
        const totalScoreCell = document.createElement('td');
        const totalScoreSpan = document.createElement('span');
        totalScoreSpan.textContent = gameData[index].totalScore;
        totalScoreSpan.classList.add('bg-red-600', 'text-white', 'font-bold', 'px-3', 'py-1', 'rounded-full', 'inline-block', 'min-w-[48px]', 'text-center', 'shadow-md');
        totalScoreCell.setAttribute('data-label', 'Total');
        totalScoreCell.classList.add('px-4', 'py-4', 'text-center');
        totalScoreCell.appendChild(totalScoreSpan);
        tr.appendChild(totalScoreCell);

        scoreTableBody.appendChild(tr);
    });
}

// Function to process the scores and advance to the next round
function processNextRound() {
    // Update game data from the table one last time
    updateGameDataFromTable();
    
    // Recalculate all total scores after a round is complete
    recalculateTotalScores();
    
    currentRound++; // Move to the next round
    renderScoreTable(); // Re-render the table with new data
    saveGameState(); // Save the new state
}

// Kraken modal button listeners
krakenYesBtn.addEventListener('click', () => {
    krakenModal.classList.add('hidden');
    processNextRound();
});

krakenNoBtn.addEventListener('click', () => {
    krakenModal.classList.add('hidden');
    // Do nothing, user can now edit the values
});

// Handle the "Next Round" button click
nextRoundBtn.addEventListener('click', () => {
    const validation = validateCurrentRoundInputs();
    
    if (!validation.isValid) {
        showMessage(validation.message);
        return;
    }

    updateGameDataFromTable(); // Ensure data is saved before advancing.
    
    if (validation.totalTricks !== currentRound) {
        krakenModal.classList.remove('hidden');
    } else {
        processNextRound();
    }
});

// Event listener for the "Previous Round" button
previousRoundBtn.addEventListener('click', () => {
    if (currentRound > 1) {
        // BUG FIX: Removed the call to updateGameDataFromTable() here.
        // The "Next Round" button is now the designated "save" action.
        // This prevents unsaved data for the current round from overwriting itself
        // with empty values when you go back.
        currentRound--;
        renderScoreTable();
        saveGameState(); // Save the state after the round change
    }
});

// Event listener for the "New Game" button
newGameBtn.addEventListener('click', () => {
    restartGame();
});


// Handle player count button clicks
threePlayersBtn.addEventListener('click', () => {
    playerCount = 3;
    selectedPlayers = [];
    playerSelectionSection.classList.remove('hidden');
    helpButtonContainer.classList.add('hidden'); // Hide the help button container
    renderPlayerButtons();
    updateSetupUI();
});

fourPlayersBtn.addEventListener('click', () => {
    playerCount = 4;
    selectedPlayers = [...ALL_PLAYER_NAMES];
    playerSelectionSection.classList.remove('hidden');
    helpButtonContainer.classList.add('hidden'); // Hide the help button container
    renderPlayerButtons();
    updateSetupUI();
});

// Handle the "Start Game" button click
startGameBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
    
    // Initialize game data for each player
    gameData = selectedPlayers.map(name => ({
        name: name,
        bids: new Array(10).fill(null),
        tricksWon: new Array(10).fill(null),
        bonuses: new Array(10).fill(null),
        roundScores: new Array(10).fill(null),
        totalScore: 0
    }));

    // Hide the setup screen and show the game screen
    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Render the initial score table
    renderScoreTable();
    saveGameState();
});

// Event listener for the new "Help for Noobs" button
helpBtn.addEventListener('click', () => {
    setupScreen.classList.add('hidden');
    helpModal.classList.remove('hidden');
});

// Event listener for the "Back to Game" button in the help modal
backToGameBtn.addEventListener('click', () => {
    helpModal.classList.add('hidden');
    setupScreen.classList.remove('hidden');
});

// Load Game modal button listeners
resumeGameBtn.addEventListener('click', () => {
    if (loadGameState()) {
        loadGameModal.classList.add('hidden');
        setupScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        renderScoreTable();
    } else {
        showMessage("Could not load saved game data.");
        loadGameModal.classList.add('hidden');
        setupScreen.classList.remove('hidden');
    }
});

newGameFromModalBtn.addEventListener('click', () => {
    restartGame();
});


// --- INITIALIZATION ---
// On page load, check for a saved game
document.addEventListener('DOMContentLoaded', () => {
    const savedState = parseSavedGameState();
    if (savedState) {
        // If a saved game exists, show the load game modal
        savedRoundNumberSpan.textContent = savedState.currentRound;
        loadGameModal.classList.remove('hidden');
        // The help button will be hidden by this logic if they resume a game
        helpButtonContainer.classList.add('hidden');
    } else {
        // Otherwise, show the normal setup screen and ensure help button is visible
        setupScreen.classList.remove('hidden');
        helpButtonContainer.classList.remove('hidden');
    }
});
