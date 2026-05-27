// Skud Pai Sho Game Manager

import { ARRANGING, GUEST, HOST, PLANTING } from '../CommonNotationObjects';
import {
	NO_ALT_WIN,
	OPTION_INFORMAL_START,
	SPECIAL_FLOWERS_BOUNCE,
	gameOptionEnabled,
} from '../GameOptions';
import { PaiShoMarkingManager } from "../pai-sho-common/PaiShoMarkingManager";
import {
	SPECIAL_FLOWER,
	debug,
} from '../GameData';
import {
	lessBonus,
	limitedGatesRule,
	newGatesRule,
	newSpecialFlowerRules,
} from './SkudPaiShoRules';
import { SkudPaiShoActuator } from './SkudPaiShoActuator';
import { SkudPaiShoBoard } from './SkudPaiShoBoard';
import { SkudPaiShoBoardPoint } from './SkudPaiShoBoardPoint';
import { SkudPaiShoNotationMove } from './SkudPaiShoGameNotation';
import { SkudPaiShoTile } from './SkudPaiShoTile';
import { SkudPaiShoTileManager } from './SkudPaiShoTileManager';
import { getOpponentName } from '../pai-sho-common/PaiShoPlayerHelp';
import { setGameLogText } from '../GameState';

export class SkudPaiShoGameManager {
	constructor(actuator, ignoreActuate, isCopy) {
		/** @type {string} */
		this.gameLogText = '';
		/** @type {boolean} Don't show visuals. */
		this.isCopy = isCopy;
		
		/** @type {SkudPaiShoActuator} */
		this.actuator = actuator;
		
		/** @type {SkudPaiShoTileManager} */
		this.tileManager = new SkudPaiShoTileManager();
		/** @type {PaiShoMarkingManager} */
		this.markingManager = new PaiShoMarkingManager();
		
		this.setup(ignoreActuate);
		/** @type {string[]} */
		this.endGameWinners = [];
	}

	/**
	 * Called once to setup the game
	 * @param {boolean} ignoreActuate - Set true if this game doesn't need visuals (Ex. Copy game state used for AI thinking)
	 */
	setup(ignoreActuate) {
		this.board = new SkudPaiShoBoard();

		// Update the actuator
		if (!ignoreActuate) {
			this.actuate();
		}
	}

	/**
	 * Sends the updated board to the actuator
	 * @param {SkudPaiShoNotationMove} moveToAnimate
	 * @param {number} moveAnimationBeginStep - Optional animation step
	 */
	actuate(moveToAnimate, moveAnimationBeginStep) {
		if (this.isCopy) {
			return;
		}
		this.actuator.actuate(this.board, this.tileManager, this.markingManager, moveToAnimate, moveAnimationBeginStep);
		setGameLogText(this.gameLogText);
	}

