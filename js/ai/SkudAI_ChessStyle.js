/**
 * SkudChessAI - A strategic AI for Skud Pai Sho using Chess programming techniques
 *
 * Improvements over SkudChessAI:
 * - 
 */

import {
	ACCENT_TILE,
	BASIC_FLOWER,
	SPECIAL_FLOWER,
} from '../GameData';
import {
	simpleCanonRules,
} from '../skud-pai-sho/SkudPaiShoRules';
import {
	ARRANGING,
	GUEST,
	HOST,
	NotationPoint,
	PLANTING,
	RowAndColumn,
} from '../CommonNotationObjects';
import { POSSIBLE_MOVE } from '../skud-pai-sho/SkudPaiShoBoardPoint';
import {
	SkudPaiShoNotationBuilder,
	SkudPaiShoNotationMove,
} from '../skud-pai-sho/SkudPaiShoGameNotation';
import { WAITING_FOR_ENDPOINT } from '../GameConstants';
import { SkudPaiShoGameManager } from '../skud-pai-sho/SkudPaiShoGameManager';
import { SkudAiChessHelp } from './SkudAI_ChessHelp';

// Constructor
export function SkudChessAI() {
	this.player = null;
	this.moveNum = 0;
	this.helper = new SkudAiChessHelp();
	this.startTime = performance.now();
	this.timeLimit = 10000; // ms
}

// =========================================================
// Required method implementations to interface with controller
// =========================================================

/**
 * AI name to display on UI.
 * @returns {string}
 */
SkudChessAI.prototype.getName = function() {
	return "Chess Style AI";
};

/**
 * AI description to display on UI.
 * @returns {string}
 */
SkudChessAI.prototype.getMessage = function() {
	return "A more strategic opponent that uses the same techniques as popular chess programs.";
};

/**
 * Sets AI player as "HOST" or "GUEST"
 * @param {string} playerName
 */
SkudChessAI.prototype.setPlayer = function(playerName) {
	this.player = playerName;
};

/**
 * Main AI function to get best move to play.
 * @param {SkudPaiShoGameManager} game - Copy of game state.
 * @param {number} moveNum - Turn number of current move.
 * @returns {SkudPaiShoNotationMove} Notation for best move found by AI.
 */
SkudChessAI.prototype.getMove = function(game, moveNum) {
	// console.log("Chess AI V1", this.player)
	this.moveNum = moveNum;
	this.startTime = performance.now();
	let perfMsg = "";
	
	// Move 0: Strategic accent tile selection
	if (moveNum === 0) return this.selectAccentTiles(game);
	
	let moves = this.helper.getPossibleMoves(game, this.player);
	if (moves.length === 0) return null;
	
	// Enhance moves with harmony bonus actions where applicable
	moves = this.helper.enhanceMovesWithBonusActions(game, moves);

	// Initial ordering to improve alpha beta pruning
    moves.sort((a, b) => {
        return this.quickEvaluateMove(game, b) - this.quickEvaluateMove(game, a);
    });

	// Score all moves and find the best
	let bestMove = moves[0];
	
	let copyGame = game.getCopy();
	try {
		for (let depth = 1; depth <= 10; depth++) {
			let bestScore = -Infinity;
            let currentBest = bestMove;

			for (let move of moves) {
				let moveResults = copyGame.runNotationMove(move);
		
				var score = this.minimax(copyGame, depth - 1, -Infinity, Infinity, false);
				copyGame.undoNotationMove(move, moveResults);
		
				// Immediate win detection
				if (score >= 999999999) return move;
		
				if (score > bestScore) {
					bestScore = score;
					currentBest = move;
				}
			}

			bestMove = currentBest;

			// Reorder to search best move first on next iteration
            moves.sort((a, b) => {
                if (a === bestMove) return -1;
                if (b === bestMove) return 1;
                return 0;
            });
			perfMsg = `${perfMsg}Depth of ${depth} finished in ${performance.now() - this.startTime}ms, best score of ${bestScore}.\n`;
		}
	} catch (e) {
        console.warn(perfMsg);
    }

	// Use the best move from the latest depth before timeout, fallback to random move if none was found to avoid game freeze
	if (!bestMove) return moves[Math.floor(Math.random() * moves.length)];
	return bestMove;
};

// =========================================================
// Search Functions
// =========================================================

/**
 * Recursive function to look at future moves to determine which move is best.
 * @param {SkudPaiShoGameManager} game - Copy of game state.
 * @param {number} depth - Number of moves into the future to look.
 * @param {number} alpha - Minimum score that the maximizing player is assured of
 * @param {number} beta - Maximum score that the minimizing player is assured of
 * @param {boolean} isMaximizing - Do we want to maximize or minimize score (Is it our turn or opponent's turn).
 * @returns {number} Max/Min score found in search.
 */
