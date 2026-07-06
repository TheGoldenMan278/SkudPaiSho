/* Skud AI Help */


import { ACCENT_TILE, BASIC_FLOWER } from '../GameData';
import { simpleCanonRules } from '../skud-pai-sho/SkudPaiShoRules';
import {
  ARRANGING,
  HOST,
  GUEST,
  NotationPoint,
  PLANTING,
  RowAndColumn,
} from '../CommonNotationObjects';
import {
  NON_PLAYABLE,
  POSSIBLE_MOVE,
} from '../skud-pai-sho/SkudPaiShoBoardPoint';
import {
  SkudPaiShoNotationBuilder,
  SkudPaiShoNotationMove,
} from '../skud-pai-sho/SkudPaiShoGameNotation';
import { WAITING_FOR_ENDPOINT } from '../GameConstants';
import { SkudPaiShoBoardPoint } from '../skud-pai-sho/SkudPaiShoBoardPoint';
import { SkudPaiShoGameManager } from '../skud-pai-sho/SkudPaiShoGameManager';
import { SkudPaiShoTile } from '../skud-pai-sho/SkudPaiShoTile';

// =========================================================
// MOVE GENERATION FUNCTIONS
// =========================================================

/**
 * Get list of all possible moves from current game state
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {string} player - Either "HOST" or "GUEST"
 * @param {number} moveNum
 * @returns {SkudPaiShoNotationMove[]} List of all possible moves
 */
export function getPossibleMoves(game, player, moveNum) {
	let moves = [];

	addPlantMoves(moves, game, player, moveNum);
	addArrangeMoves(moves, game, player, moveNum);

	return moves;
};

/**
 * Add all plant moves to list of possible moves
 * @param {SkudPaiShoNotationMove[]} moves - List of possible moves
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {string} player - Either "HOST" or "GUEST"
 * @param {number} moveNum
 */
export function addPlantMoves(moves, game, player, moveNum) {
	if (!isOpenGate(game)) {
		return;
	}

	const tilePile = getTilePile(game, player);
	let plantTypesAnalyzed = new Set();

	// For each tile in player's tile reserve ("tile pile"), build Planting moves
	for (const tile of tilePile) {
		if (tile.type !== BASIC_FLOWER) continue;

		// Only need to look at planting each basic flower tile type once because moves will be the same for each
		if (plantTypesAnalyzed.has(tile.code)) continue;
		plantTypesAnalyzed.add(tile.code);

		// For each basic flower get possible plant points
		const convertedMoveNum = moveNum * 2;
		const endPoints = game.revealOpenGates(player, tile, convertedMoveNum, true);
		endPoints.forEach(function(bp) {
			bp.removeType(POSSIBLE_MOVE);
			bp.clearPossibleMovementTypes();
		});

		for (const endPoint of endPoints) {
			let notationBuilder = new SkudPaiShoNotationBuilder();
			notationBuilder.moveType = PLANTING;

			notationBuilder.plantedFlowerType = tile.code;
			notationBuilder.status = WAITING_FOR_ENDPOINT;

			notationBuilder.endPoint = new NotationPoint(getNotation(endPoint));
			let move = notationBuilder.getNotationMove(moveNum, player);
			moves.push(move);

		}
	}
};

/**
 * Add all arrange moves to list of possible moves
 * @param {SkudPaiShoNotationMove[]} moves - List of possible moves
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {string} player - Either "HOST" or "GUEST"
 * @param {number} moveNum
 */
export function addArrangeMoves(moves, game, player, moveNum) {
	const startPoints = getStartPoints(game, player);

	for (const startPoint of startPoints) {
		const endPoints = game.revealPossibleMovePoints(startPoint, true);
		endPoints.forEach(function(bp) {
			bp.removeType(POSSIBLE_MOVE);
			bp.clearPossibleMovementTypes();
		});

		for (const endPoint of endPoints) {
			let notationBuilder = new SkudPaiShoNotationBuilder();
			notationBuilder.status = WAITING_FOR_ENDPOINT;
			notationBuilder.moveType = ARRANGING;
			notationBuilder.startPoint = new NotationPoint(getNotation(startPoint));

			notationBuilder.endPoint = new NotationPoint(getNotation(endPoint));
			let move = notationBuilder.getNotationMove(moveNum, player);
			moves.push(move);

		}
	}
};

