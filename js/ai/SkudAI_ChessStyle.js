/**
 * SkudChessAI - A strategic AI for Skud Pai Sho using Chess programming techniques
 *
 * Improvements over SkudStrategicAI:
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

// Constructor
export function SkudChessAI() {
	this.player = null;
	this.moveNum = 0;
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

SkudChessAI.prototype.getMove = function(game, moveNum) {
	this.moveNum = moveNum;

	var moves = this.getPossibleMoves(game, this.player);

	var randomIndex = Math.floor(Math.random() * moves.length);
	var randomMove = moves.splice(randomIndex, 1)[0];

	return randomMove;
};

//
// Helper functions to get all possible moves
//
SkudChessAI.prototype.getPossibleMoves = function(thisGame, player) {
	var moves = [];

	if (this.moveNum === 0) {
		/* First turn is Accent Tile selection */
		this.addAccentSelectionMoves(moves, thisGame, player);
	} else {
		/* Get list of all Planting moves and all Arranging moves */
		this.addPlantMoves(moves, thisGame, player);
		this.addArrangeMoves(moves, thisGame, player);
	}

	return moves;
};

SkudChessAI.prototype.addAccentSelectionMoves = function(moves, game) {
	/* Status: Random, working
	*/

	var tilePile = this.getTilePile(game, this.player);

	var availableAccents = [];

	for (var i = 0; i < tilePile.length; i++) {
		if (tilePile[i].type === ACCENT_TILE) {
			availableAccents.push(tilePile[i]);
		}
	}

	// For now, get random accent tiles
	var chosenAccents = [];

	var length = (simpleCanonRules) ? 2 : 4;

	for (var i = 0; i < length; i++) {
		var chosenIndex = Math.floor(Math.random() * availableAccents.length);
		var randomAccentTile = availableAccents.splice(chosenIndex, 1)[0];
		chosenAccents.push(randomAccentTile.code);
	}

	var move = new SkudPaiShoNotationMove("0" + this.player.charAt(0) + "." + chosenAccents.join());
	moves.push(move);
};

SkudChessAI.prototype.addPlantMoves = function(moves, game, player) {
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

SkudChessAI.prototype.addArrangeMoves = function(moves, game, player) {
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

SkudChessAI.prototype.getTilePile = function(game, player) {
	var tilePile = (player === GUEST) ? game.tileManager.guestTiles : game.tileManager.hostTiles;
	return tilePile;
};

 SkudChessAI.prototype.isOpenGate = function(game) {
	var cells = game.board.cells;
	for (var row = 0; row < cells.length; row++) {
		for (var col = 0; col < cells[row].length; col++) {
			if (cells[row][col].isOpenGate()) {
				return true;
			}
		}
	}
 };
 
 SkudChessAI.prototype.getPossibleMovePoints = function(game) {
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
 
 SkudChessAI.prototype.getNotation = function(boardPoint) {
	return new RowAndColumn(boardPoint.row, boardPoint.col).notationPointString;
 };
 
 SkudChessAI.prototype.getStartPoints = function(game, player) {
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
 