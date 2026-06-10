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
		/** @type {?SkudPaiShoTile} */
		this.tile = null;
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
		if (this.tile) return true;
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
		if (this.tile) this.tile.drain();
	}

	/**
	 * Restore this.tile if it exists.
	 */
	restoreTile() {
		if (this.tile) this.tile.restore();
	}

	/**
	 * Checks if given tile can be moved onto this SkudPaiShoBoardPoint
	 * (Also used to check valid planting next to pond)
	 * @param {SkudPaiShoTile} tile - Tile to check.
	 * @param {boolean} ignoreTileCheck - Skip checking if SkudPaiShoBoardPoint has a tile already (Used for checking captures)
	 * @returns {boolean} Can hold tile.
	 */
	canHoldTile(tile, ignoreTileCheck) {
		// Can't move to non_playable point or back onto gate
		if (this.isType(NON_PLAYABLE) || this.isType(GATE)) {
			return false;
		// This function does not take into account capturing abilities
		} else if (!ignoreTileCheck && this.hasTile()) {
			return false;
		// For basic flowers, can't move into opposing colored garden
		} else if (tile.type === BASIC_FLOWER) {
			if (!(this.isType(NEUTRAL) || this.isType(tile.basicColorName))) {
				return false;
			}
			return true;
		// Garden color rules don't apply to special flowers and accents
		} else if (tile.type === SPECIAL_FLOWER || tile.type === ACCENT_TILE) {
			return true;
		}

		return false; // Fallback to false if unrecognized tile is passed in
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
		for (const type of this.types) {
			copy.types.push(type);
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



