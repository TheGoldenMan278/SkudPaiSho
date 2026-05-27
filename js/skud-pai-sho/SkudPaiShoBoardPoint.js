// Board Point

import { GUEST, HOST } from "../CommonNotationObjects";
import { ACCENT_TILE, BASIC_FLOWER, SPECIAL_FLOWER } from "../GameData";
import { RED, WHITE, SkudPaiShoTile } from './SkudPaiShoTile';

export var NON_PLAYABLE = "Non-Playable";
export var NEUTRAL = "Neutral";

export var GATE = "Gate";

export var MARKED = "Marked";
export var POSSIBLE_MOVE = "Possible Move";
export var OPEN_GATE = "OPEN GATE";

export var thinDot = "·";
export var thickDot = "•";
export var whiteDot = "◦";
export var gateDot = "⟡";

export class SkudPaiShoBoardPoint {
	constructor() {
		/** @type {string[]} */
		this.types = [];
		/** @type {number} */
		this.row = -1;
		/** @type {number} */
		this.col = -1;
	}

	// =========================================================
	// Static Factory SkudPaiShoBoardPoint Generators
	// =========================================================
	/** @returns {SkudPaiShoBoardPoint} */
	static neutral() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(NEUTRAL);
		
		return point;
	}
	/** @returns {SkudPaiShoBoardPoint} */
	static gate() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(GATE);
		
		return point;
	}
	/** @returns {SkudPaiShoBoardPoint} */
	static red() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(RED);
		
		return point;
	}
	/** @returns {SkudPaiShoBoardPoint} */
	static white() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(WHITE);
		
		return point;
	}
	/** @returns {SkudPaiShoBoardPoint} */
	static redWhite() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(RED);
		point.addType(WHITE);
		
		return point;
	}
	/** @returns {SkudPaiShoBoardPoint} */
	static redWhiteNeutral() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(RED);
		point.addType(WHITE);
		point.addType(NEUTRAL);
		
		return point;
	}
	/** @returns {SkudPaiShoBoardPoint} */
	static redNeutral() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(RED);
		point.addType(NEUTRAL);
		
		return point;
	}
	/** @returns {SkudPaiShoBoardPoint} */
	static whiteNeutral() {
		const point = new SkudPaiShoBoardPoint();
		point.addType(WHITE);
		point.addType(NEUTRAL);
		
		return point;
	}

	// =========================================================
	// SkudPaiShoBoardPoint Member Functions
	// =========================================================
	
	/**
	 * Add type to this.types.
	 * @param {string} type - Type to be added.
	 */
	addType(type) {
		if (!this.types.includes(type)) {
			this.types.push(type);
		}
	}
	
	/**
	 * Remove type from this.types.
	 * @param {string} type - Type to be removed.
	 */
	removeType(type) {
		for (let i = 0; i < this.types.length; i++) {
			if (this.types[i] === type) {
				this.types.splice(i, 1);
			}
		}
	}

	/**
	 * Generates string representation of SkudPaiShoBoardPoint.
	 * @returns {string}
	 */
	getConsoleDisplay() {
		if (this.tile) {
			return this.tile.getConsoleDisplay();
		} else {
			let consoleDisplay = thinDot;

			if (this.types.includes(NON_PLAYABLE)) {
				consoleDisplay = " ";
			}

			let str = "";

			if (this.types.includes(RED)) {
				str = "R";
				consoleDisplay = thickDot;
			}
			if (this.types.includes(WHITE)) {
				str += "W";
				consoleDisplay = whiteDot;
			}
			if (this.types.includes(NEUTRAL)) {
				str += "N";
			}

			if (this.types.includes(GATE)) {
				str = "G";
				consoleDisplay = gateDot;
			}

			if (str.length > 1) {
				consoleDisplay = "+";
			}

			return consoleDisplay;
		}
	}
	
	/**
	 * Sets this.tile for SkudPaiShoBoardPoint.
	 * @param {SkudPaiShoTile} tile
	 */
	putTile(tile) {
		this.tile = tile;
	}

	/**
	 * Checks if SkudPaiShoBoardPoint has tile.
	 * @returns {boolean}
	 */
	hasTile() {
		if (this.tile) {
			return true;
		}
		return false;
	}

	/**
	 * Checks if SkudPaiShoBoardPoint has type in this.types.
	 * @param {string} type
	 * @returns {boolean}
	 */
	isType(type) {
		return this.types.includes(type);
	}

	/**
	 * Checks if SkudPaiShoBoardPoint has type "GATE" and no tile
	 * @returns {boolean}
	 */
	isOpenGate() {
		return !this.hasTile() && this.types.includes(GATE);
	}

	/**
	 * Remove tile from this.tile.
	 * @returns {SkudPaiShoTile} The removed tile.
	 */
	removeTile() {
		const theTile = this.tile;

		this.tile = null;

		return theTile;
	}

	/**
	 * Drain this.tile if it exists.
	 */
	drainTile() {
		if (this.tile) {
			this.tile.drain();
		}
	}

	/**
	 * Restore this.tile if it exists.
	 */
	restoreTile() {
		if (this.tile) {
			this.tile.restore();
		}
	}

	/**
	 * Checks if given tile can be placed/moved onto current SkudPaiShoBoardPoint (Excludes captures).
	 * @param {SkudPaiShoTile} tile - Tile to check.
	 * @param {boolean} ignoreTileCheck - Skip checking if SkudPaiShoBoardPoint has a tile already.
	 * @returns {boolean} Can hold tile.
	 */
	canHoldTile(tile, ignoreTileCheck) {
		// Validate this point's ability to hold given tile
		if (this.isType(NON_PLAYABLE)) {
			return false;
		}

		if (!ignoreTileCheck && this.hasTile()) {
			// This function does not take into account capturing abilities
			return false;
		}

		if (tile.type === BASIC_FLOWER) {
			if (!(this.isType(NEUTRAL) || this.isType(tile.basicColorName))) {
				// Opposing colored point
				return false;
			}

			if (this.isType(GATE)) {
				return false;
			}

			return true;
		} else if (tile.type === SPECIAL_FLOWER) {
			return true;
		} else if (tile.type === ACCENT_TILE) {
			return true;
		}

		return false;
	}

	/** Standard BoardPoint function (unused) */
	betweenPlayerHarmony(player) {
		if (player === GUEST) {
			return this.betweenHarmonyGuest;
		} else if (player === HOST) {
			return this.betweenHarmonyHost;
		}
		return false;
	}

	/**
	 * Set this.moveDistanceRemaining.
	 * @param {any} movementInfo - (Unused)
	 * @param {any} distanceRemaining
	 */
	setMoveDistanceRemaining(movementInfo, distanceRemaining) {
		this.moveDistanceRemaining = distanceRemaining;
	}

	/** @returns {any} this.moveDistanceRemaining */
	getMoveDistanceRemaining( /* movementInfo */) {
		return this.moveDistanceRemaining;
	}

	/** Sets this.moveDistanceRemaining to null. */
	clearPossibleMovementTypes() {
		this.moveDistanceRemaining = null;
	}

	/**
	 * Get new deep copy of SkudPaiShoBoardPoint.
	 * @returns {SkudPaiShoBoardPoint}
	 */
	getCopy() {
		const copy = new SkudPaiShoBoardPoint();

		// this.types
		for (let i = 0; i < this.types.length; i++) {
			copy.types.push(this.types[i]);
		}

		// this.row
		copy.row = this.row;
		// this.col
		copy.col = this.col;

		// tile
		if (this.hasTile()) {
			copy.tile = this.tile.getCopy();
		}

		return copy;
	}
}



