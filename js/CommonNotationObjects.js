// Common Notation Objects and Variables

export var GUEST = "GUEST";
export var HOST = "HOST";
export var OTHER_PLAYER = "OTHER";

// Turn actions ----------------
export var PLANTING = "Planting";
export var ARRANGING = "Arranging";

export var DEPLOY = "Deploy";
export var MOVE = "Move";
export var SETUP = "Setup";	// Because it is shorter than the old existing "Initial Setup" string

export var TEAM_SELECTION = "Team Selection";

export var INITIAL_SETUP = "Initial Setup";
// -----------------------------

export var DRAW_OFFER = "~~"; //"≈";
export var DRAW_REFUSE = "=/="; //"≠";
export var DRAW_ACCEPT = "==";
export var PASS_TURN = "--";

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
	/** @type {number} */
	this.row = row;
	/** @type {number} */
	this.col = col;
	
	/** @type {number} */
	this.x = col - 8;
	/** @type {number} */
	this.y = 8 - row;
	/** @type {string} */
	this.notationPointString = this.x + "," + this.y;
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
	this.pointText = text;

	var parts = this.pointText.split(',');

	this.x = parseInt(parts[0]);
	this.y = parseInt(parts[1]);

	var col = this.x + 8;
	var row = Math.abs(this.y - 8);

	this.rowAndColumn = new RowAndColumn(row, col);
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