	/**
	 * Execute SkudPaiShoNotationMove
	 * @param {SkudPaiShoNotationMove} move
	 * @param {boolean} withActuate - Reflect move in visuals
	 * @param {number} moveAnimationBeginStep - Optional animation step
	 * @returns {boolean | Object} False if move isn't allowed; if valid move, gives object with bonusAllowed, movedTile, capturedTile
	 */
	runNotationMove(move, withActuate, moveAnimationBeginStep) {
		debug("Running Move(" + (withActuate ? "" : "Not ") + "Actuated): " + move.fullMoveText);

		let errorFound = false;
		let bonusAllowed = false;

		if (move.moveNum === 0 && move.accentTiles) {
			const self = this;
			const allAccentCodes = ['R', 'W', 'K', 'B', 'R', 'W', 'K', 'B', 'M', 'P', 'T'];
			move.accentTiles.forEach(function(tileCode) {
				const i = allAccentCodes.indexOf(tileCode);
				if (i >= 0) {
					allAccentCodes.splice(i, 1);
				}
			});
			allAccentCodes.forEach(function(tileCode) {
				self.tileManager.grabTile(move.player, tileCode);
			});
			self.tileManager.unselectTiles(move.player);

			this.buildChooseAccentTileGameLogText(move);
		} else if (move.moveNum === 1) {
			this.tileManager.unselectTiles(GUEST);
			this.tileManager.unselectTiles(HOST);
		}

		if (move.moveType === PLANTING) {
			// // Check if valid plant
			if (!this.board.pointIsOpenGate(move.endPoint)) {
				// invalid
				debug("Invalid planting point: " + move.endPoint.pointText);
				errorFound = true;
				return false;
			}
			// Just placing tile on board
			const tile = this.tileManager.grabTile(move.player, move.plantedFlowerType);

			this.board.placeTile(tile, move.endPoint, this.tileManager);

			this.buildPlantingGameLogText(move, tile);
		} else if (move.moveType === ARRANGING) {
			const moveResults = this.board.moveTile(move.player, move.startPoint, move.endPoint);
			bonusAllowed = moveResults.bonusAllowed;

			move.capturedTile = moveResults.capturedTile;

			if (moveResults.bonusAllowed && move.hasHarmonyBonus()) {
				const tile = this.tileManager.grabTile(move.player, move.bonusTileCode);
				move.accentTileUsed = tile;
				if (move.boatBonusPoint) {
					this.board.placeTile(tile, move.bonusEndPoint, this.tileManager, move.boatBonusPoint);
				} else {
					const placeTileResult = this.board.placeTile(tile, move.bonusEndPoint, this.tileManager);
					if (placeTileResult && placeTileResult.tileRemovedWithBoat) {
						move.tileRemovedWithBoat = placeTileResult.tileRemovedWithBoat;
					}
				}
			} else if (!moveResults.bonusAllowed && move.hasHarmonyBonus()) {
				debug("BONUS NOT ALLOWED so I won't give it to you!");
				errorFound = true;
			}

			if (gameOptionEnabled(SPECIAL_FLOWERS_BOUNCE)
				&& move.capturedTile && move.capturedTile.type === SPECIAL_FLOWER) {
				this.tileManager.putTileBack(move.capturedTile);
			}

			this.buildArrangingGameLogText(move, moveResults);
		}

		if (withActuate) {
			this.actuate(move, moveAnimationBeginStep);
		}

		this.endGameWinners = [];
		if (this.board.winners.length === 0) {
			// If no harmony ring winners, check for player out of basic flower tiles
			const playerOutOfTiles = this.aPlayerIsOutOfBasicFlowerTiles();
			if (playerOutOfTiles && !gameOptionEnabled(NO_ALT_WIN)) {
				debug("PLAYER OUT OF TILES: " + playerOutOfTiles);
				// (Previously, on Skud Pai Sho...) If a player has more accent tiles, they win
				// var playerMoreAccentTiles = this.tileManager.getPlayerWithMoreAccentTiles();
				// if (playerMoreAccentTiles) {
				// 	debug("Player has more Accent Tiles: " + playerMoreAccentTiles)
				// 	this.endGameWinners.push(playerMoreAccentTiles);
				// } else {
				// (Previously, on Skud Pai Sho...) Calculate player with most Harmonies
				// var playerWithmostHarmonies = this.board.harmonyManager.getPlayerWithMostHarmonies();
				// Calculate player with most Harmonies crossing midlines
				const playerWithmostHarmonies = this.board.harmonyManager.getPlayerWithMostHarmoniesCrossingMidlines();
				if (playerWithmostHarmonies) {
					this.endGameWinners.push(playerWithmostHarmonies);
					debug("Most Harmonies winner: " + playerWithmostHarmonies);
				} else {
					this.endGameWinners.push(HOST);
					this.endGameWinners.push(GUEST);
					debug("Most Harmonies is a tie!");
				}
				// }
			}
		}

		this.lastPlayerName = move.player;
		this.lastMoveNum = move.moveNum;

		return bonusAllowed;
	}

