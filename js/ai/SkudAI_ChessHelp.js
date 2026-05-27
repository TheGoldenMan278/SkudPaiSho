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

//
// Contains helper functions to get all possible moves
//
export class SkudAiChessHelp {
	constructor() {}

	// =========================================================
	// MOVE GENERATION FUNCTIONS
	// =========================================================

	/**
	 * Get list of all possible moves from current game state
	 * @param {SkudPaiShoGameManager} thisGame - Copy of game state
	 * @param {string} player - Either "HOST" or "GUEST"
	 * @returns {SkudPaiShoNotationMove[]} List of all possible moves
	 */
	getPossibleMoves = function(thisGame, player) {
		var moves = [];

		this.addPlantMoves(moves, thisGame, player);
		this.addArrangeMoves(moves, thisGame, player);

		return moves;
	};

	/**
	 * Add all plant moves to list of possible moves
	 * @param {SkudPaiShoNotationMove[]} moves - List of possible moves
	 * @param {SkudPaiShoGameManager} game - Copy of game state
	 * @param {string} player - Either "HOST" or "GUEST"
	 */
	addPlantMoves = function(moves, game, player) {
		if (!this.isOpenGate(game)) {
			return;
		}

		var tilePile = this.getTilePile(game, player);

		// For each tile in player's tile reserve ("tile pile"), build Planting moves
		for (var i = 0; i < tilePile.length; i++) {
			var tile = tilePile[i];
			if (tile.type === BASIC_FLOWER) {
				// For each basic flower
				// Get possible plant points
				var convertedMoveNum = this.moveNum * 2;
				game.revealOpenGates(player, tile, convertedMoveNum, true);
				var endPoints = this.getPossibleMovePoints(game);

				for (var j = 0; j < endPoints.length; j++) {
					var notationBuilder = new SkudPaiShoNotationBuilder();
					notationBuilder.moveType = PLANTING;

					notationBuilder.plantedFlowerType = tile.code;
					notationBuilder.status = WAITING_FOR_ENDPOINT;

					var endPoint = endPoints[j];

					notationBuilder.endPoint = new NotationPoint(this.getNotation(endPoint));
					var move = notationBuilder.getNotationMove(this.moveNum, player);

					game.hidePossibleMovePoints(true);

					var isDuplicate = false;
					for (var x = 0; x < moves.length; x++) {
						if (moves[x].equals(move)) {
							isDuplicate = true;
						}
					}

					if (!isDuplicate) {
						moves.push(move);
					}
				}
			}
		}
	};

	/**
	 * Add all arrange moves to list of possible moves
	 * @param {SkudPaiShoNotationMove[]} moves - List of possible moves
	 * @param {SkudPaiShoGameManager} game - Copy of game state
	 * @param {string} player - Either "HOST" or "GUEST"
	 */
	addArrangeMoves = function(moves, game, player) {
		var startPoints = this.getStartPoints(game, player);

		for (var i = 0; i < startPoints.length; i++) {
			var startPoint = startPoints[i];

			game.revealPossibleMovePoints(startPoint, true);

			var endPoints = this.getPossibleMovePoints(game);

			for (var j = 0; j < endPoints.length; j++) {
				var notationBuilder = new SkudPaiShoNotationBuilder();
				notationBuilder.status = WAITING_FOR_ENDPOINT;
				notationBuilder.moveType = ARRANGING;
				notationBuilder.startPoint = new NotationPoint(this.getNotation(startPoint));

				var endPoint = endPoints[j];

				notationBuilder.endPoint = new NotationPoint(this.getNotation(endPoint));
				var move = notationBuilder.getNotationMove(this.moveNum, player);

				game.hidePossibleMovePoints(true);

				var isDuplicate = false;
				for (var x = 0; x < moves.length; x++) {
					if (moves[x].equals(move)) {
						isDuplicate = true;
					}
				}

				if (!isDuplicate) {
					moves.push(move);
				}
			}
		}
	};