/**
 * Enhance moves with bonus actions when they create harmonies
 * For each move that creates a harmony, we add variants with bonus plant/arrange moves
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {SkudPaiShoNotationMove[]} moves - Original move list
 * @param {string} player - Either "HOST" or "GUEST"
 * @param {number} moveNum
 * @returns {SkudPaiShoNotationMove[]} New move list with harmony bonus moves added
 */
export function enhanceMovesWithBonusActions(game, moves, player, moveNum) {
	let enhancedMoves = [];
	const opponent = getOpponent(player);

	for (let i = 0; i < moves.length; i++) {
		let move = moves[i];
		enhancedMoves.push(move); // Always include the basic move

		// Check if this move creates a harmony
		let copyGame = game.getCopy();
		copyGame.runNotationMove(move);

		const harmonyBefore = game.board.harmonyManager.numHarmoniesForPlayer(player);
		const harmonyAfter = copyGame.board.harmonyManager.numHarmoniesForPlayer(player);

		// If move creates a harmony, add bonus action variants
		if (harmonyAfter > harmonyBefore) {
			// Add variants with bonus plant moves
			let plantBonusVariants = generateBonusPlantVariants(copyGame, move, moveNum);
			enhancedMoves = enhancedMoves.concat(plantBonusVariants);

			// Add variants with bonus arrange moves
			let arrangeBonusVariants = generateBonusArrangeVariants(copyGame, move);
			enhancedMoves = enhancedMoves.concat(arrangeBonusVariants);
		}
	}

	return enhancedMoves;
};

/**
 * Generate bonus plant move variants for a given move
 * Takes a move that creates a harmony, and returns versions with bonus plants attached
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {SkudPaiShoNotationMove} baseMove - Move without any bonus actions
 * @param {string} player - Either "HOST" or "GUEST"
 * @param {number} moveNum
 * @returns {SkudPaiShoNotationMove[]} List of all bonus action variant moves
 */
export function generateBonusPlantVariants(game, baseMove, player, moveNum) {
	let variants = [];
	const tilePile = getTilePile(game, player);
	let plantableFlowers = [];

	// Collect available basic flowers to plant
	for (let i = 0; i < tilePile.length; i++) {
		if (tilePile[i].type === BASIC_FLOWER) {
			plantableFlowers.push(tilePile[i]);
		}
	}

	if (plantableFlowers.length === 0) {
		return variants; // No flowers left to plant
	}

	// For each plantable flower, generate placement variants
	for (let f = 0; f < plantableFlowers.length; f++) {
		const flower = plantableFlowers[f];
		game.revealOpenGates(player, flower, moveNum * 2, true);
		const endPoints = getPossibleMovePoints(game);

		for (let j = 0; j < endPoints.length; j++) {
			const endPoint = endPoints[j];
			let variant = baseMove.clone ? baseMove.clone() : JSON.parse(JSON.stringify(baseMove));
			
			// Add bonus plant information
			variant.bonusTileCode = flower.code;
			variant.bonusEndPoint = "(" + getNotation(endPoint) + ")";
			variant.fullMoveText = baseMove.fullMoveText + "+" + variant.bonusTileCode + variant.bonusEndPoint;

			// Prefer center placements for bonuses
			if (j < 3) { // Only add some of the closest options to avoid explosion
				variants.push(variant);
			}
		}

		game.hidePossibleMovePoints(true);
	}

	return variants;
};

/**
 * Generate bonus arrange move variants for a given move
 * Takes a move that creates harmony, and returns versions with bonus arrangements attached
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {SkudPaiShoNotationMove} baseMove - Move without any bonus actions
 * @param {string} player - Either "HOST" or "GUEST"
 * @returns {SkudPaiShoNotationMove[]} List of all bonus action variant moves
 */
