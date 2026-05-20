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
}

//
// Required method implementations to interface with controller
//
SkudChessAI.prototype.getName = function() {
	return "Chess Style AI";
};

SkudChessAI.prototype.getMessage = function() {
	return "A more strategic opponent that uses the same techniques as popular chess programs.";
};

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

	// Move 0: Strategic accent tile selection
	if (moveNum === 0) return this.selectAccentTiles(game);

	var moves = this.helper.getPossibleMoves(game, this.player);
	if (moves.length === 0) return null;

	// Enhance moves with harmony bonus actions where applicable
	moves = this.helper.enhanceMovesWithBonusActions(game, moves);

	// Score all moves and find the best
	var bestMove = null;
	var bestScore = -Infinity;

	for (var i = 0; i < moves.length; i++) {
		var move = moves[i];
		var score = this.evaluateMove(game, move);

		// Immediate win detection
		if (score >= 999999999) return move;

		// Add small random factor to break ties and add variety
		score += Math.random() * 2;

		if (score > bestScore) {
			bestScore = score;
			bestMove = move;
		}
	}

	return bestMove;
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
 * Evaluate a move by simulating it and scoring the resulting position.
 */
SkudChessAI.prototype.evaluateMove = function(game, move) {
	var copyGame = game.getCopy();
	copyGame.runNotationMove(move);

	var score = 0;
	var opponent = this.helper.getOpponent();

	// === IMMEDIATE WIN/LOSS DETECTION ===

	// Check for our win
	if (copyGame.board.winners.includes(this.player)) {
		return 999999999;
	}

	// Check if opponent could win on their next turn (threat)
	var opponentThreatLevel = this.detectOpponentThreats(copyGame, opponent);
	if (opponentThreatLevel > 0) {
		// Penalize moves that don't address threats
		score -= opponentThreatLevel * 100;
	}

	// === HARMONY EVALUATION ===

	// Our harmonies
	var harmonyBefore = game.board.harmonyManager.numHarmoniesForPlayer(this.player);
	var harmonyAfter = copyGame.board.harmonyManager.numHarmoniesForPlayer(this.player);
	var harmonyDelta = harmonyAfter - harmonyBefore;

	score += harmonyDelta * 30;

	// Harmonies crossing center are more valuable
	var centerHarmBefore = game.board.harmonyManager.getNumCrossingCenterForPlayer(this.player);
	var centerHarmAfter = copyGame.board.harmonyManager.getNumCrossingCenterForPlayer(this.player);

	if (centerHarmAfter > centerHarmBefore) {
		score += 60;
	}

	// Opponent's harmonies (disruption is good)
	var oppHarmBefore = game.board.harmonyManager.numHarmoniesForPlayer(opponent);
	var oppHarmAfter = copyGame.board.harmonyManager.numHarmoniesForPlayer(opponent);
	var oppHarmDelta = oppHarmAfter - oppHarmBefore;

	score -= oppHarmDelta * 25; // Penalize opponent gains, reward opponent losses

	// === RING FORMATION ===

	var surroundness = copyGame.board.getSurroundness(this.player);
	var surroundnessBefore = game.board.getSurroundness(this.player);

	// Building surroundness is important for ring victory
	if (surroundness > surroundnessBefore) score += 15;

	// If we have good surroundness, prioritize ring length
	if (surroundness >= 3) {
		var ringLengthBefore = game.board.harmonyManager.ringLengthForPlayer(this.player);
		var ringLengthAfter = copyGame.board.harmonyManager.ringLengthForPlayer(this.player);

		if (ringLengthAfter > ringLengthBefore) {
			score += 25 + (ringLengthAfter * 5);
		}
	}

	// === POSITION QUALITY ===

	// Tiles in gardens (controlled territory)
	var gardenTilesBefore = game.board.numTilesInGardensForPlayer(this.player);
	var gardenTilesAfter = copyGame.board.numTilesInGardensForPlayer(this.player);

	score += (gardenTilesAfter - gardenTilesBefore) * 8;

	// Capturing opponent tiles
	var oppTilesBefore = game.board.numTilesOnBoardForPlayer(opponent);
	var oppTilesAfter = copyGame.board.numTilesOnBoardForPlayer(opponent);

	if (oppTilesAfter < oppTilesBefore) score += 12;

	// === HARMONY POTENTIAL ===

	// Evaluate tiles that could form harmonies in future moves
	score += this.evaluateHarmonyPotential(copyGame, this.player) * 3;

	// === ENDGAME AWARENESS ===

	// Check if approaching endgame (few tiles left)
	var ourTilePile = this.helper.getTilePile(game, this.player);
	var basicFlowersLeft = this.countBasicFlowers(ourTilePile);

	// In endgame, harmonies crossing center matter most
	if (basicFlowersLeft <= 2) score += centerHarmAfter * 40;

	// === PLANTING BONUS ===

	// Slight preference for planting to develop the position
	if (move.moveType === PLANTING) {
		score += 5;
	}

	// === HARMONY BONUS ACTIONS ===
	// Big score boost for moves that have bonus actions attached
	// These are moves that successfully chain combo actions
	if (move.hasHarmonyBonus && move.hasHarmonyBonus()) {
		score += 100; // Significant bonus for utilizing harmony extra actions
		
		// Extra bonus if the bonus action is a plant (develops board)
		if (move.bonusTileCode && move.moveType === ARRANGING) {
			score += 40; // Arranging with a bonus plant is very productive
		}
	}

	return score;
};

/**
 * Detect if the opponent has threatening positions that could lead to a win.
 * Returns a threat level (0 = no threat, higher = more dangerous)
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
					potential += this.countAdjacentPotential(game, row, col, tile);
				}
			}
		}
	}

	return potential;
};

/**
 * Count adjacent positions that could potentially form harmonies.
 */
SkudChessAI.prototype.countAdjacentPotential = function(game, row, col, tile) {
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