	/**
	 * Enhance moves with bonus actions when they create harmonies
	 * For each move that creates a harmony, we add variants with bonus plant/arrange moves
	 * @param {SkudPaiShoGameManager} game - Copy of game state
	 * @param {SkudPaiShoNotationMove[]} moves - Original move list
	 * @returns {SkudPaiShoNotationMove[]} New move list with harmony bonus moves added
	 */
	enhanceMovesWithBonusActions = function(game, moves) {
		var enhancedMoves = [];
		var opponent = this.getOpponent();

		for (var i = 0; i < moves.length; i++) {
			var move = moves[i];
			enhancedMoves.push(move); // Always include the basic move

			// Check if this move creates a harmony
			var copyGame = game.getCopy();
			copyGame.runNotationMove(move);

			var harmonyBefore = game.board.harmonyManager.numHarmoniesForPlayer(this.player);
			var harmonyAfter = copyGame.board.harmonyManager.numHarmoniesForPlayer(this.player);

			// If move creates a harmony, add bonus action variants
			if (harmonyAfter > harmonyBefore) {
				// Add variants with bonus plant moves
				var plantBonusVariants = this.generateBonusPlantVariants(copyGame, move);
				enhancedMoves = enhancedMoves.concat(plantBonusVariants);

				// Add variants with bonus arrange moves
				var arrangeBonusVariants = this.generateBonusArrangeVariants(copyGame, move);
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
	 * @returns {SkudPaiShoNotationMove[]} List of all bonus action variant moves
	 */
	generateBonusPlantVariants = function(game, baseMove) {
		var variants = [];
		var tilePile = this.getTilePile(game, this.player);
		var plantableFlowers = [];

		// Collect available basic flowers to plant
		for (var i = 0; i < tilePile.length; i++) {
			if (tilePile[i].type === BASIC_FLOWER) {
				plantableFlowers.push(tilePile[i]);
			}
		}

		if (plantableFlowers.length === 0) {
			return variants; // No flowers left to plant
		}

		// For each plantable flower, generate placement variants
		for (var f = 0; f < plantableFlowers.length; f++) {
			var flower = plantableFlowers[f];
			game.revealOpenGates(this.player, flower, this.moveNum * 2, true);
			var endPoints = this.getPossibleMovePoints(game);

			for (var j = 0; j < endPoints.length; j++) {
				var endPoint = endPoints[j];
				var variant = baseMove.clone ? baseMove.clone() : JSON.parse(JSON.stringify(baseMove));
				
				// Add bonus plant information
				variant.bonusTileCode = flower.code;
				variant.bonusEndPoint = "(" + this.getNotation(endPoint) + ")";
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
	 * @returns {SkudPaiShoNotationMove[]} List of all bonus action variant moves
	 */
	generateBonusArrangeVariants = function(game, baseMove) {
		var variants = [];
		var startPoints = this.getStartPoints(game, this.player);

		// For each tile we can move, generate movement variants
		for (var i = 0; i < startPoints.length && variants.length < 6; i++) {
			var startPoint = startPoints[i];
			game.revealPossibleMovePoints(startPoint, true);
			var endPoints = this.getPossibleMovePoints(game);

			for (var j = 0; j < endPoints.length; j++) {
				var endPoint = endPoints[j];
				var variant = baseMove.clone ? baseMove.clone() : JSON.parse(JSON.stringify(baseMove));
				
				// Add bonus arrange information
				variant.bonusStartPoint = this.getNotation(startPoint);
				variant.bonusEndPoint = "(" + this.getNotation(endPoint) + ")";
				variant.fullMoveText = baseMove.fullMoveText + "+" + this.getNotation(startPoint) + variant.bonusEndPoint;

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
	getTilePile = function(game, player) {
		var tilePile = (player === GUEST) ? game.tileManager.guestTiles : game.tileManager.hostTiles;
		return tilePile;
	};

	/**
	 * Check if there is at least one open gate
	 * @param {SkudPaiShoGameManager} game - Copy of game state
	 * @returns {boolean}
	 */
	isOpenGate = function(game) {
		var cells = game.board.cells;
		for (var row = 0; row < cells.length; row++) {
			for (var col = 0; col < cells[row].length; col++) {
				if (cells[row][col].isOpenGate()) {
					return true;
				}
			}
		}
	};
	
	/**
	 * Get list of all open points on the board with POSSIBLE_MOVE type
	 * @param {SkudPaiShoGameManager} game - Copy of game state
	 * @returns {SkudPaiShoBoardPoint[]}
	 */
	getPossibleMovePoints = function(game) {
		var points = [];
		for (var row = 0; row < game.board.cells.length; row++) {
			for (var col = 0; col < game.board.cells[row].length; col++) {
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
	getNotation = function(boardPoint) {
		return new RowAndColumn(boardPoint.row, boardPoint.col).notationPointString;
	};
	
	/**
	 * Get list of all board points that have a piece owned by the player that is able to move
	 * Include: not accent tile, not drained or trapped
	 * @param {SkudPaiShoGameManager} game - Copy of game state
	 * @param {string} player - Either "HOST" or "GUEST"
	 * @returns {SkudPaiShoBoardPoint[]}
	 */
	getStartPoints = function(game, player) {
		var points = [];
		for (var row = 0; row < game.board.cells.length; row++) {
			for (var col = 0; col < game.board.cells[row].length; col++) {
				var startPoint = game.board.cells[row][col];
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
	 * @returns {string}
	 */
	getOpponent = function() {
		return this.player === GUEST ? HOST : GUEST;
	};
	
}
