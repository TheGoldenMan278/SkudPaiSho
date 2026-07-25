/* Skud Pai Sho Harmony */

import { BASIC_FLOWER, debug } from '../GameData';
import { completeHarmony } from './SkudPaiShoRules';
import {
	GUEST,
	HOST,
	NotationPoint,
	RowAndColumn,
} from '../CommonNotationObjects';
import { SkudPaiShoTile } from './SkudPaiShoTile';

/**
 * Represents a harmony relationship between 2 Skud Pai Sho Tiles
 * @class
 * @property {SkudPaiShoTile} tile1 - 1st Tile in harmony
 * @property {SkudPaiShoTile} tile2 - 2nd Tile in harmony
 * @property {RowAndColumn} tile1Pos - Position of tile1
 * @property {RowAndColumn} tile2Pos - Position of tile2
 * @property {object[]} owners - List of owners containing "ownerCode" and "ownerName"
 * @property {boolean?} overwriteOtherHarmonyEntries
 */
export class SkudPaiShoHarmony {
	/**
	 * @param {SkudPaiShoTile} tile1 - 1st Tile in harmony
	 * @param {RowAndColumn} tile1RowAndColumn - Position of tile1
	 * @param {SkudPaiShoTile} tile2 - 2nd Tile in harmony
	 * @param {RowAndColumn} tile2RowAndColumn - Position of tile2
	 * @param {SkudPaiShoTile[]} affectingLionTurtleTiles - List of lion turtle tiles causing tile1 or tile2 to form a harmony
	 */
	constructor(tile1, tile1RowAndColumn, tile2, tile2RowAndColumn, affectingLionTurtleTiles) {
		this.tile1 = tile1;
		this.tile1Pos = new RowAndColumn(tile1RowAndColumn.row, tile1RowAndColumn.col);
		this.tile2 = tile2;
		this.tile2Pos = new RowAndColumn(tile2RowAndColumn.row, tile2RowAndColumn.col);
		this.owners = [];

		const overrideOwner = affectingLionTurtleTiles.length > 0 && tile1.ownerCode !== tile2.ownerCode;

		if (overrideOwner) {
			for (let i = 0; i < affectingLionTurtleTiles.length; i++) {
				this.addOwner(affectingLionTurtleTiles[i].ownerCode, affectingLionTurtleTiles[i].ownerName);
			}
			this.overwriteOtherHarmonyEntries = true;
		} else {
			if (this.tile1.type === BASIC_FLOWER) {
				this.addOwner(this.tile1.ownerCode, this.tile1.ownerName);
			} else if (this.tile2.type === BASIC_FLOWER) {
				this.addOwner(this.tile2.ownerCode, this.tile2.ownerName);
			} else {
				debug("ERROR: HARMONY REQUIRES A BASIC FLOWER TILE");
			}
		}
	}

	/**
	 * Add owner object to this.owners
	 * @param {string} ownerCode - "H" or "G" for "HOST" or "GUEST"
	 * @param {string} ownerName - "HOST" or "GUEST"
	*/
	addOwner(ownerCode, ownerName) {
		if (!this.hasOwner(ownerName)) {
			this.owners.push({
				ownerCode: ownerCode,
				ownerName: ownerName
			});
		}
	}

	/**
	 * Checks if harmony already has owner with ownerName
	 * @param {string} ownerName - "HOST" or "GUEST"
	 * @returns {boolean}
	*/
	hasOwner(ownerName) {
		for (let i = 0; i < this.owners.length; i++) {
			if (this.owners[i].ownerName === ownerName) {
				return true;
			}
		}
	}

