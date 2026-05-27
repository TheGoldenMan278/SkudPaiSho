/* Skud Pai Sho Tile Manager */

import {
	ACCENT_TILE,
	BASIC_FLOWER,
	SPECIAL_FLOWER,
	copyArray,
	debug,
} from '../GameData';
import {
	simpleCanonRules,
} from './SkudPaiShoRules';
import { GUEST, HOST } from '../CommonNotationObjects';
import {
	NO_WHEELS,
	OPTION_ANCIENT_OASIS_EXPANSION,
	gameOptionEnabled,
} from '../GameOptions';
import { SkudPaiShoTile } from './SkudPaiShoTile';
import {
	getPlayerCodeFromName,
	hostPlayerCode,
} from '../pai-sho-common/PaiShoPlayerHelp';

/**
 * Manages all SkudPaiShoTile classes for the board
 * @class
 * @property {SkudPaiShoTile[]} hostTiles - Array of host's SkudPaiShoTiles
 * @property {SkudPaiShoTile[]} guestTiles - Array of guest's SkudPaiShoTiles
 */
export class SkudPaiShoTileManager {
	/** @param {boolean} forActuating - Manager is only for actuating UI (Not gameplay logic) */
	constructor(forActuating) {
		if (forActuating) {
			this.hostTiles = this.loadOneOfEach('H');
			this.guestTiles = this.loadOneOfEach('G');
			return;
		}
		this.hostTiles = this.loadTileSet('H');
		this.guestTiles = this.loadTileSet('G');

		/* Used to have 2 of each Ancient Oasis tile available, but now just one.
		This is to support old games if someone chose two of something. */
		this.additionalAncientOasisCount = 0;
	}

	/**
	 * Loads starting list of tiles based on rule set.
	 * @param {string} ownerCode - "H" or "G" for "HOST" or "GUEST"
	 * @returns {SkudPaiShoTile[]}
	 */
	loadTileSet(ownerCode) {
		if (simpleCanonRules) {
			return this.loadSimpleCanonSet(ownerCode);
		} else {
			return this.loadSkudSet(ownerCode);
		}
	}

	/**
	 * Loads starting list of tiles for normal rule set.
	 * @param {string} ownerCode - "H" or "G" for "HOST" or "GUEST"
	 * @returns {SkudPaiShoTile[]}
	 */
	loadSkudSet(ownerCode) {
		const tiles = [];

		// 2 of each accent tile
		for (let i = 0; i < 2; i++) {
			tiles.push(new SkudPaiShoTile('R', ownerCode));
			if (!gameOptionEnabled(NO_WHEELS)) {
				tiles.push(new SkudPaiShoTile('W', ownerCode));
			}
			tiles.push(new SkudPaiShoTile('K', ownerCode));
			tiles.push(new SkudPaiShoTile('B', ownerCode));
		}

		/* 1 of each Ancient Oasis Accent Tile if expansion enabled */
		if (gameOptionEnabled(OPTION_ANCIENT_OASIS_EXPANSION)) {
			tiles.push(new SkudPaiShoTile('P', ownerCode));
			tiles.push(new SkudPaiShoTile('M', ownerCode));
			tiles.push(new SkudPaiShoTile('T', ownerCode));
		}

		tiles.forEach(function(tile) {
			tile.selectedFromPile = true;
		});

		// 3 of each basic flower
		for (let i = 0; i < 3; i++) {
			tiles.push(new SkudPaiShoTile("R3", ownerCode));
			tiles.push(new SkudPaiShoTile("R4", ownerCode));
			tiles.push(new SkudPaiShoTile("R5", ownerCode));
			tiles.push(new SkudPaiShoTile("W3", ownerCode));
			tiles.push(new SkudPaiShoTile("W4", ownerCode));
			tiles.push(new SkudPaiShoTile("W5", ownerCode));
		}

		// 1 of each special flower
		tiles.push(new SkudPaiShoTile('L', ownerCode));
		tiles.push(new SkudPaiShoTile('O', ownerCode));

		return tiles;
	}