	/**
	 * Set this.gameLogText for choose accent tile move
	 * @param {SkudPaiShoNotationMove} move
	 */
	buildChooseAccentTileGameLogText(move) {
		this.gameLogText = move.moveNum + move.playerCode + '. '
			+ move.player + ' chose Accent Tiles ' + move.accentTiles;
	}
	/**
	 * Set this.gameLogText for planting tile move
	 * @param {SkudPaiShoNotationMove} move
	 * @param {SkudPaiShoTile} tile
	 */
	buildPlantingGameLogText(move, tile) {
		this.gameLogText = move.moveNum + move.playerCode + '. '
			+ move.player + ' Planted ' + tile.getName() + ' at ' + move.endPoint.pointText;
	}
	/**
	 * Set this.gameLogText for arranging tile move
	 * @param {SkudPaiShoNotationMove} move
	 * @param {Object} moveResults - Contains: bonusAllowed, movedTile, capturedTile
	 */
	buildArrangingGameLogText(move, moveResults) {
		if (!moveResults) {
			return "Invalid Move :(";
		}
		this.gameLogText = move.moveNum + move.playerCode + '. '
			+ move.player + ' moved ' + moveResults.movedTile.getName() + ' ' + move.moveTextOnly;
		if (moveResults.capturedTile) {
			this.gameLogText += ' to capture ' + getOpponentName(move.player) + '\'s ' + moveResults.capturedTile.getName();
		}
		if (moveResults.bonusAllowed && move.hasHarmonyBonus()) {
			this.gameLogText += ' and used ' + SkudPaiShoTile.getTileName(move.bonusTileCode) + ' on Harmony Bonus';
		}
	}

	/**
	 * Set POSSIBLE_MOVE for all SkudPaiShoBoardPoints where tile in given boardPoint can move
	 * @param {SkudPaiShoBoardPoint} boardPoint
	 * @param {boolean} ignoreActuate - Don't reflect valid move points in visual
	 */
	revealPossibleMovePoints(boardPoint, ignoreActuate) {
		if (!boardPoint.hasTile()) {
			return;
		}
		this.board.setPossibleMovePoints(boardPoint);

		if (!ignoreActuate) {
			this.actuate();
		}
	}

	/**
	 * Remove POSSIBLE_MOVE from all SkudPaiShoBoardPoints
	 * @param {boolean} ignoreActuate - Don't reflect move in visual
	 * @param {SkudPaiShoNotationMove} moveToAnimate - Optional move to animate if not ignoreActuate
	 */
	hidePossibleMovePoints(ignoreActuate, moveToAnimate) {
		this.board.removePossibleMovePoints();
		this.tileManager.removeSelectedTileFlags();
		if (!ignoreActuate) {
			this.actuate(moveToAnimate);
		}
	}

	/**
	 * Add POSSIBLE_MOVE to open gates
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {SkudPaiShoTile} tile - Tile to plant
	 * @param {number} moveNum
	 * @param {boolean} ignoreActuate - Don't open gates in visual
	 */
	revealOpenGates(player, tile, moveNum, ignoreActuate) {
		if (!gameOptionEnabled(OPTION_INFORMAL_START) && moveNum === 2) {
			// guest selecting first tile
			this.board.setGuestGateOpen();
		} else {
			this.board.setOpenGatePossibleMoves(player, tile);
		}

		if (!ignoreActuate) {
			this.actuate();
		}
	}

	/**
	 * Checks if player can use their harmony bonus move to plant
	 * @param {string} player - "HOST" or "GUEST"
	 * @returns {boolean}
	 */
	playerCanBonusPlant(player) {
		if (!newGatesRule) {
			return true;
		}

		if (lessBonus) {
			return this.board.playerHasNoGrowingFlowers(player);
		} else if (limitedGatesRule) {
			// New Gate Rules: Player cannot plant on Bonus if already controlling any Gates
			return this.board.playerHasNoGrowingFlowers(player);
		} else if (newGatesRule) {
			// New Gate Rules: Player cannot plant on Bonus if already controlling two Gates
			return this.board.playerControlsLessThanTwoGates(player);
		}
	}