	/**
	 * Checks if this is the same as otherHarmony
	 * @param {SkudPaiShoHarmony} otherHarmony
	 * @returns {boolean}
	*/
	equals(otherHarmony) {
		if (this.tile1 === otherHarmony.tile1 || this.tile1 === otherHarmony.tile2) {
			if (this.tile2 === otherHarmony.tile1 || this.tile2 === otherHarmony.tile2) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks if this is in a list of harmonies
	 * @param {SkudPaiShoHarmony[]} harmonies
	 * @returns {boolean}
	*/
	notAnyOfThese(harmonies) {
		for (let i = 0; i < harmonies.length; i++) {
			if (this.equals(harmonies[i])) return false;
		}
		return true;
	}

	/**
	 * Checks if tile is a part of this harmony
	 * @param {SkudPaiShoTile} tile
	 * @returns {boolean}
	*/
	containsTile(tile) {
		return (this.tile1 === tile || this.tile2 === tile);
	}

	/**
	 * Given one tile in harmony, returns other tile that makes up the harmony
	 * @param {SkudPaiShoTile} tile
	 * @returns {SkudPaiShoTile}
	*/
	getTileThatIsNotThisOne(tile) {
		if (this.tile1 === tile) {
			return this.tile2;
		} else if (this.tile2 === tile) {
			return this.tile1;
		} else {
			debug("BOTH TILES ARE NOT THAT ONE!");
		}
	}

	/**
	 * Checks if harmony contains a tile with the given position
	 * @param {RowAndColumn} pos
	 * @returns {boolean}
	*/
	containsTilePos(pos) {
		return this.tile1Pos.samesies(pos) || this.tile2Pos.samesies(pos);
	}

	/**
	 * Given one tile's position in harmony, returns other tile's position
	 * @param {RowAndColumn} pos
	 * @returns {RowAndColumn}
	*/
	getPosThatIsNotThisOne(pos) {
		if (this.tile1Pos.samesies(pos)) {
			return this.tile2Pos;
		} else if (this.tile2Pos.samesies(pos)) {
			return this.tile1Pos;
		} else {
			debug("	BOTH TILE POS ARE NOT THAT ONE!");
		}
	}

	/**
	 * Gets string representation of this harmony
	 * Format: owners (tile1Pos.notationPointString)-(tile2Pos.notationPointString)
	 * @returns {string}
	*/
	getString() {
		return this.owners + " (" + this.tile1Pos.notationPointString + ")-(" + this.tile2Pos.notationPointString + ")";
	}

	/**
	 * Given one tile in harmony, get direction to the other tile in the harmony
	 * @param {SkudPaiShoTile} tile
	 * @returns {string} "North", "East", "South", or "West"
	*/
	getDirectionForTile(tile) {
		if (!this.containsTile(tile)) return;

		let thisPos = this.tile1Pos;	// Assume it's tile1
		let otherPos = this.tile2Pos;
		if (this.tile2.id === tile.id) {
			thisPos = this.tile2Pos;	// It's tile2!
			otherPos = this.tile1Pos;
		}

		if (thisPos.row === otherPos.row) {
			// Same row means East or West
			return thisPos.col < otherPos.col ? "East" : "West";
		} else if (thisPos.col === otherPos.col) {
			// Same col means North or South
			return thisPos.row > otherPos.row ? "North" : "South";
		}
	}

	/**
	 * Checks if this harmony crosses a midline
	 * @param {boolean} midlineAllowed - Is a tile allowed to be directly on the midline
	 * @returns {boolean}
	*/
	crossesCenter(midlineAllowed = false) {
		// Horizontal harmony
		if (this.tile1Pos.row === this.tile2Pos.row) {
			let rowHigh = this.tile1Pos.row;
			let rowLow = this.tile2Pos.row;
			if (this.tile1Pos.row < this.tile2Pos.row) {
				rowHigh = this.tile2Pos.row;
				rowLow = this.tile1Pos.row;
			}
	
			return rowHigh > 8 && rowLow < 8 && (this.tile1Pos.col !== 8 || midlineAllowed);
			
		// Vertical harmony
		} else if (this.tile1Pos.col === this.tile2Pos.col) {
			let colHigh = this.tile1Pos.col;
			let colLow = this.tile2Pos.col;
			if (this.tile1Pos.col < this.tile2Pos.col) {
				colHigh = this.tile2Pos.col;
				colLow = this.tile1Pos.col;
			}

			return colHigh > 8 && colLow < 8 && (this.tile1Pos.row !== 8 || midlineAllowed);
		}
	}
}


// --------------------------------------------- //


/**
 * Manages list of all harmonies in game for both players
 * @class
 * @property {SkudPaiShoHarmony[]} harmnonies
 */
export class SkudPaiShoHarmonyManager {
	constructor() {
		/** @type {SkudPaiShoHarmony[]} */
		this.harmonies = [];
	}

	// =========================================================
	// Utility Functions
	// =========================================================

	/** Debug print this.harmonies */
	printHarmonies() {
		debug("All Harmonies:");
		for (let i = 0; i < this.harmonies.length; i++) {
			debug(this.harmonies[i].getString());
		}
	}

	/**
	 * Gets list of all harmonies containing given tile
	 * @param {SkudPaiShoTile} tile
	 * @returns {SkudPaiShoHarmony[]}
	*/
	getHarmoniesWithThisTile(tile) {
		const results = [];
		for (const harmony of this.harmonies) {
			if (!harmony.containsTile(tile)) continue;
			results.push(harmony);
		}
		return results;
	}

	/**
	 * Add harmony to this.harmonies if it doesn't already exist
	 * Note: Will remove previous entries and push to end of array if "overwriteOtherHarmonyEntries" is true
	 * @param {SkudPaiShoHarmony} harmony
	*/
	addHarmony(harmony) {
		// Does it exist in old set of harmonies?
		const harmonyIndexesToRemove = [];
		let exists = false;
		for (let i = 0; i < this.harmonies.length; i++) {
			if (!harmony.equals(this.harmonies[i])) continue;

			if (harmony.overwriteOtherHarmonyEntries) {
				harmonyIndexesToRemove.push(i);
			} else {
				exists = true;
			}
		}

		for (let i = 0; i < harmonyIndexesToRemove.length; i++) {
			this.harmonies.splice(harmonyIndexesToRemove[i], 1);
		}

		if (!exists) this.harmonies.push(harmony);
	}

	/** Set this.harmonies back to empty */
	clearList() {
		this.harmonies = [];
	}

	// =========================================================
	// Harmony Count Functions
	// =========================================================

	/**
	 * Checks how many harmonies given player has
	 * @param {string} player - "HOST" or "GUEST"
	 * @returns {number} Count
	*/
	numHarmoniesForPlayer(player) {
		let count = 0;
		for (let i = 0; i < this.harmonies.length; i++) {
			if (this.harmonies[i].hasOwner(player)) count++;
		}
		return count;
	}

	/**
	 * Checks which player has the most harmonies
	 * @returns {string} - "HOST" or "GUEST"
	*/
	getPlayerWithMostHarmonies() {
		const hostCount = this.numHarmoniesForPlayer(HOST);
		const guestCount = this.numHarmoniesForPlayer(GUEST);

		if (guestCount > hostCount) {
			return GUEST;
		} else if (hostCount > guestCount) {
			return HOST;
		}
	}

	/**
	 * Checks which player has the most harmonies crossing the midlines (not counting tile on midline)
	 * @returns {string} - "HOST" or "GUEST"
	*/
	getPlayerWithMostHarmoniesCrossingMidlines() {
		const hostCount = this.getNumCrossingCenterForPlayer(HOST, false);
		const guestCount = this.getNumCrossingCenterForPlayer(GUEST, false);

		debug("Host harmonies crossing midlines: " + hostCount);
		debug("Guest harmonies crossing midlines: " + guestCount);

		if (guestCount > hostCount) {
			return GUEST;
		} else if (hostCount > guestCount) {
			return HOST;
		}
	}

	/**
	 * Checks how many harmonies given player has crossing the board center
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {boolean} midlineAllowed - Count harmonies with a tile on the midline
	 * @returns {number} Count
	*/
	getNumCrossingCenterForPlayer(player, midlineAllowed) {
		let count = 0;
		for (let i = 0; i < this.harmonies.length; i++) {
			if (!this.harmonies[i].hasOwner(player)) continue;

			if (this.harmonies[i].crossesCenter(midlineAllowed)) count++;
		}
		return count;
	}

	/**
	 * Gets length of longest built-up harmony ring for given player
	 * TODO: Fix because I think this will do nothing since "getHarmonyRings" only returns full rings
	 * @param {string} player - "HOST" or "GUEST"
	 * @returns {number} Longest ring count
	*/
	ringLengthForPlayer(player) {
		const rings = this.getHarmonyRings();
		let longest = 0;

		for (let i = 0; i < rings.length; i++) {
			const ring = rings[i];
			const h = ring.pop();	// LOL
			if (h.hasOwner(player)) {
				const veryNice = true;
				if (veryNice && ring.length > longest) {
					longest = ring.length;
				}
			}
		}

		return longest;
	}

	/**
	 * Checks which player has the longest built-up harmony ring
	 * @returns {string} - "HOST" or "GUEST"
	*/
	getPlayerWithLongestChain() {
		const hostLength = this.ringLengthForPlayer(HOST);
		const guestLength = this.ringLengthForPlayer(GUEST);

		if (guestLength > hostLength) {
			return GUEST;
		} else if (hostLength > guestLength) {
			return HOST;
		}
	}

	/**
	 * Checks if given player's tile has a harmony with a tile it didn't before
	 * Note: Checks "oldHarmonies" arg against this.harmonies
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {SkudPaiShoHarmony[]} oldHarmonies
	 * @returns {boolean}
	*/
	hasNewHarmony(player, oldHarmonies) {
		// Array "some" means only one element has to pass the check to return true
		return this.harmonies.some(harmony => 
			// Does potential new harmony belong to player?
			harmony.hasOwner(player) && 
			// Does potential new harmony not already exist in "oldHarmonies"?
			!oldHarmonies.some(oldHarmony => 
				oldHarmony.hasOwner(player) && oldHarmony.equals(harmony)
			)
		);
	}

	// =========================================================
	// Harmony Ring Functions
	// =========================================================

	/**
	 * Gets all complete harmony rings for both players
	 * @returns {SkudPaiShoHarmony[][]}
	*/
	getHarmonyRings() {
		const rings = [];

		for (let i = 0; i < this.harmonies.length; i++) {
			const hx = this.harmonies[i];
			
			const startTile = hx.tile2;
			const targetTile = hx.tile1;
			const chain = [hx];

			const foundRings = this.lookForRings(startTile, targetTile, chain);

			if (foundRings.length <= 0) continue;

			for (const ringThatWasFound of foundRings) {
				// Check if at least one ring in "rings" matches "ringThatWasFound"
				const ringExists = rings.some(ring => this.ringsMatch(ring, ringThatWasFound));
				
				if (!ringExists) rings.push(ringThatWasFound);
			}
		}

		if (rings.length > 0) {
			debug("Rings Found:");
			debug(rings);
		}

		return rings;
	}

	/**
	 * Check if there is any complete harmony ring around the board center, meaning a player won
	 * @returns {string[]} Will contain names of any winners or be empty list if no winners
	*/
	harmonyRingExists() {
		const rings = this.getHarmonyRings();

		const verifiedHarmonyRingOwners = [];
		for (const ring of rings) {
			debug(ring);
			const playerName = this.verifyHarmonyRing(ring);
			if (playerName) {
				verifiedHarmonyRingOwners.push(playerName);
			}
		}

		// return verifiedHarmonyRings.length > 0;
		return verifiedHarmonyRingOwners;
	}

	/**
	 * Check harmony ring contains tiles with movement of 3, 4, and 5
	 * Note: Only checked when optional "Complete Harmony" rule is enabled
	 * @param {SkudPaiShoHarmony[]} ring
	 * @returns {boolean}
	*/
	ringContains345(ring) {
		let has3 = false, has4 = false, has5 = false;
		for (let i = 0; i < ring.length; i++) {
			const h = ring[i];
			if (h.tile1.basicValue === '3' || h.tile2.basicValue === '3') has3 = true;
			if (h.tile1.basicValue === '4' || h.tile2.basicValue === '4') has4 = true;
			if (h.tile1.basicValue === '5' || h.tile2.basicValue === '5') has5 = true;
		}

		return has3 && has4 && has5;
	}

	/**
	 * Check harmonies in ring go around center of board
	 * Note: Only checked when optional "Complete Harmony" rule is enabled
	 * @param {SkudPaiShoHarmony[]} ring
	 * @returns {boolean}
	*/
	verifyHarmonyRing(ring) {
		// If completeHarmony rule, ring must contain harmonies of 3, 4, and 5 flower tiles
		if (completeHarmony && !this.ringContains345(ring)) return false;

		// We have to go through the harmonies and create an array of the points of the 'shape' that the harmony ring makes
		const shapePoints = [];

		// playerName is the player that's an owner on all rings
		let allHaveHost = true;
		let allHaveGuest = true;
		for (let i = 0; i < ring.length; i++) {
			if (!ring[i].hasOwner(HOST)) allHaveHost = false;
			if (!ring[i].hasOwner(GUEST)) allHaveGuest = false;
		}

		let playerNames = "";
		if (allHaveHost && allHaveGuest) {
			playerNames = "Host and Guest";
		} else if (allHaveHost) {
			playerNames = HOST;
		} else if (allHaveGuest) {
			playerNames = GUEST;
		}

		let h = ring.pop();	// LOL

		shapePoints.push(new NotationPoint(h.tile1Pos.notationPointString).toArr());
		shapePoints.push(new NotationPoint(h.tile2Pos.notationPointString).toArr());

		let lastTilePos = h.tile2Pos;

		let count = 0;
		while (ring.length > 0 && count < 400) {
			// Go through ring and find next point in the harmony 'shape'
			for (let i = 0; i < ring.length; i++) {
				h = ring[i];
				if (h.containsTilePos(lastTilePos)) {
					lastTilePos = h.getPosThatIsNotThisOne(lastTilePos);
					const np = new NotationPoint(lastTilePos.notationPointString);
					if (!np.samesies(new NotationPoint(shapePoints[0][0] + "," + shapePoints[0][1]))) {
						shapePoints.push(np.toArr());
					}
					ring.splice(i, 1);
				}
			}
			count++;
			// debug("last tile Pos: " + lastTilePos.notationPointString);
			// ring.forEach(function(h){ debug(h.tile1Pos.notationPointString + " - " + h.tile2Pos.notationPointString); });
			// debug("-----")
		}

		if (count > 390) {
			debug("THERE WAS A PROBLEM CONNECTING THE DOTS");
			return false;
		}

		if (this.isCenterInsideShape(shapePoints)) {
			// debug("WINNER");
			return playerNames;
		} else {
			return false;
		}
	}

	/**
	 * Checks if harmony ring shape surrounds center of board
	 * Note: Based on Winding Number algorithm https://gist.github.com/thejambi/6ae53b6ab2636c8aff367195efeb4f44
	 * @param {number[][]} vs - List of x,y positions of points forming harmony ring
	 * @returns {boolean}
	*/
	isCenterInsideShape(vs) {
		const x = 0;
		const y = 0;

		let wn = 0;
		// var crossesCenterCount = 0;
		// var crossesCenterAllowed = 0;

		for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
			// if (i === 7) {
			// 	crossesCenterAllowed++;
			// }

			const xi = parseFloat(vs[i][0]), yi = parseFloat(vs[i][1]);
			const xj = parseFloat(vs[j][0]), yj = parseFloat(vs[j][1]);

			// If on the line, doesn't count...
			if ((xi === 0 && xj === 0 && yi * yj < 0)
				|| (yi === 0 && yj === 0 && xi * xj < 0)) {
				debug("Crosses center, cannot count");	// Consider allowing a maximum number of "crossing center" harmonies depending on number of harmonies in chain. 4? None allowed. How many can allow for one?
				return false;
				// crossesCenterCount++;
			}

			// If one of the points is 0,0 that won't count...
			if ((xi === 0 && yi === 0) || (xj === 0 && yj === 0)) {
				debug("On center point, cannot count");
				return false;
			}

			if (yj <= y) {
				if (yi > y) {
					if (this.isLeft([xj, yj], [xi, yi], [x, y]) > 0) {
						wn++;
					}
				}
			} else {
				if (yi <= y) {
					if (this.isLeft([xj, yj], [xi, yi], [x, y]) < 0) {
						wn--;
					}
				}
			}
		}

		// return wn != 0 && crossesCenterCount <= crossesCenterAllowed;
		return wn != 0;
	}
	isLeft(P0, P1, P2) {
		const res = ((P1[0] - P0[0]) * (P2[1] - P0[1])
			- (P2[0] - P0[0]) * (P1[1] - P0[1]));
		return res;
	}

	/**
	 * Checks if 2 harmony rings are the same
	 * @param {SkudPaiShoHarmony[]} ring1
	 * @param {SkudPaiShoHarmony[]} ring2
	 * @returns {boolean}
	*/
	ringsMatch(ring1, ring2) {
		// Must be same size to qualify as matching
		if (ring1.length !== ring2.length) return false;

		// Now, check that all harmonies match
		// Look through ring1, every harmony must pass the check of having a equal harmony in ring2
		// Look through ring2, at least one harmony must equal h1 to pass the check
		return ring1.every(h1 => ring2.some(h2 => h1.equals(h2)));
	}

	/**
	 * Recursive function to find any complete harmony rings
	 * @param {SkudPaiShoTile} t1 - Current tile in chain
	 * @param {SkudPaiShoTile} tx - Final tile in chain that would form complete ring
	 * @param {SkudPaiShoHarmony[]} originalChain - In progress list passed back to recursive function
	 * @returns {SkudPaiShoHarmony[][]}
	*/
	lookForRings(t1, tx, originalChain) {
		let rings = [];
		for (let i = 0; i < this.harmonies.length; i++) {
			const currentChain = originalChain.slice();
			const hx = this.harmonies[i];
			if (hx.containsTile(t1) && hx.notAnyOfThese(currentChain)) {
				currentChain.push(hx);
				if (hx.containsTile(tx)) {	// Complete ring found
					rings.push(currentChain);
				} else { // Need to keep searching to see if this ring continues
					const newStartTile = hx.getTileThatIsNotThisOne(t1);
					rings = rings.concat(this.lookForRings(newStartTile, tx, currentChain));
				}
			}
		}
		return rings;
	}
}

// =========================================================
// Harmony Ring Research Archive
// =========================================================

/** Don't touch this magic... 
Polygon shape checking based off of https://github.com/substack/point-in-polygon under MIT License:

The MIT License (MIT)

Copyright (c) 2016 James Halliday

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/
function isPointInsideShape(notationPoint, shapePoints) {
	const x = notationPoint.x;
	const y = notationPoint.y;

	let inside = false;
	for (let i = 0, j = shapePoints.length - 1; i < shapePoints.length; j = i++) {
		const xi = shapePoints[i][0], yi = shapePoints[i][1];
		const xj = shapePoints[j][0], yj = shapePoints[j][1];

		// If on the line, doesn't count...
		if ((xi === x && xj === x && xi * xj)) {
			return false;
		}

		const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) {
			inside = !inside;
		}
	}

	return inside;
}

function isPointInsideShape_alternate(notationPoint, poly) {
	const pt = [notationPoint.x, notationPoint.y];
	let c = false;
	for (let i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
		((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1]))
			&& (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
			&& (c = !c);
	return c;
}

/* Working function */
function isCenterInsideShapeOld(shapePoints) {
	const x = 0;
	const y = 0;
	let inside = false;
	for (let i = 0, j = shapePoints.length - 1; i < shapePoints.length; j = i++) {
		const xi = shapePoints[i][0], yi = shapePoints[i][1];
		const xj = shapePoints[j][0], yj = shapePoints[j][1];

		// If on the line, doesn't count...
		if ((xi === 0 && xj === 0 && yi * yj < 0)
			|| (yi === 0 && yj === 0 && xi * xj < 0)) {
			debug("Crosses center, cannot count");
			return false;
		}

		// If one of the points is 0,0 that won't count...
		if ((xi === 0 && yi === 0) || (xj === 0 && yj === 0)) {
			debug("On center point, cannot count");
			return false;
		}

		const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) {
			inside = !inside;
		}
	}

	return inside;
}
