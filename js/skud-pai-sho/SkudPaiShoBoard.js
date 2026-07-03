/* Skud Pai Sho Board */

import {
	ACCENT_TILE,
	BAMBOO,
	BASIC_FLOWER,
	BOAT,
	KNOTWEED,
	LION_TURTLE,
	ORCHID,
	POND,
	ROCK,
	WHEEL,
	WHITE_LOTUS,
	debug,
} from '../GameData';
import {
	boatOnlyMoves,
	lotusNoCapture,
	newKnotweedRules,
	newOrchidVulnerableRule,
	newWheelRule,
	rocksUnwheelable,
	simpleRocks,
	simpleSpecialFlowerRule,
	simplest,
	superRocks,
} from './SkudPaiShoRules';
import { AdevarTileType } from '../adevar/AdevarTile';
import {
	DIAGONAL_MOVEMENT,
	EVERYTHING_CAPTURE,
	IGNORE_CLASHING,
	gameOptionEnabled,
} from '../GameOptions';
import {
	GATE,
	NON_PLAYABLE,
	NEUTRAL,
	POSSIBLE_MOVE,
	SkudPaiShoBoardPoint,
} from './SkudPaiShoBoardPoint';
import {
	GUEST,
	HOST,
	NotationPoint,
	RowAndColumn,
} from '../CommonNotationObjects';
import {
	SkudPaiShoHarmony,
	SkudPaiShoHarmonyManager
} from './SkudPaiShoHarmony';
import { SkudPaiShoTile, WHITE, RED } from './SkudPaiShoTile';
import { SkudPaiShoTileManager } from './SkudPaiShoTileManager';
import { paiShoBoardMaxRowOrCol } from '../pai-sho-common/PaiShoBoardHelp';
import { showBadMoveModal } from '../ModalManager';

// Define the 4 directions: [rowOffset, colOffset]
const DIRECTIONS = [
  [-1, 0], // Up
  [1, 0],  // Down
  [0, -1], // Left
  [0, 1]   // Right
];

export class SkudPaiShoBoard {
	// =========================================================
	// Constructor Functions
	// =========================================================
	constructor() {
		this.size = new RowAndColumn(17, 17);
		this.cells = this.brandNew();

		this.harmonyManager = new SkudPaiShoHarmonyManager();

		this.rockRowAndCols = [];
		this.playedWhiteLotusTiles = [];
		this.winners = [];
	}

	/**
	 * Generates 2D array of SkudPaiShoBoardPoints to fill board
	 * @returns {SkudPaiShoBoardPoint[][]} Cells (2D)
	 */
	brandNew() {
		const cells = [];

		// 0 - Non_Playable, 1 - Gate, 2 - Neutral, 3 - Red, 4 - White,
		// 5 - Red_White, 6 - Red_Neutral, 7 - White_Neutral, 8 - Red_White_Neutral
		const cellPointTypes = [
			[0, 0, 0, 0, 2, 2, 2, 2, 1, 2, 2, 2, 2, 0, 0, 0, 0],
			[0, 0, 0, 2, 2, 2, 2, 2, 8, 2, 2, 2, 2, 2, 0, 0, 0],
			[0, 0, 2, 2, 2, 2, 2, 7, 5, 6, 2, 2, 2, 2, 2, 0, 0],
			[0, 2, 2, 2, 2, 2, 7, 4, 5, 3, 6, 2, 2, 2, 2, 2, 0],
			[2, 2, 2, 2, 2, 7, 4, 4, 5, 3, 3, 6, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 7, 4, 4, 4, 5, 3, 3, 3, 6, 2, 2, 2, 2],
			[2, 2, 2, 7, 4, 4, 4, 4, 5, 3, 3, 3, 3, 6, 2, 2, 2],
			[2, 2, 7, 4, 4, 4, 4, 4, 5, 3, 3, 3, 3, 3, 6, 2, 2],
			[1, 8, 7, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 8, 1],
			[2, 2, 6, 3, 3, 3, 3, 3, 5, 4, 4, 4, 4, 4, 7, 2, 2],
			[2, 2, 2, 6, 3, 3, 3, 3, 5, 4, 4, 4, 4, 7, 2, 2, 2],
			[2, 2, 2, 2, 6, 3, 3, 3, 5, 4, 4, 4, 7, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 6, 3, 3, 5, 4, 4, 7, 2, 2, 2, 2, 2],
			[0, 2, 2, 2, 2, 2, 6, 3, 5, 4, 7, 2, 2, 2, 2, 2, 0],
			[0, 0, 2, 2, 2, 2, 2, 6, 5, 7, 2, 2, 2, 2, 2, 0, 0],
			[0, 0, 0, 2, 2, 2, 2, 2, 8, 2, 2, 2, 2, 2, 0, 0, 0],
			[0, 0, 0, 0, 2, 2, 2, 2, 1, 2, 2, 2, 2, 0, 0, 0, 0]
		]

		for (let row = 0; row < cellPointTypes.length; row++) {
			let thisRow = [];
			for (let col = 0; col < cellPointTypes[row].length; col++){
				const cellPointType = cellPointTypes[row][col]
				let thisCell = new SkudPaiShoBoardPoint();

				// Add relevant types to SkudPaiShoBoardPoint
				if (cellPointType === 0) {
					thisCell.addType(NON_PLAYABLE);
				}
				if (cellPointType === 1) {
					thisCell.addType(GATE);
				}
				if (cellPointType === 2 || cellPointType === 6 || cellPointType === 7 || cellPointType === 8) {
					thisCell.addType(NEUTRAL);
				}
				if (cellPointType === 4 || cellPointType === 5 || cellPointType === 7 || cellPointType === 8) {
					thisCell.addType(WHITE);
				}
				if (cellPointType === 3 || cellPointType === 5 || cellPointType === 6 || cellPointType === 8) {
					thisCell.addType(RED);
				}

				thisCell.row = row;
				thisCell.col = col;
				thisRow.push(thisCell);
			}
			cells.push(thisRow);
		}

		return cells;
	}

	// =========================================================
	// Tile Placement Functions
	// =========================================================

	/**
	 * Main function to handle placing tile on board
	 * @param {SkudPaiShoTile} tile - Tile to be placed
	 * @param {NotationPoint} notationPoint - Contains row and column to place tile
	 * @param {SkudPaiShoTileManager} tileManager
	 * @param {NotationPoint} extraBoatPoint - Optional extra point where a boat moved a tile to
	 * @returns {?Object<string, SkudPaiShoTile>} - Optional tile removed by boat
	 */
	placeTile(tile, notationPoint, tileManager, extraBoatPoint) {
		let tileRemovedWithBoat;

		if (tile.type === ACCENT_TILE) {
			if (tile.accentType === ROCK) {
				this.placeRock(tile, notationPoint);
			} else if (tile.accentType === WHEEL) {
				this.placeWheel(tile, notationPoint);
			} else if (tile.accentType === KNOTWEED) {
				this.placeKnotweed(tile, notationPoint);
			} else if (tile.accentType === BOAT) {
				tileRemovedWithBoat = this.placeBoat(tile, notationPoint, extraBoatPoint);
			} else if (tile.accentType === BAMBOO) {
				this.placeBamboo(tile, notationPoint, false, tileManager);
			} else if (tile.accentType === POND) {
				this.placePond(tile, notationPoint);
			} else if (tile.accentType === LION_TURTLE) {
				this.placeLionTurtle(tile, notationPoint);
			}
		} else {
			// Don't need any special effects when placing flowers
			const point = this.cells[notationPoint.rowAndColumn.row][notationPoint.rowAndColumn.col];
			point.putTile(tile);
			if (tile.specialFlowerType === WHITE_LOTUS) {
				this.playedWhiteLotusTiles.push(tile);
			}
		}
		// Things to do after a tile is placed
		this.flagAllTrappedAndDrainedTiles();
		this.analyzeHarmonies();

		if (tile.accentType === BOAT) {
			return {
				tileRemovedWithBoat: tileRemovedWithBoat
			};
		}
	}

	/**
	 * General check if accent tile can be placed on point
	 * @param {SkudPaiShoBoardPoint} boardPoint - Target point for accent tile
	 * @returns {boolean}
	 */
	canPlaceAccent(boardPoint) {
		return !boardPoint.hasTile() && !boardPoint.isType(GATE);
	}

	/**
	 * Specific function for placing rock tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for rock tile
	 * @returns {boolean}
	 */
	placeRock(tile, notationPoint) {
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		if (!this.canPlaceAccent(boardPoint)) return false;

		if (!boardPoint.isType(GATE)) {
			boardPoint.putTile(tile);
			this.rockRowAndCols.push(rowAndCol);
		}
	}