SkudChessAI.prototype.minimax = function(game, depth, alpha, beta, isMaximizing) {
	// Abort if we have passed thinking time limit
    if (performance.now() - this.startTime > this.timeLimit) throw new Error("TIMEOUT");

	if (depth === 0) return this.evaluate(game);

	const player = isMaximizing ? this.player : this.helper.getOpponent();
    const moves = this.helper.getPossibleMoves(game, player);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            let moveResults = game.runNotationMove(move);

            let score = this.minimax(game, depth - 1, alpha, beta, false);
			game.undoNotationMove(move, moveResults);

            maxEval = Math.max(maxEval, score);
            alpha = Math.max(alpha, score);

            if (beta <= alpha) break; // Prune
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            let moveResults = game.runNotationMove(move);

            let score = this.minimax(game, depth - 1, alpha, beta, true);
			game.undoNotationMove(move, moveResults);

            minEval = Math.min(minEval, score);
            beta = Math.min(beta, score);

            if (beta <= alpha) break; // PRUNE
        }
        return minEval;
    }
};

// =========================================================
// Evaluation Functions
// =========================================================

/**
 * Quick analysis for initial move ordering, based on major move components
 * @param {SkudPaiShoGameManager} game - Game state to be analyzed
 * @param {SkudPaiShoNotationMove} move - Move to be analyzed
 * @returns {number} Score.
 */
SkudChessAI.prototype.quickEvaluateMove = function(game, move) {
    let score = 0;

    if (move.capturedTile) score += 50;
    if (move.hasHarmonyBonus && move.hasHarmonyBonus()) score += 100;
    if (move.moveType === PLANTING) score += 5;

    return score;
};

/**
 * Select accent tiles strategically instead of randomly.
 * Gets a combo of all base accent types for variety
 * TODO: Take opponent accent tile selection into account
 */
SkudChessAI.prototype.selectAccentTiles = function(game) {
	return new SkudPaiShoNotationMove("0" + this.player.charAt(0) + "." + "W,K,R,B");
};

/**
 * Evaluate a position and assign a score based on how good it is for the player.
 * @param {SkudPaiShoGameManager} game - Game state to be analyzed.
 * @returns {number} Score.
 */
SkudChessAI.prototype.evaluate = function(game) {
	var score = 0;
	var opponent = this.helper.getOpponent();

	// === IMMEDIATE WIN/LOSS DETECTION ===

	// Check if we won and give highest score
	if (game.board.winners.includes(this.player)) return 999999999;

	// Check if opponent could win on their next turn (threat)
	var opponentThreatLevel = this.detectOpponentThreats(game, opponent);
	if (opponentThreatLevel > 0) {
		// Penalize moves that don't address threats
		score -= opponentThreatLevel * 100;
	}

	// === HARMONY EVALUATION ===

	// Add points for our harmonies and subtract for enemy harmonies
	var numHarmonies = game.board.harmonyManager.numHarmoniesForPlayer(this.player);
	var oppNumHarmonies = game.board.harmonyManager.numHarmoniesForPlayer(opponent);
	score += (numHarmonies * 30) - (oppNumHarmonies * 25);

	// Harmonies crossing center are more valuable
	var numCenterHarmonies = game.board.harmonyManager.getNumCrossingCenterForPlayer(this.player);
	score += 30 * numCenterHarmonies;

	// === RING FORMATION ===

	// Building surroundness is important for ring victory
	var surroundness = game.board.getSurroundness(this.player);
	var oppSurroundness = game.board.getSurroundness(opponent);
	score += (surroundness - oppSurroundness) * 15;

	// If we have good surroundness, prioritize ring length
	if (surroundness >= 3) {
		var ringLength = game.board.harmonyManager.ringLengthForPlayer(this.player);
		var oppRingLength = game.board.harmonyManager.ringLengthForPlayer(opponent);
		score += (ringLength - oppRingLength) * 25;
	}

	// === POSITION QUALITY ===

	// Tiles in gardens (controlled territory)
	var gardenTiles = game.board.numTilesInGardensForPlayer(this.player);
	var oppGardenTiles = game.board.numTilesInGardensForPlayer(opponent);
	score += (gardenTiles - oppGardenTiles) * 8;

	// // Capturing opponent tiles
	// var oppTilesBefore = game.board.numTilesOnBoardForPlayer(opponent);
	// var oppTilesAfter = copyGame.board.numTilesOnBoardForPlayer(opponent);

	// if (oppTilesAfter < oppTilesBefore) score += 12;

	// === HARMONY POTENTIAL ===

	// Evaluate tiles that could form harmonies in future moves
	score += this.evaluateHarmonyPotential(game, this.player) * 3;

	// === ENDGAME AWARENESS ===

	// Check if approaching endgame (few tiles left)
	var ourTilePile = this.helper.getTilePile(game, this.player);
	var basicFlowersLeft = this.countBasicFlowers(ourTilePile);

	// In endgame, harmonies crossing center matter most
	if (basicFlowersLeft <= 2) score += numCenterHarmonies * 40;

	// === PLANTING BONUS ===

	// Slight preference for planting to develop the position
	// if (move.moveType === PLANTING) score += 5;

	// === HARMONY BONUS ACTIONS ===
	// Big score boost for moves that have bonus actions attached
	// These are moves that successfully chain combo actions
	// if (move.hasHarmonyBonus && move.hasHarmonyBonus()) {
	// 	score += 100; // Significant bonus for utilizing harmony extra actions
		
	// 	// Extra bonus if the bonus action is a plant (develops board)
	// 	if (move.bonusTileCode && move.moveType === ARRANGING) {
	// 		score += 40; // Arranging with a bonus plant is very productive
	// 	}
	// }

	return score;
};