export function generateBonusArrangeVariants(game, baseMove, player) {
	let variants = [];
	const startPoints = getStartPoints(game, player);

	// For each tile we can move, generate movement variants
	for (let i = 0; i < startPoints.length && variants.length < 6; i++) {
		const startPoint = startPoints[i];
		game.revealPossibleMovePoints(startPoint, true);
		const endPoints = getPossibleMovePoints(game);

		for (let j = 0; j < endPoints.length; j++) {
			const endPoint = endPoints[j];
			let variant = baseMove.clone ? baseMove.clone() : JSON.parse(JSON.stringify(baseMove));
			
			// Add bonus arrange information
			variant.bonusStartPoint = getNotation(startPoint);
			variant.bonusEndPoint = "(" + getNotation(endPoint) + ")";
			variant.fullMoveText = baseMove.fullMoveText + "+" + getNotation(startPoint) + variant.bonusEndPoint;

			variants.push(variant);

			// Limit variants to avoid too many options
			if (variants.length >= 6) break;
		}

		game.hidePossibleMovePoints(true);
	}

	return variants;
};

// =========================================================
// UTILITY FUNCTIONS
// =========================================================

/**
 * Get list of all tiles yet to be placed by the player
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {string} player - Either "HOST" or "GUEST"
 * @returns {SkudPaiShoTile[]} tilePile
 */
export function getTilePile(game, player) {
	const tilePile = (player === GUEST) ? game.tileManager.guestTiles : game.tileManager.hostTiles;
	return tilePile;
};

const gateCells = [ [8, 0], [8, 16], [0, 8], [16, 8] ];
/**
 * Check if there is at least one open gate
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @returns {boolean}
 */
export function isOpenGate(game) {
	const cells = game.board.cells;
	for (const gateCell of gateCells) {
		if (cells[gateCell[0]][gateCell[1]].isOpenGate()) return true;
	}
	return false;
};

/**
 * Get list of all open points on the board with POSSIBLE_MOVE type
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @returns {SkudPaiShoBoardPoint[]}
 */
export function getPossibleMovePoints(game) {
	let points = [];
	for (let row = 0; row < game.board.cells.length; row++) {
		for (let col = 0; col < game.board.cells[row].length; col++) {
			if (game.board.cells[row][col].isType(POSSIBLE_MOVE)) {
				points.push(game.board.cells[row][col]);
			}
		}
	}
	return points;
};

/**
 * Convert boardPoint to RowAndColumn.notationPointString
 * @param {SkudPaiShoBoardPoint} boardPoint
 * @returns {string}
 */
export function getNotation(boardPoint) {
	return new RowAndColumn(boardPoint.row, boardPoint.col).notationPointString;
};

/**
 * Get list of all board points that have a piece owned by the player that is able to move
 * Include: not accent tile, not drained or trapped
 * @param {SkudPaiShoGameManager} game - Copy of game state
 * @param {string} player - Either "HOST" or "GUEST"
 * @returns {SkudPaiShoBoardPoint[]}
 */
export function getStartPoints(game, player) {
	let points = [];
	for (let row = 0; row < game.board.cells.length; row++) {
		for (let col = 0; col < game.board.cells[row].length; col++) {
			const startPoint = game.board.cells[row][col];
			if (startPoint.hasTile()
				&& startPoint.tile.ownerName === player
				&& startPoint.tile.type !== ACCENT_TILE
				&& !(startPoint.tile.drained || startPoint.tile.trapped)) {
				
				points.push(game.board.cells[row][col]);
			}
		}
	}
	return points;
};

/**
 * Get if opponent is "HOST" or "GUEST"
 * @param {string} player - Either "HOST" or "GUEST"
 * @returns {string}
 */
export function getOpponent(player) {
	return player === GUEST ? HOST : GUEST;
};