	/**
	 * Check if wheel can be placed on point
	 * @param {SkudPaiShoBoardPoint} boardPoint - Target point for wheel tile
	 * @returns {boolean}
	 */
	canPlaceWheel(boardPoint) {
		if (!this.canPlaceAccent(boardPoint)) return false;

		// get surrounding RowAndColumn values
		const rowCols = this.getSurroundingRowAndCols(boardPoint);

		// Validate.. Wheel must not be next to a Gate, create Clash, or move tile off board

		for (let i = 0; i < rowCols.length; i++) {
			const bp = this.cells[rowCols[i].row][rowCols[i].col];
			if (bp.isType(GATE) && !newWheelRule) {
				// debug("Wheel cannot be played next to a GATE");
				return false;
			} else if (!newKnotweedRules && bp.hasTile() && (bp.tile.drained || bp.tile.accentType === KNOTWEED)) {
				// debug("wheel cannot be played next to drained tile or Knotweed");
				return false;
			} else if (newWheelRule) {
				if (bp.isType(GATE) && bp.hasTile()) {
					return false;	// Can't play Wheel next to Gate if Blooming tile
				}
			}

			if (rocksUnwheelable || simplest) {
				if (bp.hasTile() && bp.tile.accentType === ROCK) {
					return false; 	// Can't play Wheel next to Rock
				}
			}

			if (superRocks && bp.hasTile()) {
				// Tiles surrounding Rock cannot be moved by Wheel
				const moreRowCols = this.getSurroundingRowAndCols(bp);
				for (let j = 0; j < moreRowCols.length; j++) {
					const otherBp = this.cells[moreRowCols[j].row][moreRowCols[j].col];
					if (otherBp.hasTile() && otherBp.tile.accentType === ROCK) {
						return false;
					}
				}
			}

			// If a tile would be affected, verify the target
			if (bp.hasTile()) {
				const targetRowCol = this.getClockwiseRowCol(boardPoint, rowCols[i]);
				if (this.isValidRowCol(targetRowCol)) {
					const targetBp = this.cells[targetRowCol.row][targetRowCol.col];
					if (!targetBp.canHoldTile(bp.tile, true)) {
						return false;
					}
				} else {
					return false;	// Would move tile off board, no good
				}
			}
		}

		// Does it create Disharmony?
		if (!gameOptionEnabled(IGNORE_CLASHING)) {
			const newBoard = this.getCopy();
			const notationPoint = new NotationPoint(new RowAndColumn(boardPoint.row, boardPoint.col).notationPointString);
			newBoard.placeWheel(new SkudPaiShoTile('W', 'G'), notationPoint, true);
			if (newBoard.moveCreatesDisharmony(boardPoint, boardPoint)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Specific function for placing wheel tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for wheel tile
	 * @param {boolean} ignoreCheck - Ignore wheel placement rules
	 * @returns {boolean}
	 */
	placeWheel(tile, notationPoint, ignoreCheck) {
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		// get surrounding RowAndColumn values
		const rowCols = this.getSurroundingRowAndCols(rowAndCol);

		if (!ignoreCheck && !this.canPlaceWheel(boardPoint)) {
			return false;
		}

		boardPoint.putTile(tile);

		// Perform rotation: Get results, then place all tiles as needed
		const results = [];
		for (let i = 0; i < rowCols.length; i++) {
			// Save tile and target rowAndCol
			const tile = this.cells[rowCols[i].row][rowCols[i].col].removeTile();
			const targetRowCol = this.getClockwiseRowCol(rowAndCol, rowCols[i]);
			if (this.isValidRowCol(targetRowCol)) {
				results.push([tile, targetRowCol]);
			}
		}

		// go through and place tiles in target points
		const self = this;
		results.forEach(function(result) {
			const bp = self.cells[result[1].row][result[1].col];
			bp.putTile(result[0]);
		});

		this.refreshRockRowAndCols();
	}

	/**
	 * Check if knotweed can be placed on point
	 * @param {SkudPaiShoBoardPoint} boardPoint - Target point for knotweed tile
	 * @returns {boolean}
	 */
	canPlaceKnotweed(boardPoint) {
		if (!this.canPlaceAccent(boardPoint)) return false;

		if (!newKnotweedRules) {
			// Knotweed can be placed next to Gate in new knotweed rules
			const rowCols = this.getSurroundingRowAndCols(boardPoint);

			// Validate: Must not be played next to Gate
			for (let i = 0; i < rowCols.length; i++) {
				const bp = this.cells[rowCols[i].row][rowCols[i].col];
				if (bp.isType(GATE)) {
					// debug("Knotweed cannot be played next to a GATE");
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Specific function for placing knotweed tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for knotweed tile
	 * @returns {boolean}
	 */
	placeKnotweed(tile, notationPoint) {
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		const rowCols = this.getSurroundingRowAndCols(rowAndCol);

		if (!this.canPlaceKnotweed(boardPoint)) {
			return false;
		}

		// Place tile
		boardPoint.putTile(tile);

		// "Drain" surrounding tiles
		for (let i = 0; i < rowCols.length; i++) {
			const bp = this.cells[rowCols[i].row][rowCols[i].col];
			bp.drainTile();
		}
	}

	/**
	 * Check if boat can be placed on point
	 * @param {SkudPaiShoBoardPoint} boardPoint - Target point for knotweed tile
	 * @param {SkudPaiShoTile} tile - Tile that boat is played on top of
	 * @returns {boolean}
	 */
	canPlaceBoat(boardPoint, tile) {
		if (!boardPoint.hasTile() || boardPoint.isType(GATE)) return false; // Boat must always be played over another tile

		if (boardPoint.tile.type === ACCENT_TILE && !boatOnlyMoves) {
			if (boardPoint.tile.accentType !== KNOTWEED && !simplest && !rocksUnwheelable) {
				if (rocksUnwheelable && boardPoint.tile.accentType !== ROCK) {
					return false;
				} else if (!rocksUnwheelable) {
					// debug("Not played on Knotweed tile");
					return false;
				}
			} else if (!gameOptionEnabled(IGNORE_CLASHING)) {
				// Ensure no Disharmony
				const newBoard = this.getCopy();
				const notationPoint = new NotationPoint(new RowAndColumn(boardPoint.row, boardPoint.col).notationPointString);
				newBoard.placeBoat(new SkudPaiShoTile('B', 'G'), notationPoint, boardPoint, true);
				const newBoardPoint = newBoard.cells[boardPoint.row][boardPoint.col];
				if (newBoard.moveCreatesDisharmony(newBoardPoint, newBoardPoint)) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Specific function for placing boat tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for boat tile
	 * @param {NotationPoint} extraBoatPoint - Optional extra point where boat is moving tile to
	 * @param {boolean} ignoreCheck - Ignore boat placement rules
	 * @returns {?SkudPaiShoTile} - Optional tile removed by boat
	 */
	placeBoat(tile, notationPoint, extraBoatPoint, ignoreCheck) {
		// debug("extra boat point:");
		// debug(extraBoatPoint);
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		let tileRemovedWithBoat;

		if (!ignoreCheck && !this.canPlaceBoat(boardPoint, tile)) {
			return false;
		}

		if (boardPoint.tile.type === ACCENT_TILE && !boatOnlyMoves) {
			// Validated as Knotweed

			// Options for Boat behavior. Uncomment ONE

			// This line replaces the Knotweed with the Boat
			//boardPoint.putTile(tile);

			// This line follows the actual current rule: Both removed from board
			tileRemovedWithBoat = boardPoint.removeTile();

			const rowCols = this.getSurroundingRowAndCols(rowAndCol);
			// "Restore" surrounding tiles
			for (let i = 0; i < rowCols.length; i++) {
				const bp = this.cells[rowCols[i].row][rowCols[i].col];
				bp.restoreTile();
			}

			if (rocksUnwheelable) {
				this.refreshRockRowAndCols();
			}
		} else {
			// Can't move a tile to where it can't normally go
			const bpRowCol = extraBoatPoint.rowAndColumn;
			const destBoardPoint = this.cells[bpRowCol.row][bpRowCol.col];

			if (!destBoardPoint.canHoldTile(boardPoint.tile)) {
				debug("Boat cannot move that tile there!");
				return false;
			}

			destBoardPoint.putTile(boardPoint.removeTile());
			boardPoint.putTile(tile);
		}

		return tileRemovedWithBoat;
	}

	/**
	 * Check if bamboo can be placed on point
	 * @param {SkudPaiShoBoardPoint} boardPoint - Target point for bamboo tile
	 * @param {SkudPaiShoTile} tile - Tile that boat is played on top of
	 * @returns {boolean}
	 */
	canPlaceBamboo(boardPoint, tile) {
		if (!this.canPlaceAccent(boardPoint)) return false;

		// Does it create Disharmony?
		if (!gameOptionEnabled(IGNORE_CLASHING)) {
			const newBoard = this.getCopy();
			const notationPoint = new NotationPoint(new RowAndColumn(boardPoint.row, boardPoint.col).notationPointString);
			newBoard.placeBamboo(new SkudPaiShoTile('M', 'G'), notationPoint, true);
			if (newBoard.moveCreatesDisharmony(boardPoint, boardPoint)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Specific function for placing bamboo tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for bamboo tile
	 * @param {boolean} ignoreCheck - Ignore bamboo placement rules
	 * @param {SkudPaiShoTileManager} tileManager
	 * @returns {boolean}
	 */
	placeBamboo(tile, notationPoint, ignoreCheck, tileManager) {
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		if (!ignoreCheck && !this.canPlaceBamboo(boardPoint, tile)) {
			return false;
		}

		// Option 1: Play on top of tile, return to hand
		// Option 2: All surrounding tiles returned to hand.. crazy, let's try it

		// Place tile
		boardPoint.putTile(tile);

		const rowCols = this.getSurroundingRowAndCols(rowAndCol);

		let surroundsOwnersFlowerTile = false;
		let surroundsGrowingFlower = false;
		for (let i = 0; i < rowCols.length; i++) {
			const bp = this.cells[rowCols[i].row][rowCols[i].col];
			if (!bp.isType(GATE)
				&& bp.hasTile()
				&& bp.tile.ownerName === tile.ownerName
				&& bp.tile.type !== ACCENT_TILE) {
				surroundsOwnersFlowerTile = true;
			} else if (bp.isType(GATE) && bp.hasTile()) {
				surroundsGrowingFlower = true;
			}
		}

		// Setting these will make it work the old way
		// surroundsOwnersFlowerTile = true;
		// surroundsGrowingFlower = false;

		// Return each tile to hand if surrounds Owner's Blooming Flower Tile and no Growing Flowers
		if (surroundsOwnersFlowerTile && !surroundsGrowingFlower) {
			for (let i = 0; i < rowCols.length; i++) {
				const bp = this.cells[rowCols[i].row][rowCols[i].col];
				if (bp.hasTile()) {
					// Put it back
					const removedTile = bp.removeTile();
					if (tileManager) {
						tileManager.putTileBack(removedTile);
					}
				}
			}
		}

		this.refreshRockRowAndCols();
	}

	/**
	 * Specific function for placing pond tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for pond tile
	 * @param {boolean} ignoreCheck - Ignore pond placement rules
	 * @returns {boolean}
	 */
	placePond(tile, notationPoint, ignoreCheck) {
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		if (!ignoreCheck && !this.canPlaceAccent(boardPoint)) return false;

		// Place tile
		boardPoint.putTile(tile);
	}

	/**
	 * Specific function for placing lion turtle tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for lion turtle tile
	 * @param {boolean} ignoreCheck - Ignore lion turtle placement rules
	 * @returns {boolean}
	 */
	placeLionTurtle(tile, notationPoint, ignoreCheck) {
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		if (!ignoreCheck && !this.canPlaceAccent(boardPoint)) return false;

		// Place tile
		boardPoint.putTile(tile);
	}

	// =========================================================
	// Tile Placement Undo Functions
	// =========================================================

	/**
	 * Main function to handle undo placing tile on board
	 * @param {NotationPoint} endpoint - Contains row and column where tile was originally placed
	 * @param {SkudPaiShoTileManager} tileManager
	 * @param {NotationPoint} extraBoatPoint - Optional extra point where a boat moved a tile to
	 * @returns {?Object<string, SkudPaiShoTile>} - Optional tile removed by boat
	 */
	undoPlaceTile(endPoint, tileManager, extraBoatPoint, tileRemovedWithBoat) {
		const tile = this.cells[endPoint.rowAndColumn.row][endPoint.rowAndColumn.col].removeTile();
		// If undoing boat, may not have tile in endpoint if used to remove accent tile
		if (tile !== null) {
			tileManager.putTileBack(tile);
		}

		if (tile.type === ACCENT_TILE) {
			if (tile.accentType === ROCK) {
				this.undoPlaceRock(tile, notationPoint);
			} else if (tile.accentType === WHEEL) {
				this.undoPlaceWheel(tile, notationPoint);
			} else if (tile.accentType === KNOTWEED) {
				this.undoPlaceKnotweed(tile, notationPoint);
			} else if (tile.accentType === BOAT) {
				this.undoPlaceBoat(tile, notationPoint, extraBoatPoint, tileRemovedWithBoat);
			// TODO: Add undo functions for other accent tiles if we want AI to work on expansion
			} else if (tile.accentType === BAMBOO) {
				debug("AI undo moves currently doesn't work with expansion using Bamboo")
			} else if (tile.accentType === POND) {
				debug("AI undo moves currently doesn't work with expansion using Pond")
			} else if (tile.accentType === LION_TURTLE) {
				debug("AI undo moves currently doesn't work with expansion using Lion Turtle")
			}
		} else if (tile.specialFlowerType === WHITE_LOTUS) {
			const rowColIdx = this.playedWhiteLotusTiles.findIndex(lotusTile => lotusTile.id === tile.id)
			if (rowColIdx === -1) {
				console.error("Tried to undo lotus tile that didn't exist:", tile)
			} else {
				this.playedWhiteLotusTiles.splice(rowColIdx, 1);
			}
		}
		// Things to do after a tile is undone
		this.flagAllTrappedAndDrainedTiles();
		this.analyzeHarmonies();
	}

	/**
	 * Specific function for undoing placing rock tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for rock tile
	 */
	undoPlaceRock(tile, notationPoint) {
		const rowAndCol = notationPoint.rowAndColumn;

		const rowColIdx = this.rockRowAndCols.findIndex(rockRowCol => (rockRowCol.row === rowAndCol.row && rockRowCol.col === rowAndCol.col))
		if (rowColIdx === -1) {
			console.error("Tried to undo rock that didn't exist at:", notationPoint.pointText)
		} else {
			this.rockRowAndCols.splice(rowColIdx, 1);
		}
	}

	/**
	 * Specific function for undoing placing wheel tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for wheel tile
	 */
	undoPlaceWheel(tile, notationPoint) {
		const rowAndCol = notationPoint.rowAndColumn;
		const rowCols = this.getSurroundingRowAndCols(rowAndCol); // Get surrounding RowAndColumn values

		// Perform rotation: Get results, then place all tiles as needed
		const results = [];
		for (let i = 0; i < rowCols.length; i++) {
			// Save tile and target rowAndCol
			const tile = this.cells[rowCols[i].row][rowCols[i].col].removeTile();
			const targetRowCol = this.getCounterclockwiseRowCol(rowAndCol, rowCols[i]);
			if (this.isValidRowCol(targetRowCol)) {
				results.push([tile, targetRowCol]);
			}
		}

		// Go through and place tiles in target points
		const self = this;
		results.forEach(function(result) {
			const bp = self.cells[result[1].row][result[1].col];
			bp.putTile(result[0]);
		});

		this.refreshRockRowAndCols();
	}

	/**
	 * Specific function for undoing placing knotweed tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for knotweed tile
	 */
	undoPlaceKnotweed(tile, notationPoint) {
		const rowAndCol = notationPoint.rowAndColumn;
		const rowCols = this.getSurroundingRowAndCols(rowAndCol);

		// Undo "Drain" on surrounding tiles
		for (let i = 0; i < rowCols.length; i++) {
			const bp = this.cells[rowCols[i].row][rowCols[i].col];
			bp.restoreTile();
		}
	}

	/**
	 * Specific function for undoing placing boat tile
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} notationPoint - Target point for boat tile
	 * @param {NotationPoint} extraBoatPoint - Optional extra point where a boat moved a tile to
	 * @param {SkudPaiShoTile} tileRemovedWithBoat - Optional tile removed by boat
	 */
	undoPlaceBoat(tile, notationPoint, extraBoatPoint, tileRemovedWithBoat) {
		// debug("Extra boat point:", extraBoatPoint);
		const rowAndCol = notationPoint.rowAndColumn;
		const boardPoint = this.cells[rowAndCol.row][rowAndCol.col];

		// Must have either used boat to move tile or remove accent tile
		if (extraBoatPoint instanceof NotationPoint) {
			const bpRowCol = extraBoatPoint.rowAndColumn;
			const shiftedBoardPoint = this.cells[bpRowCol.row][bpRowCol.col];

			boardPoint.putTile(shiftedBoardPoint.removeTile());
		} else if (tileRemovedWithBoat instanceof SkudPaiShoTile) {
			boardPoint.putTile(tileRemovedWithBoat);

			const rowCols = this.getSurroundingRowAndCols(rowAndCol);
			// "Restore" surrounding tiles
			for (let i = 0; i < rowCols.length; i++) {
				const bp = this.cells[rowCols[i].row][rowCols[i].col];
				bp.restoreTile();
			}

			if (rocksUnwheelable) {
				this.refreshRockRowAndCols();
			}
		}
	}

	// =========================================================
	// Tile Placement Helper Functions
	// =========================================================

	/**
	 * Check if point is within bounds of board
	 * @param {RowAndColumn} rowCol
	 * @returns {boolean}
	 */
	isValidRowCol(rowCol) {
		return rowCol.row >= 0 && rowCol.col >= 0 && rowCol.row <= 16 && rowCol.col <= 16;
	}

	/**
	 * Gets clockwise movement position from placing wheel tile
	 * @param {RowAndColumn} center - Center point where wheel is placed
	 * @param {RowAndColumn} rowCol - Starting position of tile to be moved
	 * @returns {RowAndColumn} Ending position of tile to be moved
	 */
	getClockwiseRowCol(center, rowCol) {
		if (rowCol.row < center.row && rowCol.col <= center.col) {
			return new RowAndColumn(rowCol.row, rowCol.col + 1);
		} else if (rowCol.col > center.col && rowCol.row <= center.row) {
			return new RowAndColumn(rowCol.row + 1, rowCol.col);
		} else if (rowCol.row > center.row && rowCol.col >= center.col) {
			return new RowAndColumn(rowCol.row, rowCol.col - 1);
		} else if (rowCol.col < center.col && rowCol.row >= center.row) {
			return new RowAndColumn(rowCol.row - 1, rowCol.col);
		} else {
			debug("ERROR CLOCKWISE CALCULATING");
		}
	}

	/**
	 * Gets counterclockwise movement position for undoing wheel tile
	 * @param {RowAndColumn} center - Center point where wheel is placed
	 * @param {RowAndColumn} rowCol - Starting position of tile to be moved
	 * @returns {RowAndColumn} Ending position of tile to be moved
	 */
	getCounterclockwiseRowCol(center, rowCol) {
		if (rowCol.row < center.row && rowCol.col >= center.col) {
			return new RowAndColumn(rowCol.row, rowCol.col - 1);
		} else if (rowCol.col > center.col && rowCol.row >= center.row) {
			return new RowAndColumn(rowCol.row - 1, rowCol.col);
		} else if (rowCol.row > center.row && rowCol.col <= center.col) {
			return new RowAndColumn(rowCol.row, rowCol.col + 1);
		} else if (rowCol.col < center.col && rowCol.row <= center.row) {
			return new RowAndColumn(rowCol.row + 1, rowCol.col);
		} else {
			debug("ERROR COUNTERCLOCKWISE CALCULATING");
		}
	}

	/**
	 * Gets array of positions adjacent to given rowAndCol, used for various accent tile abilities
	 * @param {RowAndColumn} rowAndCol - Center point where accent tile is placed
	 * @returns {RowAndColumn[]} Surrounding RowAndColumn positions
	 */
	getSurroundingRowAndCols(rowAndCol) {
		const rowAndCols = [];
		for (let row = rowAndCol.row - 1; row <= rowAndCol.row + 1; row++) {
			for (let col = rowAndCol.col - 1; col <= rowAndCol.col + 1; col++) {
				if (row === rowAndCol.row && col === rowAndCol.col) continue;	// Skip given center point
				if (row < 0 || col < 0 || row >= 17 || col >= 17) continue;	// Skip points outside range of the grid

				const boardPoint = this.cells[row][col];
				if (boardPoint.isType(NON_PLAYABLE)) continue;	// Skip non-playable points

				rowAndCols.push(new RowAndColumn(row, col));
			}
		}
		return rowAndCols;
	}

	/** Refresh rows and columns where harmonies are blocked by rock tiles */
	refreshRockRowAndCols() {
		this.rockRowAndCols = [];
		const self = this;

		this.cells.forEach(function(row) {
			row.forEach(function(boardPoint) {
				if (boardPoint.hasTile() && boardPoint.tile.accentType === ROCK) {
					self.rockRowAndCols.push(boardPoint);
				}
			});
		});
	}

	/**
	 * Check if point is open gate where flower can be played
	 * @param {NotationPoint} notationPoint
	 * @returns {boolean}
	 */
	pointIsOpenGate(notationPoint) {
		let point = notationPoint.rowAndColumn;
		point = this.cells[point.row][point.col];

		return point.isOpenGate() || this.pointIsOpenAndSurroundsPond(point);
	}

	/**
	 * Check if point has no tile and is adjacent to pond
	 * @param {SkudPaiShoBoardPoint} boardPoint - Planting tile position
	 * @returns {boolean}
	 */
	pointIsOpenAndSurroundsPond(boardPoint) {
		if (boardPoint.hasTile()) {
			return false;
		}
		const rowCols = this.getSurroundingRowAndCols(boardPoint);
		for (const rowCol of rowCols) {
			const surroundingPoint = this.cells[rowCol.row][rowCol.col];
			if (surroundingPoint.hasTile() && surroundingPoint.tile.accentType === POND) {
				return true;
			}
		}
		return false;
	}

	// =========================================================
	// Tile Movement Functions
	// =========================================================

	/**
	 * Move tile from one spot to another, checking if move is allowed
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {NotationPoint} notationPointStart - Start point of moving tile
	 * @param {NotationPoint} notationPointEnd - End point of moving tile
	 * @param {boolean} doIgnoreMoveRules - Used for undoing moves to allow moving back into gate
	 * @returns {boolean | Object} False if move isn't allowed; if valid move, gives object with bonusAllowed, movedTile, capturedTile
	 */
	moveTile(player, notationPointStart, notationPointEnd, doIgnoreMoveRules = false) {
		const startRowCol = notationPointStart.rowAndColumn;
		const endRowCol = notationPointEnd.rowAndColumn;

		if (!this.isValidRowCol(startRowCol) || !this.isValidRowCol(endRowCol)) {
			debug("That point does not exist. So it's not gonna happen.");
			return false;
		}

		const boardPointStart = this.cells[startRowCol.row][startRowCol.col];
		const boardPointEnd = this.cells[endRowCol.row][endRowCol.col];

		if (!this.canMoveTileToPoint(player, boardPointStart, boardPointEnd)
			&& !gameOptionEnabled(DIAGONAL_MOVEMENT)
			&& !doIgnoreMoveRules) {
			debug("Bad move bears");
			showBadMoveModal();
			return false;
		}

		const tile = boardPointStart.removeTile();
		const capturedTile = boardPointEnd.tile;

		if (!tile) {
			debug("Error: No tile to move!");
		}

		const error = boardPointEnd.putTile(tile);

		if (error) {
			debug("Error moving tile. It probably didn't get moved.");
			return false;
		}

		// Check for tile "trapped" by opponent Orchid
		this.flagAllTrappedAndDrainedTiles();

		if (gameOptionEnabled(EVERYTHING_CAPTURE)) {
			this.refreshRockRowAndCols();
		}

		// Check for harmonies
		const newHarmony = this.hasNewHarmony(player, tile, startRowCol, endRowCol);

		return {
			bonusAllowed: newHarmony,
			movedTile: tile,
			capturedTile: capturedTile
		}
	}

	/** Refreshes if all SkudPaiShoBoardPoints are trapped by orchid or drained by knotweed */
	flagAllTrappedAndDrainedTiles() {
		// First, untrap
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				const bp = this.cells[row][col];
				if (bp.hasTile()) {
					bp.tile.trapped = false;
					if (newKnotweedRules) {
						bp.tile.drained = false;
					}
				}
			}
		}
		// Find Orchid/Knotweed tiles, then check surrounding opposite-player Basic Flower tiles and flag them
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				const bp = this.cells[row][col];
				if (!bp.hasTile()) continue;
				if (!bp.isType(GATE)) {
					this.trapTilesSurroundingPointIfNeeded(bp);
				}
				if (newKnotweedRules) {
					this.drainTilesSurroundingPointIfNeeded(bp);
				}
			}
		}
	}

	/**
	 * Set all surrounding SkudPaiShoBoardPoints to drained if boardPoint contains knotweed
	 * @param {SkudPaiShoBoardPoint} boardPoint
	 */
	drainTilesSurroundingPointIfNeeded(boardPoint) {
		if (!newKnotweedRules) return; // Knotweed traps instead of draining with old knotweed rules
		if (boardPoint.tile.accentType !== KNOTWEED) return;

		// Get surrounding RowAndColumn values
		const rowCols = this.getSurroundingRowAndCols(boardPoint);

		for (const rowCol of rowCols) {
			const bp = this.cells[rowCol.row][rowCol.col];
			if (bp.hasTile() && !bp.isType(GATE) && bp.tile.type !== ACCENT_TILE && bp.tile.specialFlowerType !== ORCHID) {
				bp.tile.drained = true;
			}
		}
	}

	/**
	 * Set all surrounding SkudPaiShoBoardPoints to trapped if boardPoint contains orchid
	 * @param {SkudPaiShoBoardPoint} boardPoint
	 */
	trapTilesSurroundingPointIfNeeded(boardPoint) {
		if (boardPoint.tile.specialFlowerType !== ORCHID) return;

		const orchidOwner = boardPoint.tile.ownerName;

		// Get surrounding RowAndColumn values
		const rowCols = this.getSurroundingRowAndCols(boardPoint);

		for (const rowCol of rowCols) {
			const bp = this.cells[rowCol.row][rowCol.col];
			if (bp.hasTile() && !bp.isType(GATE)) {
				if (bp.tile.ownerName !== orchidOwner && bp.tile.type !== ACCENT_TILE) {
					bp.tile.trapped = true;
				}
			}
		}
	}

	/**
	 * Check if white lotus tile is protected from being captured
	 * @param {SkudPaiShoTile} lotusTile
	 * @returns {boolean}
	 */
	whiteLotusProtected(lotusTile) {
		// Check if ruleset ever allows white lotus to be captured
		if (lotusNoCapture || simplest || simpleSpecialFlowerRule) return true;

		// Testing Lotus never protected:
		return false;

		// ----------- //

		// Protected if: player also has Blooming Orchid 
		let isProtected = false;
		this.cells.forEach(function(row) {
			row.forEach(function(boardPoint) {
				if (boardPoint.hasTile() && boardPoint.tile.specialFlowerType === ORCHID
					&& boardPoint.tile.ownerName === lotusTile.ownerName
					&& !boardPoint.isType(GATE)) {
					isProtected = true;
				}
			});
		});
		return isProtected;
	}

	/**
	 * Check if orchid tile can capture (player has blooming white lotus)
	 * @param {SkudPaiShoTile} orchidTile
	 * @returns {boolean}
	 */
	orchidCanCapture(orchidTile) {
		// Check if current ruleset ever allows orchid capture
		if (simpleSpecialFlowerRule || simplest) return false;

		// Note: This method does not check if other tile is protected from capture.
		let orchidCanCapture = false;
		this.cells.forEach(function(row) {
			row.forEach(function(boardPoint) {
				if (boardPoint.hasTile() && boardPoint.tile.specialFlowerType === WHITE_LOTUS
					&& boardPoint.tile.ownerName === orchidTile.ownerName
					&& !boardPoint.isType(GATE)) {
					orchidCanCapture = true;
				}
			});
		});
		return orchidCanCapture;
	}

	/**
	 * Check if orchid tile can be captured
	 * @param {SkudPaiShoTile} orchidTile
	 * @returns {boolean}
	 */
	orchidVulnerable(orchidTile) {
		if (newOrchidVulnerableRule) {
			let orchidVulnerable = false;
			// Orchid vulnerable if opponent White Lotus is on board
			this.cells.forEach(function(row) {
				row.forEach(function(boardPoint) {
					if (boardPoint.hasTile() && boardPoint.tile.specialFlowerType === WHITE_LOTUS
						&& boardPoint.tile.ownerName !== orchidTile.ownerName) {
						orchidVulnerable = true;
					}
				});
			});
			return orchidVulnerable;
		}

		if (simpleSpecialFlowerRule) {
			return true;	// Simplest? Always vulnerable.
		}

		if (lotusNoCapture || simplest) {
			// Changing Orchid vulnerable when player has a Blooming Lotus
			let orchidVulnerable = false;
			this.cells.forEach(function(row) {
				row.forEach(function(boardPoint) {
					if (!boardPoint.isType(GATE) && boardPoint.hasTile() && boardPoint.tile.specialFlowerType === WHITE_LOTUS
						&& boardPoint.tile.ownerName === orchidTile.ownerName) {
						orchidVulnerable = true;
					}
				});
			});
			return orchidVulnerable;
		}

		/* ======= Original Rules: ======= */

		let orchidVulnerable = false;
		this.playedWhiteLotusTiles.forEach(function(lotus) {
			if (lotus.ownerName === orchidTile.ownerName) {
				orchidVulnerable = true;
			}
		});
		if (orchidVulnerable) {
			return true;
		}
	}

	/**
	 * Check if tile in start point can capture tile in end point
	 * @param {SkudPaiShoBoardPoint} boardPointStart - Start point of capturing tile
	 * @param {SkudPaiShoBoardPoint} boardPointEnd - End point of tile to capture
	 * @returns {boolean}
	 */
	canCapture(boardPointStart, boardPointEnd) {
		if (gameOptionEnabled(EVERYTHING_CAPTURE)) return true;

		const tile = boardPointStart.tile;
		const otherTile = boardPointEnd.tile;

		// Player cannot capture their own tiles
		if (tile.ownerName === otherTile.ownerName) return false;

		// Does end point surround Bamboo? Cannot capture tiles surrounding Bamboo
		const surroundingRowCols = this.getSurroundingRowAndCols(boardPointEnd);
		for (const surroundingRowCol of surroundingRowCols) {
			const surroundingPoint = this.cells[surroundingRowCol.row][surroundingRowCol.col];
			if (surroundingPoint.hasTile() && surroundingPoint.tile.accentType === BAMBOO) return false;
		}

		// Is tile Orchid that can capture? If so, Orchid can capture basic or special flower
		if (tile.specialFlowerType === ORCHID && otherTile.type !== ACCENT_TILE && this.orchidCanCapture(tile)) {
			return true;
		}

		// Check otherTile White Lotus protected from capture
		if (otherTile.specialFlowerType === WHITE_LOTUS) {
			if (this.whiteLotusProtected(otherTile)) {
				return false;	// Cannot capture otherTile any way at all
			} else if (tile.type === BASIC_FLOWER) {
				return true;	// If Lotus not protected, basic flower captures. Orchid handled in Orchid checks
			}
		}

		// Clashing Basic Flowers check
		if (tile.clashesWith(otherTile)) return true;

		// Orchid checks
		// Can otherTile Orchid be captured?
		// If vulnerable, it can be captured by any flower tile
		if (otherTile.specialFlowerType === ORCHID && tile.type !== ACCENT_TILE && this.orchidVulnerable(otherTile)) {
			return true;
		}
	}

	/**
	 * Check if tile in start point can move to end point
	 * @param {string} player - Player can only move their own tiles
	 * @param {SkudPaiShoBoardPoint} boardPointStart - Start point of moving tile
	 * @param {SkudPaiShoBoardPoint} boardPointEnd - End point of moving tile
	 * @param {boolean} isTeleport - Ignore checking if tile has enough movement spaces to get to end point
	 * @returns {boolean}
	 */
	canMoveTileToPoint(player, boardPointStart, boardPointEnd, isTeleport = false) {
		// Start point must have a tile
		if (!boardPointStart.hasTile()) {
			debug("canMoveTileToPoint: Start point has no tile");
			return false;
		// Tile must belong to player
		} else if (boardPointStart.tile.ownerName !== player) {
			debug("canMoveTileToPoint: Tile does not belong to player (owner: " + boardPointStart.tile.ownerName + ", player: " + player + ")");
			return false;
		// Cannot move trapped tile or drained tile with old knotweed rules
		} else if (boardPointStart.tile.trapped) {
			debug("canMoveTileToPoint: Tile is trapped");
			return false;
		} else if (!newKnotweedRules && boardPointStart.tile.drained) {
			debug("canMoveTileToPoint: Tile is drained (old knotweed rules)");
			return false;
		// If endpoint is a Gate, that's wrong.
		} else if (boardPointEnd.isType(GATE)) {
			debug("canMoveTileToPoint: Cannot move to a Gate");
			return false;
		}

		// Check if move results in valid capture
		let canCapture = false;
		if (boardPointEnd.hasTile()) {
			canCapture = this.canCapture(boardPointStart, boardPointEnd);
		}

		// If endpoint has a tile there that can't be captured, that is wrong.
		if (boardPointEnd.hasTile() && !canCapture) {
			debug("canMoveTileToPoint: Endpoint has a tile that cannot be captured");
			return false;
		// Can't allow capture because moving to end position would break a rule (ex. trying to move to wrong garden color)
		} else if (!boardPointEnd.canHoldTile(boardPointStart.tile, canCapture)) {
			debug("canMoveTileToPoint: Endpoint cannot hold this tile");
			return false;
		}

		if (!isTeleport) {
			// If endpoint is too far away, that is wrong.
			const numMoves = boardPointStart.tile.getMoveDistance();
			if (Math.abs(boardPointStart.row - boardPointEnd.row) + Math.abs(boardPointStart.col - boardPointEnd.col) > numMoves) {
				debug("canMoveTileToPoint: Endpoint is too far away (distance: " + (Math.abs(boardPointStart.row - boardPointEnd.row) + Math.abs(boardPointStart.col - boardPointEnd.col)) + ", max moves: " + numMoves + ")");
				return false;
			} else {
				// Move may be possible. But there may be tiles in the way...
				if (!this.verifyAbleToReach(boardPointStart, boardPointEnd, numMoves)) {
					debug("canMoveTileToPoint: Tiles are in the way, cannot reach destination");
					return false;
				}
			}
		}

		// What if moving the tile there creates a Disharmony on the board? That can't happen!
		if (!gameOptionEnabled(IGNORE_CLASHING)
			&& this.moveCreatesDisharmony(boardPointStart, boardPointEnd)) {
			debug("canMoveTileToPoint: Move would create a disharmony");
			return false;
		}

		// I guess we made it through
		return true;
	}

	/**
	 * Check if tile in start point can be moved to end point by boat special ability
	 * @param {SkudPaiShoBoardPoint} boardPointStart - Start point of moving tile
	 * @param {SkudPaiShoBoardPoint} boardPointEnd - End point of moving tile
	 * @returns {boolean}
	 */
	canTransportTileToPointWithBoat(boardPointStart, boardPointEnd) {
		// Start point must have a tile
		if (!boardPointStart.hasTile()) return false;

		// Check that boat transport doesn't break any rules (can't move onto non_playable/gate/other tile, can't move into opposing color garden)
		if (!boardPointEnd.canHoldTile(boardPointStart.tile)) return false;

		// What if moving the tile there creates a Disharmony on the board? That can't happen!
		// if (this.moveCreatesDisharmony(boardPointStart, boardPointEnd)) {
		// 	return false;
		// }	// This disharmony check needs to first pretend that a Boat tile is on the spot the tile being moved was on. Fix is below:

		if (!gameOptionEnabled(IGNORE_CLASHING)) {
			const newBoard = this.getCopy();
			const newBoardPointStart = newBoard.cells[boardPointStart.row][boardPointStart.col];
			const notationPoint = new NotationPoint(new RowAndColumn(newBoardPointStart.row, newBoardPointStart.col).notationPointString);
			const notationPointEnd = new NotationPoint(new RowAndColumn(boardPointEnd.row, boardPointEnd.col).notationPointString);
			newBoard.placeBoat(new SkudPaiShoTile('B', 'G'), notationPoint, notationPointEnd, true);
			if (newBoard.moveCreatesDisharmony(newBoardPointStart, newBoardPointStart)) {
				return false;
			}
		}

		// I guess we made it through
		return true;
	}

	/**
	 * Check if tile moving from start to end point creates clash (invalid move)
	 * Replaces tiles to original positions if move is invalid
	 * @param {SkudPaiShoBoardPoint} boardPointStart - Start point of moving tile
	 * @param {SkudPaiShoBoardPoint} boardPointEnd - End point of moving tile
	 * @returns {boolean}
	 */
	moveCreatesDisharmony(boardPointStart, boardPointEnd) {
		// Grab tile in end point and put the start tile there, unless points are the same
		let endTile;
		if (boardPointStart.row !== boardPointEnd.row || boardPointStart.col !== boardPointEnd.col) {
			endTile = boardPointEnd.removeTile();
			boardPointEnd.putTile(boardPointStart.removeTile());
		}

		let clashFound = false;

		// Now, analyze board for disharmonies
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				const boardPoint = this.cells[row][col];
				if (boardPoint.hasTile()) {
					// Check for Disharmonies!
					if (this.hasDisharmony(boardPoint)) {
						clashFound = true;
						break;
					}
				}
			}
			if (clashFound) break;
		}

		// Put tiles back the way they were if needed
		if (boardPointStart.row !== boardPointEnd.row || boardPointStart.col !== boardPointEnd.col) {
			boardPointStart.putTile(boardPointEnd.removeTile());
			boardPointEnd.putTile(endTile);
		}

		return clashFound;
	}

	/**
	 * Recursive function to check valid arranging movement
	 * @param {SkudPaiShoBoardPoint} boardPointStart - Start point of moving tile (Or current point in recursion)
	 * @param {SkudPaiShoBoardPoint} boardPointEnd - End point of moving tile
	 * @param {number} numMoves - Number of basic movement spaces (Or spaces remaining in recursion)
	 * @returns {boolean}
	 */
	verifyAbleToReach(boardPointStart, boardPointEnd, numMoves) {
		if (!boardPointStart || !boardPointEnd) return false;
		if (boardPointStart.isType(NON_PLAYABLE) || boardPointEnd.isType(NON_PLAYABLE)) return false;

		const startRow = boardPointStart.row;
		const startCol = boardPointStart.col;
		const endRow = boardPointEnd.row;
		const endCol = boardPointEnd.col;

		if (startRow === endRow && startCol === endCol) return true; // Successfully reached end of path

		if (numMoves <= 0) return false; // Ran out of moves without reaching end of path

		const minMoves = Math.abs(startRow - endRow) + Math.abs(startCol - endCol);
		if (minMoves === 1) return true; // We are adjacent to end point, must be reachable

		// Recursively check for open path in all 4 directions
		for (const direction of DIRECTIONS) {
			const moveRow = startRow + direction[0];
			const moveCol = startCol + direction[1];

			// Boundary check to ensure we stay inside the board
			if (moveRow < 0 || moveRow >= 17 || moveCol < 0 || moveCol >= 17) continue;

			const movePoint = this.cells[moveRow][moveCol];
			if (movePoint.hasTile()) continue;

			// Check for path recursively, decrementing available movement
			if (this.verifyAbleToReach(movePoint, boardPointEnd, numMoves - 1)) {
				return true;
			}
		}

		return false;
	}

	// =========================================================
	// Harmony Functions
	// =========================================================

	/**
	 * Check if row/col has harmnonies blocked by rock (Defaults to check row)
	 * @param {number} rowOrColNum
	 * @param {boolean} isRow - true: check row blocked, false: check col blocked
	 * @returns {boolean}
	 */
	rowOrColBlockedByRock(rowOrColNum, isRow = true) {
		// simpleRocks: Rocks don't disable Harmonies.
		if (simpleRocks || simplest) return false;	

		this.rockRowAndCols.forEach(function(rowAndCol) {
			if (isRow && rowAndCol.row === rowOrColNum) return true;
			if (!isRow && rowAndCol.col === rowOrColNum) return true;
		});
		return false;
	}

	/** Refreshes betweenHarmony/betweenHarmonyHost/betweenHarmonyGuest for all SkudPaiShoBoardPoints */
	markSpacesBetweenHarmonies() {
		// Unmark all
		this.cells.forEach(function(row) {
			row.forEach(function(boardPoint) {
				boardPoint.betweenHarmony = false;
				boardPoint.betweenHarmonyHost = false;
				boardPoint.betweenHarmonyGuest = false;
			});
		});

		// Go through harmonies, mark the spaces between them
		const self = this;
		this.harmonyManager.harmonies.forEach(function(harmony) {
			// harmony.tile1Pos.row (for example)
			// Harmony will be in same row or same col
			if (harmony.tile1Pos.row === harmony.tile2Pos.row) {
				// Get smaller of the two
				const row = harmony.tile1Pos.row;
				const firstCol = Math.min(harmony.tile1Pos.col, harmony.tile2Pos.col);
				const lastCol = Math.max(harmony.tile1Pos.col, harmony.tile2Pos.col);
				for (let col = firstCol + 1; col < lastCol; col++) {
					self.cells[row][col].betweenHarmony = true;
					if (harmony.hasOwner(GUEST)) {
						self.cells[row][col].betweenHarmonyGuest = true;
					}else if (harmony.hasOwner(HOST)) {
						self.cells[row][col].betweenHarmonyHost = true;
					}
				}
			} else if (harmony.tile2Pos.col === harmony.tile2Pos.col) {
				// Get smaller of the two
				const col = harmony.tile1Pos.col;
				const firstRow = Math.min(harmony.tile1Pos.row, harmony.tile2Pos.row);
				const lastRow = Math.max(harmony.tile1Pos.row, harmony.tile2Pos.row);
				for (let row = firstRow + 1; row < lastRow; row++) {
					self.cells[row][col].betweenHarmony = true;
					if (harmony.hasOwner(GUEST)) {
						self.cells[row][col].betweenHarmonyGuest = true;
					} else if (harmony.hasOwner(HOST)) {
						self.cells[row][col].betweenHarmonyHost = true;
					}
				}
			}
		});
	}

	/** Refreshes this.harmonyManager and checks for winner */
	analyzeHarmonies() {
		// We're going to find all harmonies on the board

		// Check along all rows, then along all columns.. Or just check all tiles?
		this.harmonyManager.clearList();

		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				const boardPoint = this.cells[row][col];
				if (!boardPoint.hasTile()) continue;

				// Check for harmonies!
				const tileHarmonies = this.getTileHarmonies(boardPoint);
				// Add harmonies
				this.harmonyManager.addHarmonies(tileHarmonies);

				boardPoint.tile.harmonyOwners = [];

				for (let i = 0; i < tileHarmonies.length; i++) {
					for (let j = 0; j < tileHarmonies[i].owners.length; j++) {
						const harmonyOwnerName = tileHarmonies[i].owners[j].ownerName;
						const harmonyTile1 = tileHarmonies[i].tile1;
						const harmonyTile2 = tileHarmonies[i].tile2;

						if (!harmonyTile1.harmonyOwners) {
							harmonyTile1.harmonyOwners = [];
						}
						if (!harmonyTile2.harmonyOwners) {
							harmonyTile2.harmonyOwners = [];
						}

						if (!harmonyTile1.harmonyOwners.includes(harmonyOwnerName)) {
							harmonyTile1.harmonyOwners.push(harmonyOwnerName);
						}
						if (!harmonyTile2.harmonyOwners.includes(harmonyOwnerName)) {
							harmonyTile2.harmonyOwners.push(harmonyOwnerName);
						}
					}
				}
			}
		}

		this.markSpacesBetweenHarmonies();

		// this.harmonyManager.printHarmonies();

		this.winners = [];
		const self = this;
		const harmonyRingOwners = this.harmonyManager.harmonyRingExists();
		if (harmonyRingOwners.length > 0) {
			harmonyRingOwners.forEach(function(player) {
				if (!self.winners.includes(player)) {
					self.winners.push(player);
				}
			});
		}
	}

	/**
	 * Check if point has any surrounding lion turtle tiles
	 * @param {SkudPaiShoBoardPoint} boardPoint
	 * @returns {SkudPaiShoTile[]}
	 */
	getSurroundingLionTurtleTiles(boardPoint) {
		const surroundingLionTurtleTiles = [];
		const rowCols = this.getSurroundingRowAndCols(boardPoint);
		for (const rowCol of rowCols) {
			const surroundingPoint = this.cells[rowCol.row][rowCol.col];
			if (surroundingPoint.hasTile() && surroundingPoint.tile.accentType === LION_TURTLE) {
				surroundingLionTurtleTiles.push(surroundingPoint.tile);
			}
		}
		return surroundingLionTurtleTiles;
	}

	/**
	 * Get any harmonies formed by tile in current point
	 * @param {SkudPaiShoBoardPoint} boardPoint
	 * @returns {SkudPaiShoHarmony[]}
	 */
	getTileHarmonies(boardPoint) {
		const tileHarmonies = [];
		
		// Gates and open points never form harmony
		if (boardPoint.isType(GATE) || !boardPoint.hasTile()) return tileHarmonies;

		const tile = boardPoint.tile;
		const surroundingLionTurtleTiles = this.getSurroundingLionTurtleTiles(boardPoint);

		const rowBlockedByRock = this.rowOrColBlockedByRock(boardPoint.row, true);
		const colBlockedByRock = this.rowOrColBlockedByRock(boardPoint.col, false);

		// Loop through checking for harmonies in all 4 directions
		for (const direction of DIRECTIONS) {
			// Skip analyzing the row/col if blocked by rock
			if (direction[0] !== 0 && rowBlockedByRock) continue;
			if (direction[1] !== 0 && colBlockedByRock) continue;

			// Length of board (16) is the max we could possibly have to move before breaking
			for (let i = 1; i <= 16; i++) {
				const row = boardPoint.row + (direction[0] * i);
				const col = boardPoint.col + (direction[1] * i);

				// Boundary check to ensure we stay inside the 2D array
				if (row < 0 || row >= 17 || col < 0 || col >= 17) break;

				let newBoardPoint = this.cells[row][col];

				// Can stop search if we reach gate or unplayable point since we can guarantee no tiles past this
				if (newBoardPoint.isType(NON_PLAYABLE) || newBoardPoint.isType(GATE)) break;

				// Stop searching this direction once we find a tile in the line
				if (newBoardPoint.hasTile()) {
					let newSurroundingLionTurtles = this.getSurroundingLionTurtleTiles(newBoardPoint);
					newSurroundingLionTurtles = newSurroundingLionTurtles.concat(surroundingLionTurtleTiles);
					const surroundsLionTurtle = newSurroundingLionTurtles.length > 0;

					if (tile.formsHarmonyWith(newBoardPoint.tile, surroundsLionTurtle)) {
						tileHarmonies.push(new SkudPaiShoHarmony(tile, boardPoint, newBoardPoint.tile, new RowAndColumn(row, col), newSurroundingLionTurtles));
					}
					break;
				}
			}
		}

		return tileHarmonies;
	}

	/**
	 * Check if any new harmonies are formed after move
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {SkudPaiShoTile} tile - Unused
	 * @param {RowAndColumn} startRowCol - Unused
	 * @param {RowAndColumn} endRowCol - Unused
	 * @returns {boolean}
	 */
	hasNewHarmony(player, tile, startRowCol, endRowCol) {
		// To check if new harmony, first analyze harmonies and compare to previous set of harmonies
		const oldHarmonies = this.harmonyManager.harmonies;
		this.analyzeHarmonies();

		return this.harmonyManager.hasNewHarmony(player, oldHarmonies);
	}

	/**
	 * Checks if any clashes are formed by tile in current point
	 * @param {SkudPaiShoBoardPoint} boardPoint
	 * @returns {boolean}
	 */
	hasDisharmony(boardPoint) {
		// Gates and open points never clash
		if (boardPoint.isType(GATE) || !boardPoint.hasTile()) return false;

		const tile = boardPoint.tile;

		// Loop through checking for clash in all 4 directions
		for (const direction of DIRECTIONS) {
			// Length of board (16) is the max we could possibly have to move before breaking
			for (let i = 1; i <= 16; i++) {
				const row = boardPoint.row + (direction[0] * i);
				const col = boardPoint.col + (direction[1] * i);

				// Boundary check to ensure we stay inside the 2D array
				if (row < 0 || row >= 17 || col < 0 || col >= 17) break;

				let newBoardPoint = this.cells[row][col];

				// Can stop search if we reach gate or unplayable point since we can guarantee no tiles past this
				if (newBoardPoint.isType(NON_PLAYABLE) || newBoardPoint.isType(GATE)) break;

				// We can stop this direction if we find a non-clashing tile blocking the path
				if (newBoardPoint.hasTile()) {
					if (!tile.clashesWith(newBoardPoint.tile)) break;
					return true;
				}
			}
		}

		return false;
	}

	// =========================================================
	// Possible Move Generation Functions
	// =========================================================

	/**
	 * Add POSSIBLE_MOVE type to all SkudPaiShoBoardPoints that are legal moves for the tile on boardPointStart 
	 * @param {SkudPaiShoBoardPoint} boardPointStart - GameManger checks that it has a tile
	 */
	setPossibleMovePoints(boardPointStart) {
		const allowedMoveDistance = boardPointStart.tile.getMoveDistance();

		this.setPossibleMovementPointsFromMovePoints([boardPointStart], boardPointStart.tile, boardPointStart, allowedMoveDistance);
	}

	/**
	 * Get points adjacent to pointAlongTheWay that are movable from originPoint and within the board
	 * @param {NotationPoint} pointAlongTheWay
	 * @param {NotationPoint} originPoint
	 * @returns {NotationPoint[]}
	 */
	getAdjacentPointsPotentialPossibleMoves(pointAlongTheWay, originPoint) {
		const potentialMovePoints = [];
		pointAlongTheWay = pointAlongTheWay ? pointAlongTheWay : originPoint;
		
		let possibleMoveOffsets = DIRECTIONS;
		if (gameOptionEnabled(DIAGONAL_MOVEMENT)) {
			possibleMoveOffsets = [[-1, -1], [1, 1], [-1, 1], [1, -1]];
		}
		
		possibleMoveOffsets.forEach((possibleMoveOffset) => {
			const possibleRow = pointAlongTheWay.row + possibleMoveOffset[0];
			const possibleCol = pointAlongTheWay.col + possibleMoveOffset[1];
			if (possibleRow <= 0 || possibleRow > 16 || possibleCol <= 0 || possibleCol >= 16) return;

			let potentialMovePoint = this.cells[possibleRow][possibleCol];
			if (potentialMovePoint.isType(NON_PLAYABLE)) return;

			potentialMovePoints.push(potentialMovePoint);
		});

		return potentialMovePoints;
	}

	/**
	 * Recursive function to find all legal move points for tile
	 * @param {NotationPoint[]} movePoints
	 * @param {Function} nextPossibleMovementPointsFunction
	 * @param {SkudPaiShoTile} tile
	 * @param {NotationPoint} originPoint
	 * @param {number} distanceRemaining
	 */
	setPossibleMovementPointsFromMovePoints(movePoints, tile, originPoint, distanceRemaining) {
		if (distanceRemaining === 0 || movePoints.length <= 0) {
			return;	// We are done once we either run out of movement or run out of open spaces to move to
		}

		const nextPointsConfirmed = [];
		movePoints.forEach((recentPoint) => {
			const nextPossiblePoints = this.getAdjacentPointsPotentialPossibleMoves(recentPoint, originPoint);
			nextPossiblePoints.forEach((adjacentPoint) => {
				if (adjacentPoint.getMoveDistanceRemaining() >= distanceRemaining) return;

				adjacentPoint.setMoveDistanceRemaining(distanceRemaining);
					
				if (!adjacentPoint.hasTile()) { // If can move through point, add it to the next round of movement checks
					nextPointsConfirmed.push(adjacentPoint);
				} else { // If cannot move through point, then the distance remaining is 0, none!
					adjacentPoint.setMoveDistanceRemaining(0);
				}

				// Check for other legal move rules such as captures before deciding if this is a legal move
				if (this.canMoveTileToPoint(tile.ownerName, originPoint, adjacentPoint, true)) {
					adjacentPoint.addType(POSSIBLE_MOVE);
				}
			});
		});

		this.setPossibleMovementPointsFromMovePoints(nextPointsConfirmed,
			tile,
			originPoint,
			distanceRemaining - 1);
	}

	/** Remove POSSIBLE_MOVE type from all SkudPaiShoBoardPoints */
	removePossibleMovePoints() {
		this.cells.forEach(function(row) {
			row.forEach(function(boardPoint) {
				boardPoint.removeType(POSSIBLE_MOVE);
				boardPoint.clearPossibleMovementTypes();
			});
		});
	}

	/**
	 * Add POSSIBLE_MOVE type to open gates
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {SkudPaiShoTile} tile - Optional address special rules for pond accent tile
	 */
	setOpenGatePossibleMoves(player, tile) {
		// Apply "open gate" type to applicable boardPoints
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				const bp = this.cells[row][col];
				if (bp.isOpenGate()) {
					this.cells[row][col].addType(POSSIBLE_MOVE);
				}

				// If Pond, mark surrounding points
				if (tile && bp.hasTile() && bp.tile.accentType === POND) {
					const rowCols = this.getSurroundingRowAndCols(bp);
					for (let i = 0; i < rowCols.length; i++) {
						const surroundingPoint = this.cells[rowCols[i].row][rowCols[i].col];
						if (surroundingPoint.canHoldTile(tile)) {
							// If does not cause clash...
							const newBoard = this.getCopy();
							const notationPoint = new NotationPoint(new RowAndColumn(surroundingPoint.row, surroundingPoint.col).notationPointString);
							newBoard.placeTile(tile, notationPoint);
							if (gameOptionEnabled(IGNORE_CLASHING) || !newBoard.moveCreatesDisharmony(notationPoint, notationPoint)) {
								surroundingPoint.addType(POSSIBLE_MOVE);
							}
						}
					}
				}
			}
		}
	}

	/**
	 * Add POSSIBLE_MOVE type to all possible plant points with "newSpecialFlowerRules" enabled
	 * @param {string} player - "HOST" or "GUEST"
	 */
	revealSpecialFlowerPlacementPoints(player) {
		// Check each Gate for tile belonging to player, then add POSSIBLE_MOVE to open gate edge points
		const bpCheckList = [];
		for (const gateRowCol of SkudPaiShoBoard.GATES_ROW_COL) {
			const bp = this.cells[gateRowCol.row][gateRowCol.col];
			if (!bp.hasTile() || bp.tile.ownerName !== player) continue;

			// On top or bottom
			if (gateRowCol.col === 8) {
				bpCheckList.push(this.cells[gateRowCol.row][gateRowCol.col - 1]);
				bpCheckList.push(this.cells[gateRowCol.row][gateRowCol.col + 1]);
			// On left or right
			} else {
				bpCheckList.push(this.cells[gateRowCol.row - 1][gateRowCol.col]);
				bpCheckList.push(this.cells[gateRowCol.row + 1][gateRowCol.col]);
			}
		}

		bpCheckList.forEach(function(bp) {
			if (!bp.hasTile()) {
				bp.addType(POSSIBLE_MOVE);
			}
		});
	}

	/**
	 * Add POSSIBLE_MOVE type to gate nearest to guest if open (used for opening move)
	 */
	setGuestGateOpen() {
		const bp = this.cells[16][8];
		if (bp.isOpenGate()) {
			bp.addType(POSSIBLE_MOVE);
		}
	}

	/**
	 * Add POSSIBLE_MOVE type to all SkudPaiShoBoardPoints where given accent tile can be placed
	 * @param {SkudPaiShoTile} tile - Accent tile to be placed
	 */
	revealPossibleAccentPlacementPoints(tile) {
		const self = this;

		this.cells.forEach(function(row) {
			row.forEach(function(boardPoint) {
				if (
					(tile.accentType === ROCK && self.canPlaceAccent(boardPoint))
					|| (tile.accentType === WHEEL && self.canPlaceWheel(boardPoint))
					|| (tile.accentType === KNOTWEED && self.canPlaceKnotweed(boardPoint))
					|| (tile.accentType === BOAT && self.canPlaceBoat(boardPoint, tile))
					|| (tile.accentType === BAMBOO && self.canPlaceBamboo(boardPoint, tile))
					|| (tile.accentType === POND && self.canPlaceAccent(boardPoint, tile))
					|| (tile.accentType === LION_TURTLE && self.canPlaceAccent(boardPoint, tile))
				) {
					boardPoint.addType(POSSIBLE_MOVE);
				}
			});
		});
	}

	/**
	 * Given boardPoint where boat is placed, add POSSIBLE_MOVE type to all surrounding SkudPaiShoBoardPoints where the current tile can be shifted
	 * @param {SkudPaiShoBoardPoint} boardPoint
	 */
	revealBoatBonusPoints(boardPoint) {
		if (!boardPoint.hasTile()) return;

		const player = boardPoint.tile.ownerName;

		if (newKnotweedRules) {
			// New rules: All surrounding points
			const rowCols = this.getSurroundingRowAndCols(boardPoint);

			for (const rowCol of rowCols) {
				const boardPointEnd = this.cells[rowCol.row][rowCol.col];
				if (this.canTransportTileToPointWithBoat(boardPoint, boardPointEnd)) {
					boardPointEnd.addType(POSSIBLE_MOVE);
				}
			}
			return;
		}
		// The rest is old and outdated...
		// Apply "possible move point" type to applicable boardPoints
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				const boardPointEnd = this.cells[row][col];
				if (Math.abs(boardPoint.row - boardPointEnd.row) + Math.abs(boardPoint.col - boardPointEnd.col) === 1) {
					if (this.canMoveTileToPoint(player, boardPoint, boardPointEnd)) {
						boardPointEnd.addType(POSSIBLE_MOVE);
					}
				}
			}
		}
	}

	// =========================================================
	// Misc Board Analysis Functions
	// =========================================================

	// Define points that have gates for quick access
	static GATES_ROW_COL = [
		new RowAndColumn(0, 8),		// Top
		new RowAndColumn(16, 8),	// Bottom
		new RowAndColumn(8, 0),		// Left
		new RowAndColumn(8, 16)		// Right
	]

	/**
	 * Checks if player has no growing flowers in gates
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {boolean} allowOneGrowingFlower - Used to allow bonus plant when controlling only one gate with "newGatesRule" enabled
	 * @returns {boolean}
	 */
	playerHasNoGrowingFlowers(player, allowOneGrowingFlower = false) {
		const allowedCount = allowOneGrowingFlower ? 1 : 0;

		let count = 0;
		for (const gateRowCol of SkudPaiShoBoard.GATES_ROW_COL) {
			const bp = this.cells[gateRowCol.row][gateRowCol.col];
			if (bp.hasTile() && bp.tile.ownerName === player) {
				count++;
			}
			if (count > allowedCount) return false;
		}

		return true;
	}

	/**
	 * Get new deep copy of SkudPaiShoBoard.
	 * @returns {SkudPaiShoBoard}
	 */
	getCopy() {
		const copyBoard = new SkudPaiShoBoard();

		// cells
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				copyBoard.cells[row][col] = this.cells[row][col].getCopy();
			}
		}