	/**
	 * Loads starting list of tiles for simple canon rule set.
	 * @param {string} ownerCode - "H" or "G" for "HOST" or "GUEST"
	 * @returns {SkudPaiShoTile[]}
	 */
	loadSimpleCanonSet(ownerCode) {
		const tiles = [];

		// Accent tiles
		for (let i = 0; i < 2; i++) {
			tiles.push(new SkudPaiShoTile('W', ownerCode));
		}

		tiles.forEach(function(tile) {
			tile.selectedFromPile = true;
		});

		// Basic flowers
		for (let i = 0; i < 6; i++) {
			tiles.push(new SkudPaiShoTile("R3", ownerCode));
			tiles.push(new SkudPaiShoTile("W5", ownerCode));
		}

		// Special flowers
		tiles.push(new SkudPaiShoTile('L', ownerCode));
		tiles.push(new SkudPaiShoTile('O', ownerCode));

		return tiles;
	}

	/**
	 * Loads one of every kind of tile for UI actuator.
	 * @param {string} ownerCode - "H" or "G" for "HOST" or "GUEST"
	 * @returns {SkudPaiShoTile[]}
	 */
	loadOneOfEach(ownerCode) {
		const tiles = [];

		tiles.push(new SkudPaiShoTile('R', ownerCode));
		tiles.push(new SkudPaiShoTile('W', ownerCode));
		tiles.push(new SkudPaiShoTile('K', ownerCode));
		tiles.push(new SkudPaiShoTile('B', ownerCode));

		if (gameOptionEnabled(OPTION_ANCIENT_OASIS_EXPANSION)) {
			tiles.push(new SkudPaiShoTile('P', ownerCode));
			tiles.push(new SkudPaiShoTile('M', ownerCode));
			tiles.push(new SkudPaiShoTile('T', ownerCode));
		}

		tiles.push(new SkudPaiShoTile("R3", ownerCode));
		tiles.push(new SkudPaiShoTile("R4", ownerCode));
		tiles.push(new SkudPaiShoTile("R5", ownerCode));
		tiles.push(new SkudPaiShoTile("W3", ownerCode));
		tiles.push(new SkudPaiShoTile("W4", ownerCode));
		tiles.push(new SkudPaiShoTile("W5", ownerCode));

		tiles.push(new SkudPaiShoTile('L', ownerCode));
		tiles.push(new SkudPaiShoTile('O', ownerCode));

		return tiles;
	}

	/**
	 * Splice a tile with given tileCode out of given player's tileset.
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {string} tileCode
	 * @returns {?SkudPaiShoTile}
	 */
	grabTile(player, tileCode) {
		let tilePile = this.hostTiles;
		if (player === GUEST) {
			tilePile = this.guestTiles;
		}

		let tile;
		for (let i = 0; i < tilePile.length; i++) {
			if (tilePile[i].code === tileCode) {
				const newTileArr = tilePile.splice(i, 1);
				tile = newTileArr[0];
				break;
			}
		}

		if (!tile) {
			debug("NONE OF THAT TILE FOUND");
			/* Secretly allow 3 additional Ancient Oasis tiles to be selected */
			if (this.additionalAncientOasisCount < 3) {
				const oasisTileCodes = ['M', 'P', 'T'];
				if (oasisTileCodes.includes(tileCode)) {
					this.additionalAncientOasisCount++;
					tile = new SkudPaiShoTile(tileCode, getPlayerCodeFromName(player));
				}
			}
		}

		return tile;
	}

	/**
	 * Gets number of accent tiles each player starts with for the current rule set.
	 * @returns {number}
	 */
	numberOfAccentTilesPerPlayerSet() {
		const tileSet = this.loadSkudSet(hostPlayerCode);
		let accentTileCount = 0;
		for (let i = 0; i < tileSet.length; i++) {
			if (tileSet[i].type === ACCENT_TILE) {
				accentTileCount++;
			}
		}
		return accentTileCount;
	}