	/**
	 * Add POSSIBLE_MOVE to open gates where special flower can be planted
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {SkudPaiShoTile} tile - Special flower tile to plant
	 */
	revealSpecialFlowerPlacementPoints(player, tile) {
		if (!newSpecialFlowerRules) {
			this.revealOpenGates(player, tile);
			return;
		}

		this.board.revealSpecialFlowerPlacementPoints(player);
		this.actuate();
	}

	/**
	 * Add POSSIBLE_MOVE to all points where accent tile can be placed
	 * @param {SkudPaiShoTile} tile - Accent tile to place
	 */
	revealPossiblePlacementPoints(tile) {
		this.board.revealPossiblePlacementPoints(tile);
		this.actuate();
	}

	/**
	 * Add POSSIBLE_MOVE to all points where boat can shift target tile
	 * @param {SkudPaiShoBoardPoint} boardPoint - Point where boat was placed
	 */
	revealBoatBonusPoints(boardPoint) {
		this.board.revealBoatBonusPoints(boardPoint);
		this.actuate();
	}

	/**
	 * Returns if "HOST", "GUEST", or "BOTH PLAYERS" has any basic flower tiles left.
	 * @returns Returns null if neither player has any basic flower left.
	 */
	aPlayerIsOutOfBasicFlowerTiles() {
		return this.tileManager.aPlayerIsOutOfBasicFlowerTiles();
	}

	/**
	 * Checks if given player has both Special Flowers left unplayed.
	 * @param {string} playerName - "HOST" or "GUEST"
	 * @returns Returns null if neither player has any basic flower left.
	 */
	playerHasNotPlayedEitherSpecialTile(playerName) {
		return this.tileManager.playerHasBothSpecialTilesRemaining(playerName);
	}

	/**
	 * Checks for winner(s).
	 * @returns {?string} "HOST", "GUEST", "BOTH PLAYERS", or null if no winners
	 */
	getWinner() {
		if (this.board.winners.length === 1) {
			return this.board.winners[0];
		} else if (this.board.winners.length > 1) {
			return "BOTH players";
		} else if (this.endGameWinners.length === 1) {
			return this.endGameWinners[0];
		} else if (this.endGameWinners.length > 1 || this.board.winners.length > 1) {
			return "BOTH players";
		}
	}

	/**
	 * Checks if win or tie exists. If so, checks if reason is from harmony ring or player ran out of flowers to play
	 * @returns {?string}
	 */
	getWinReason() {
		if (this.board.winners.length === 1) {
			return " created a Harmony Ring and won the game!";
		} else if (this.endGameWinners.length === 1) {
			return " won the game with the most Harmonies crossing the midlines.";
		} else if (this.board.winners.length === 2) {
			return " formed Harmony Rings for a tie!";
		} else if (this.endGameWinners.length === 2) {
			return " had the same number of Harmonies crossing the midlines for a tie!";	// Should there be any other tie breaker?
		}
	}

	/**
	 * If win exists, give standard win type code to PaiShoMain.js
	 * @returns {?number}
	 */
	getWinResultTypeCode() {
		if (this.board.winners.length === 1) {
			return 1;	// Harmony Ring is 1
		} else if (this.endGameWinners.length === 1) {
			return 3;	// Most Harmonies crossing midline
		} else if (this.endGameWinners.length > 1 || this.board.winners.length > 1) {
			return 4;	// Tie
		}
	}

	/**
	 * Get new deep copy of SkudPaiShoGameManager
	 * @returns {SkudPaiShoGameManager}
	 */
	getCopy() {
		const copyGame = new SkudPaiShoGameManager(this.actuator, true, true);
		copyGame.board = this.board.getCopy();
		copyGame.tileManager = this.tileManager.getCopy();
		copyGame.lastPlayerName = this.lastPlayerName;
		copyGame.lastMoveNum = this.lastMoveNum;
		return copyGame;
	}

	/**
	 * Get player for next turn based on this.lastPlayerName
	 * @returns {string} player
	 */
	getNextPlayerName() {
		if (this.lastPlayerName === HOST) {
			return GUEST;
		} else {
			return HOST;
		}
	}
}