/**
 * Detect if the opponent has threatening positions that could lead to a win.
 * Returns a threat level (0 = no threat, higher = more dangerous)
 * @param {SkudPaiShoGameManager} game - Game state to be analyzed.
 * @param {string} opponent - "HOST" or "GUEST".
 * @returns {number} Threat Level.
 */
SkudChessAI.prototype.detectOpponentThreats = function(game, opponent) {
	var threatLevel = 0;

	// Check opponent's surroundness and ring progress
	var oppSurroundness = game.board.getSurroundness(opponent);
	if (oppSurroundness >= 4) {
		threatLevel += 20;

		var oppRingLength = game.board.harmonyManager.ringLengthForPlayer(opponent);
		if (oppRingLength >= 6) {
			threatLevel += 50; // Very close to ring victory
		} else if (oppRingLength >= 4) {
			threatLevel += 25;
		}
	}

	// Check opponent's center-crossing harmonies (endgame threat)
	var oppCenterHarm = game.board.harmonyManager.getNumCrossingCenterForPlayer(opponent);
	var ourCenterHarm = game.board.harmonyManager.getNumCrossingCenterForPlayer(this.player);

	if (oppCenterHarm > ourCenterHarm + 2) {
		threatLevel += 15;
	}

	return threatLevel;
};

/**
 * Evaluate the potential for future harmonies based on tile positions.
 * Looks at tiles that are adjacent to empty spaces that could complete harmonies.
 * @param {SkudPaiShoGameManager} game - Game state to be analyzed.
 * @param {string} player - "HOST" or "GUEST".
 * @returns {number} Harmony Potential.
 */
SkudChessAI.prototype.evaluateHarmonyPotential = function(game, player) {
	var potential = 0;
	var cells = game.board.cells;

	for (var row = 0; row < cells.length; row++) {
		for (var col = 0; col < cells[row].length; col++) {
			var point = cells[row][col];
			if (point.hasTile() && point.tile.ownerName === player) {
				var tile = point.tile;
				if (tile.type === BASIC_FLOWER || tile.type === SPECIAL_FLOWER) {
					// Count adjacent empty spaces that could extend harmonies
					potential += this.countAdjacentPotential(game, row, col);
				}
			}
		}
	}

	return potential;
};

/**
 * Count adjacent positions that could potentially form harmonies.
 * @param {SkudPaiShoGameManager} game - Game state to be analyzed.
 * @param {number} row
 * @param {number} col
 * @returns {number} Harmony Potential.
 */
SkudChessAI.prototype.countAdjacentPotential = function(game, row, col) {
	var potential = 0;
	var directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

	for (var dir of directions) {
		var newRow = row + dir[0];
		var newCol = col + dir[1];

		if (newRow >= 0 && newRow < game.board.cells.length &&
			newCol >= 0 && newCol < game.board.cells[newRow].length) {

			var adjPoint = game.board.cells[newRow][newCol];
			// Empty playable space = potential
			if (!adjPoint.hasTile() && adjPoint.types && !adjPoint.types.includes('NON_PLAYABLE')) {
				potential += 1;
			}
		}
	}

	return potential;
};

/**
 * Count basic flowers remaining in a tile pile.
 */
SkudChessAI.prototype.countBasicFlowers = function(tilePile) {
	var count = 0;
	for (var i = 0; i < tilePile.length; i++) {
		if (tilePile[i].type === BASIC_FLOWER) {
			count++;
		}
	}
	return count;
};