		// playedWhiteLotusTiles
		for (let i = 0; i < this.playedWhiteLotusTiles.length; i++) {
			copyBoard.playedWhiteLotusTiles.push(this.playedWhiteLotusTiles[i].getCopy());
		}

		// Everything else...
		copyBoard.refreshRockRowAndCols();
		copyBoard.analyzeHarmonies();

		return copyBoard;
	}

	// =========================================================
	// AI Player Board Analysis Functions
	// =========================================================

	/**
	 * Number of basic flower tiles owned by player that are in their color's garden
	 * @param {string} player - "HOST" or "GUEST"
	 * @returns {number} Tile Count
	 */
	numTilesInGardensForPlayer(player) {
		let count = 0;
		for (const cellRow of this.cells) {
			for (const bp of cellRow) {
				if (bp.hasTile() && bp.types.length === 1 && bp.isType(bp.tile.basicColorName)) continue;
				count++;
			}
		}
		return count;
	}

	/**
	 * Number of tiles of on the board owned by player
	 * @param {string} player - "HOST" or "GUEST"
	 * @returns {number} Tile Count
	 */
	numTilesOnBoardForPlayer(player) {
		let count = 0;
		for (const cellRow of this.cells) {
			for (const bp of cellRow) {
				if (!bp.hasTile() || !bp.tile.ownerName === player) continue;
				count++;
			}
		}
		return count;
	}

	/**
	 * Get measure of player's board control, the more tiles owned in each of the 4 quadrants, the higher the score
	 * @param {string} player - "HOST" or "GUEST"
	 * @returns {number} Surroundness score (Higher is better for player)
	 */
	getSurroundness(player) {
		let up = 0;
		let hasUp = 0;
		let down = 0;
		let hasDown = 0;
		let left = 0;
		let hasLeft = 0;
		let right = 0;
		let hasRight = 0;
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				const bp = this.cells[row][col];
				if (bp.hasTile() && bp.tile.ownerName === player) {
					if (bp.row > 8) {
						down++;
						hasDown = 1;
					}
					if (bp.row < 8) {
						up++;
						hasUp = 1;
					}
					if (bp.col < 8) {
						left++;
						hasLeft = 1;
					}
					if (bp.col > 8) {
						right++;
						hasRight = 1;
					}
				}
			}
		}

		const lowest = Math.min(up, down, left, right);
		if (lowest === 0) {
			return hasUp + hasDown + hasLeft + hasRight;
		} else {
			return lowest * 4;
		}
	}

}
