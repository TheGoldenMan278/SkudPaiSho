/* Skud Pai Sho Tile */

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
  SPECIAL_FLOWER,
  WHEEL,
  WHITE_LOTUS,
  debug,
} from '../GameData';
import {
  newOrchidClashRule,
  superHarmonies
} from './SkudPaiShoRules';
import { GUEST, HOST } from "../CommonNotationObjects";
import { SkudPaiShoBoardPoint } from './SkudPaiShoBoardPoint';

export var RED = "Red";
export var WHITE = "White";

export var tileId = 1;
/** Increment Unique Id by 1 each time new tile is created */
export function tileIdIncrement() {
	tileId++;
	return tileId;
}

/**
 * Represents a Skud Pai Sho Tile
 * @class
 * @property {string} code - 1-2 Letter Code to define tile type (Ex. R3 = Rose, L = White Lotus, W = Wheel)
 * @property {string} ownerCode - "H" or "G" for "HOST" or "GUEST"
 * @property {string} ownerName - "HOST" or "GUEST"
 * @property {number} id - Unique ID, increments by 1 for each new tile
 * @property {boolean} drained - Is drained
 * @property {boolean} selectedFromPile - Is selected from pile
 * @property {string} type - "BASIC_FLOWER" or "SPECIAL_FLOWER" or "ACCENT_TILE"
 * @property {string} basicColorCode - "R" or "W": Red or White for Basic Flowers
 * @property {string} basicValue - "1", "2", or "3": Movement amount for Basic Flowers
 * @property {string} basicColorName - "RED" or "WHITE" for Basic Flowers
 * @property {SkudPaiShoBoardPoint?} bp - Position of tile if it is placed and not captured
 */
export class SkudPaiShoTile {
	/**
	 * @param {string} code - 1-2 Letter Code to define tile type (Ex. R3 = Rose, L = White Lotus, W = Wheel)
	 * @param {string} ownerCode - "H" or "G" for "HOST" or "GUEST"
	 */
	constructor(code, ownerCode) {
		this.code = code;
		this.ownerCode = ownerCode;
		if (this.ownerCode === 'G') {
			this.ownerName = GUEST;
		} else if (this.ownerCode === 'H') {
			this.ownerName = HOST;
		} else {
			debug("INCORRECT OWNER CODE");
		}
		this.id = tileIdIncrement();
		this.drained = false;
		this.selectedFromPile = false;

		if (this.code.length === 2 && (this.code.includes('R') || this.code.includes('W'))) {
			this.type = BASIC_FLOWER;
			this.basicColorCode = this.code.charAt(0);
			this.basicValue = this.code.charAt(1);
			if (this.basicColorCode === 'R') {
				this.basicColorName = RED;
			} else if (this.basicColorCode === 'W') {
				this.basicColorName = WHITE;
			}
		} else if (this.code === 'L' || this.code === 'O') {
			this.type = SPECIAL_FLOWER;
			this.setSpecialFlowerInfo();
		} else if (this.code === 'R' || this.code === 'W' || this.code === 'K' || this.code === 'B'
					|| this.code === 'P' || this.code === 'M' || this.code === 'T') {
			this.type = ACCENT_TILE;
			this.setAccentInfo();
		} else {
			debug("Error: Unknown tile type");
		}
		/** @type {SkudPaiShoBoardPoint?} */
		this.bp = null;
	}

	/** Set this.accentType based on this.code */
	setAccentInfo() {
		if (this.code === 'R') {
			this.accentType = ROCK;
		} else if (this.code === 'W') {
			this.accentType = WHEEL;
		} else if (this.code === 'K') {
			this.accentType = KNOTWEED;
		} else if (this.code === 'B') {
			this.accentType = BOAT;
		} else if (this.code === 'P') {
			this.accentType = POND;
		} else if (this.code === 'M') {
			this.accentType = BAMBOO;
		} else if (this.code === 'T') {
			this.accentType = LION_TURTLE;
		}
	}

	/** Set this.specialFlowerType based on this.code */
	setSpecialFlowerInfo() {
		if (this.code === 'L') {
			this.specialFlowerType = WHITE_LOTUS;
		} else if (this.code === 'O') {
			this.specialFlowerType = ORCHID;
		}
	}

	/**
	 * Get text representation of this SkudPaiShoTile.
	 * @returns {string}
	 */
	getConsoleDisplay() {
		if (!this.drained) {
			return this.ownerCode + "" + this.code;
		} else {
			return "*" + this.code;
		}
	}

	/** @returns {string} */
	getImageName() {
		return this.ownerCode + "" + this.code;
	}

