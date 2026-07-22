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

// Bit flags to define state of each SkudPaiShoBoardPoint
export const RED_BIT			= 0b0000001; // White basic flowers can't land on red points
export const WHITE_BIT			= 0b0000010; // Red basic flowers can't land on red points
export const NON_PLAYABLE_BIT	= 0b0000100; // Point isn't in playable area (used since board is a circle)
export const NEUTRAL_BIT		= 0b0001000; // White and red flowers can land here
export const GATE_BIT			= 0b0010000; // Flowers can only be planted here
export const MARKED_BIT			= 0b0100000; // Styles currently selected point in actuator (Visual only)
export const POSSIBLE_MOVE_BIT	= 0b1000000; // Used to display legal moves for the currently selected tile (Visual only)

export var thinDot = "·";
export var thickDot = "•";
export var whiteDot = "◦";
export var gateDot = "⟡";

export class SkudPaiShoBoardPoint {
	constructor() {
		/** @type {number} Binary number where each bit sets the state of the point */
		this.types = 0b0000000; // No bit flags set
		/** @type {number} */
		this.row = -1;
		/** @type {number} */
		this.col = -1;
		/** @type {?SkudPaiShoTile} */
		this.tile = null;
		/** @type {number} */
		this.moveDistanceRemaining = -1;
	}

	// =========================================================
	// SkudPaiShoBoardPoint Member Functions
	// =========================================================
	
	/**
	 * Add binary type flag to this.types.
	 * @param {number} type - Type to be added.
	 */
	addType(type) {
		this.types |= type;
	}
	
	/**
	 * Remove binary type flag from this.types.
	 * @param {number} type - Type to be removed.
	 */
	removeType(type) {
		this.types &= ~type; // Do AND NOT with type so all bits are retained except the type we want to subtract
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
		if (tile instanceof SkudPaiShoTile) tile.bp = this;
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
	 * Checks if SkudPaiShoBoardPoint has type flag set in this.types.
	 * @param {number} type - Bitwise flag
	 * @returns {boolean}
	 */
	isType(type) {
		return (this.types & type) !== 0;
	}

	/**
	 * Checks if SkudPaiShoBoardPoint has type "GATE" and no tile
	 * @returns {boolean}
	 */
	isOpenGate() {
		return !this.hasTile() && this.isType(GATE_BIT);
	}

	/**
	 * Remove tile from this.tile.
	 * @returns {SkudPaiShoTile} The removed tile.
	 */
	removeTile() {
		const theTile = this.tile;
		if (theTile instanceof SkudPaiShoTile) theTile.bp = null;

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
		if (this.isType(NON_PLAYABLE_BIT) || this.isType(GATE_BIT)) {
			return false;
		// This function does not take into account capturing abilities
		} else if (!ignoreTileCheck && this.hasTile()) {
			return false;
		// For basic flowers, can't move into opposing colored garden
		} else if (tile.type === BASIC_FLOWER) {
			if (this.isType(NEUTRAL_BIT)) return true;
			if (tile.basicColorName === RED && this.isType(RED_BIT)) return true;
			if (tile.basicColorName === WHITE && this.isType(WHITE_BIT)) return true;
			return false;
		// Garden color rules don't apply to special flowers and accents
		} else if (tile.type === SPECIAL_FLOWER || tile.type === ACCENT_TILE) {
			return true;
		}

		return false; // Fallback to false if unrecognized tile is passed in
	}

	/**
	 * Set this.moveDistanceRemaining.
	 * @param {any} distanceRemaining
	 */
	setMoveDistanceRemaining(distanceRemaining) {
		this.moveDistanceRemaining = distanceRemaining;
	}

	/** @returns {any} this.moveDistanceRemaining */
	getMoveDistanceRemaining() {
		return this.moveDistanceRemaining;
	}

	/** Sets this.moveDistanceRemaining to 0. */
	clearPossibleMovementTypes() {
		this.moveDistanceRemaining = -1;
	}

	/**
	 * Get new deep copy of SkudPaiShoBoardPoint.
	 * @returns {SkudPaiShoBoardPoint}
	 */
	getCopy() {
		const copy = new SkudPaiShoBoardPoint();

		copy.row = this.row;
		copy.col = this.col;
		copy.types = this.types;

		// Copy Tile
		if (this.hasTile()) {
			copy.tile = this.tile.getCopy();
			copy.tile.bp = this;
		}

		return copy;
	}

	/**
	 * Checks if 2 SkudPaiShoBoardPoints are equal
	 * @param {SkudPaiShoBoardPoint} otherBp
	 * @returns {boolean} Are equal.
	 */
	equals(otherBp) {
		return this.row === otherBp.row && this.col === otherBp.col;
	}
}