	/**
	 * Get reference to player tile based on tile code or unique ID without removing from tileset.
	 * @param {string} player - "HOST" or "GUEST"
	 * @param {string} tileCode - 1-2 Letter code representing tile type
	 * @param {number} tileId - Unique ID
	 * @returns {SkudPaiShoTile[]}
	 */
	peekTile(player, tileCode, tileId) {
		let tilePile = this.hostTiles;
		if (player === GUEST) {
			tilePile = this.guestTiles;
		}

		let tile;
		if (tileId) {
			for (let i = 0; i < tilePile.length; i++) {
				if (tilePile[i].id === tileId) {
					return tilePile[i];
				}
			}
		}

		for (let i = 0; i < tilePile.length; i++) {
			if (tilePile[i].code === tileCode) {
				tile = tilePile[i];
				break;
			}
		}

		if (!tile) {
			debug("NONE OF THAT TILE FOUND");
		}

		return tile;
	}

	/** Set selectedFromPile to false for all tiles for Host and Guest. */
	removeSelectedTileFlags() {
		this.hostTiles.forEach(function(tile) {
			tile.selectedFromPile = false;
		});
		this.guestTiles.forEach(function(tile) {
			tile.selectedFromPile = false;
		});
	}

	/** Set selectedFromPile to false for all tiles for given player. */
	unselectTiles(player) {
		let tilePile = this.hostTiles;
		if (player === GUEST) {
			tilePile = this.guestTiles;
		}

		tilePile.forEach(function(tile) {
			tile.selectedFromPile = false;
		});
	}

	/**
	 * Reinserts tile into its owner's tileset.
	 * @param {SkudPaiShoTile} tile
	 */
	putTileBack(tile) {
		const player = tile.ownerName;
		let tilePile = this.hostTiles;
		if (player === GUEST) {
			tilePile = this.guestTiles;
		}

		tilePile.push(tile);
	}

	/**
	 * Returns if "HOST", "GUEST", or "BOTH PLAYERS" has any basic flower tiles left.
	 * @returns {?string} Returns null if neither player has any basic flower left.
	 */
	aPlayerIsOutOfBasicFlowerTiles() {
		// Check Host
		let hostHasBasic = false;
		for (let i = 0; i < this.hostTiles.length; i++) {
			if (this.hostTiles[i].type === BASIC_FLOWER) {
				hostHasBasic = true;
				break;
			}
		}

		let guestHasBasic = false;
		for (let i = 0; i < this.guestTiles.length; i++) {
			if (this.guestTiles[i].type === BASIC_FLOWER) {
				guestHasBasic = true;
				break;
			}
		}

		if (!hostHasBasic && guestHasBasic) {
			return HOST;
		} else if (!guestHasBasic && hostHasBasic) {
			return GUEST;
		} else if (!guestHasBasic && !hostHasBasic) {
			return "BOTH PLAYERS";
		}
	}

	/**
	 * Checks which player has more unplayed accent tiles.
	 * @returns {string} - "HOST" or "GUEST"
	 */
	getPlayerWithMoreAccentTiles() {
		let hostCount = 0;
		for (let i = 0; i < this.hostTiles.length; i++) {
			if (this.hostTiles[i].type === ACCENT_TILE) {
				hostCount++;
			}
		}

		let guestCount = 0;
		for (let i = 0; i < this.guestTiles.length; i++) {
			if (this.guestTiles[i].type === ACCENT_TILE) {
				guestCount++;
			}
		}

		if (hostCount > guestCount) {
			return HOST;
		} else if (guestCount > hostCount) {
			return GUEST;
		}
	}

	/**
	 * Checks if given player has both Special Flowers left unplayed.
	 * @param {string} player - "HOST" or "GUEST"
	 * @returns {boolean}
	 */
	playerHasBothSpecialTilesRemaining(player) {
		let tilePile = this.hostTiles;
		if (player === GUEST) {
			tilePile = this.guestTiles;
		}

		let specialTileCount = 0;

		tilePile.forEach(function(tile) {
			if (tile.type === SPECIAL_FLOWER) {
				specialTileCount++;
			}
		});

		return specialTileCount > 1;
	}

	/**
	 * Get new deep copy of SkudPaiShoTileManager.
	 * @returns {SkudPaiShoTileManager}
	 */
	getCopy() {
		const copy = new SkudPaiShoTileManager();

		// copy this.hostTiles and this.guestTiles
		copy.hostTiles = copyArray(this.hostTiles);
		copy.guestTiles = copyArray(this.guestTiles);

		return copy;
	}

}