	/**
	 * Checks if this SkudPaiShoTile forms harmony with otherTile.
	 * @param {SkudPaiShoTile} otherTile - Other tile to check harmony with.
	 * @param {boolean} surroundsLionTurtle - Is adjacent to Lion Turtle Accent Tile.
	 * @returns {boolean}
	 */
	formsHarmonyWith(otherTile, surroundsLionTurtle) {
		if (!(this.type === BASIC_FLOWER || this.code === 'L')
			|| !(otherTile.type === BASIC_FLOWER || otherTile.code === 'L')) {
			return false;
		}

		if ((this.code === 'L' && otherTile.type !== BASIC_FLOWER)
			|| (otherTile.code === 'L' && this.type !== BASIC_FLOWER)) {
			return false;
		}

		if (this.drained || otherTile.drained) {
			return false;
		}

		// Check White Lotus (Lotus can belong to either player)
		if ((this.code === 'L' && otherTile.type === BASIC_FLOWER)
			|| (otherTile.code === 'L' && this.type == BASIC_FLOWER)) {
			return true;
		}

		// For normal Harmonies, tiles must belong to same player
		if (!surroundsLionTurtle && otherTile.ownerName !== this.ownerName) {
			return false;
		}

		// Same color and number difference of 1
		if (this.basicColorCode === otherTile.basicColorCode && Math.abs(this.basicValue - otherTile.basicValue) === 1 || surroundsLionTurtle) {
			return true;
			// if not that, check different color and number difference of 2?
		} else if (this.basicColorCode !== otherTile.basicColorCode && Math.abs(this.basicValue - otherTile.basicValue) === 2 || surroundsLionTurtle) {
			return true;
		}

		if (superHarmonies && this.basicValue !== otherTile.basicValue) {
			return true;
		}
	}

	/**
	 * Checks if this SkudPaiShoTile clashes with otherTile.
	 * @param {SkudPaiShoTile} otherTile - Other tile to check clash with.
	 * @returns {boolean}
	 */
	clashesWith(otherTile) {
		if (newOrchidClashRule) {
			if (this.ownerName !== otherTile.ownerName) {
				if (this.specialFlowerType === ORCHID || otherTile.specialFlowerType === ORCHID) {
					return true;
				}
			}
		}

		return (this.type === BASIC_FLOWER && otherTile.type === BASIC_FLOWER
			&& this.basicColorCode !== otherTile.basicColorCode
			&& this.basicValue === otherTile.basicValue);
	}

	/**
	 * Returns number of spaces this SkudPaiShoTile can move.
	 * @returns {number}
	 */
	getMoveDistance() {
		if (this.type === BASIC_FLOWER) {
			return parseInt(this.basicValue);
		} else if (this.code === 'L') {
			return 2;
		} else if (this.code === 'O') {
			return 6;
		}
		return 0;
	}

	/** Set this.drained to true if basic flower. */
	drain() {
		if (this.type === BASIC_FLOWER) {
			this.drained = true;
		}
	}
	
	/** Set this.drained to false. */
	restore() {
		this.drained = false;
	}

	/**
	 * Returns full word name of tile.
	 * @returns {string}
	 */
	getName() {
		return SkudPaiShoTile.getTileName(this.code);
	}

	/**
	 * Get new deep copy of SkudPaiShoTile.
	 * @returns {SkudPaiShoTile}
	 */
	getCopy() {
		return new SkudPaiShoTile(this.code, this.ownerCode);
	}

	/**
	 * Get full word tile name from tile code.
	 * Example: R3 = Rose (Red 3)
	 * @returns {string}
	 */
	static getTileName(tileCode) {
		let name = "";

		if (tileCode.length > 1) {
			const colorCode = tileCode.charAt(0);
			const tileNum = tileCode.charAt(1);

			if (colorCode === 'R') {
				if (tileNum === '3') {
					name = "Rose";
				} else if (tileNum === '4') {
					name = "Chrysanthemum";
				} else if (tileNum === '5') {
					name = "Rhododendron";
				}
				name += " (Red " + tileNum + ")";
			} else if (colorCode === 'W') {
				if (tileNum === '3') {
					name = "Jasmine";
				} else if (tileNum === '4') {
					name = "Lily";
				} else if (tileNum === '5') {
					name = "White Jade";
				}
				name += " (White " + tileNum + ")";
			}
		} else {
			if (tileCode === 'R') {
				name = "Rock";
			} else if (tileCode === 'W') {
				name = "Wheel";
			} else if (tileCode === 'K') {
				name = "Knotweed";
			} else if (tileCode === 'B') {
				name = "Boat";
			} else if (tileCode === 'O') {
				name = "Orchid";
			} else if (tileCode === 'L') {
				name = "White Lotus";
			} else if (tileCode === 'P') {
				name = "Pond";
			} else if (tileCode === 'M') {
				name = "Bamboo";
			} else if (tileCode === 'T') {
				name = "Lion Turtle";
			}
		}

		return name;
	}

	/**
	 * Get tile code that clashes with given tile code.
	 * Example: R3 = W3
	 * @returns {string}
	 */
	static getClashTileCode(tileCode) {
		if (tileCode.length === 2) {
			if (tileCode.startsWith("R")) {
				return "W" + tileCode.charAt(1);
			} else if (tileCode.startsWith("W")) {
				return "R" + tileCode.charAt(1);
			}
		}
	}
}

// Tile.getTileHeading = function(tileCode) {
// 	var heading = Tile.getTileName(tileCode);

// 	if (tileCode.length ===  1) {
// 		return heading;
// 	}

// 	// For Basic Flower Tile, add simple name (like "Red 3")

// 	heading += " (";
// 	if ()
// };
