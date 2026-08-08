// Common Notation Objects and Variables

export const GUEST = "GUEST";
export const HOST = "HOST";
export const OTHER_PLAYER = "OTHER";

// Turn actions ----------------
export const PLANTING = "Planting";
export const ARRANGING = "Arranging";

export const DEPLOY = "Deploy";
export const MOVE = "Move";
export const SETUP = "Setup";	// Because it is shorter than the old existing "Initial Setup" string

export const TEAM_SELECTION = "Team Selection";

export const INITIAL_SETUP = "Initial Setup";
// -----------------------------

export const DRAW_OFFER = "~~"; //"≈";
export const DRAW_REFUSE = "=/="; //"≠";
export const DRAW_ACCEPT = "==";
export const PASS_TURN = "--";

const rowAndColumnCache = new Map();
const notationPointCache = new Map();

// =========================================================
// RowAndColumn Object
// =========================================================

/**
 * General numeric representation of a point on a Pai Sho Board
 * @class
 * @property {number} row - Always positive
 * @property {number} col - Always positive
 * @property {number} x - Positive or negative (centered on 0)
 * @property {number} y - Positive or negative (centered on 0)
 * @property {string} notationPointString - Pattern: "x,y"
 */
export function RowAndColumn(row, col) {
	const cacheKey = row + "," + col;
	const cached = rowAndColumnCache.get(cacheKey);
	if (cached) return cached;

	const instance = this;
	/** @type {number} */
	instance.row = row;
	/** @type {number} */
	instance.col = col;
	
	/** @type {number} */
	instance.x = col - 8;
	/** @type {number} */
	instance.y = 8 - row;
	/** @type {string} */
	instance.notationPointString = instance.x + "," + instance.y;

	rowAndColumnCache.set(cacheKey, instance);
	return instance;
}

/**
 * Check equality of 2 RowAndColumn Objects
 * @param {RowAndColumn} other
 * @returns {boolean} Are equal.
 */
RowAndColumn.prototype.samesies = function(other) {
	return this.row === other.row && this.col === other.col;
};

/**
 * Gets NotationPoint object from this.notationPointString
 * @returns {NotationPoint}
 */
RowAndColumn.prototype.getNotationPoint = function() {
	return new NotationPoint(this.notationPointString);
};

// =========================================================
// NotationPoint Object
// =========================================================

/**
 * General text representation of a point on a Pai Sho Board
 * @class
 * @property {string} pointText - Pattern: "x,y"
 * @property {number} x - Positive or negative (centered on 0)
 * @property {number} y - Positive or negative (centered on 0)
 * @property {RowAndColumn} rowAndColumn - RowAndColumn representation of same point
 */
export function NotationPoint(text) {
	const cached = notationPointCache.get(text);
	if (cached) return cached;

	const instance = this;
	instance.pointText = text;

	const parts = instance.pointText.split(',');

	instance.x = parseInt(parts[0], 10);
	instance.y = parseInt(parts[1], 10);

	const col = instance.x + 8;
	const row = Math.abs(instance.y - 8);

	instance.rowAndColumn = new RowAndColumn(row, col);
	notationPointCache.set(text, instance);
	return instance;
}

/**
 * Check equality of 2 NotationPoint Objects
 * @param {NotationPoint} other
 * @returns {boolean} Are equal.
 */
NotationPoint.prototype.samesies = function(other) {
	return this.x === other.x && this.y === other.y;
};

/**
 * @returns {number[]} Format: [this.x, this.y]
 */
NotationPoint.prototype.toArr = function() {
	return [this.x, this.y];
};

