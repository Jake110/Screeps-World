var memory = require("utility.memory");

/**
 * Map a road from the origin to the target
 * @param {Room} room
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function place_road(room, origin, target) {
	place_road_around(room, origin, true);
	steps = origin.findPathTo(target, {
		ignoreCreeps: true,
		ignoreRoads: true,
		costCallback: function (roomName, costMatrix) {
			let _room = null;
			try {
				_room = Game.rooms[roomName];
			} catch {}
			if (_room != null) {
				memory.build_pos(_room).forEach(function (pos) {
					// Set all building positions to be non-walkable
					costMatrix.set(pos.x, pos.y, 0xff);
				});
			}
		},
		swampCost: 1,
	});
	steps.pop();
	steps.forEach(function (step) {
		save_road(room.name, step.x + ":" + step.y);
	});
}

function place_road_around(room, pos, square = false) {
	for (let n = -1; n <= 1; n++) {
		for (let m = -1; m <= 1; m++) {
			if ((n == 0 && m == 0) || (!square && n != 0 && m != 0)) {
				// Don't place a road on the position we're surrounding
				// Don't place road in the corners unless flagged as square
				continue;
			}
			origin_adjacent = room.getPositionAt(
				pos.x + parseInt(n),
				pos.y + parseInt(m),
			);
			if (can_build_here(origin_adjacent, true)) {
				save_road(room.name, pos.x + n + ":" + (pos.y + m));
			}
		}
	}
}

function save_road(room_name, coord) {
	if (!Memory[room_name].roads.includes(coord)) {
		Memory[room_name].roads.push(coord);
	}
}

/**
 * @param {RoomPosition} pos
 * @param {boolean} respect_walls
 **/
function can_build_here(pos, respect_walls = false) {
	coord = pos.x + ":" + pos.y;
	if (
		Memory[pos.roomName].towers.includes(coord) ||
		Memory[pos.roomName].extensions.includes(coord)
	) {
		return false;
	}
	return _.every(pos.look(), function (item) {
		if (respect_walls && item.type == LOOK_TERRAIN) {
			return item.terrain !== "wall";
		}
		return true;
	});
}

function get_next_adjacent(room, pos, layer = 1) {
	let avoid_pos = memory.build_coords(room.name);
	let next;
	for (; next == null; layer++) {
		let l = parseInt(layer);
		let options = [];
		for (let n = 0 - layer; n <= layer - 2; n += 2) {
			let m = parseInt(n);
			options.push(
				room.getPositionAt(pos.x - l, pos.y + m),
				room.getPositionAt(pos.x + l, pos.y + m),
				room.getPositionAt(pos.x + m, pos.y - l),
				room.getPositionAt(pos.x + m, pos.y + l),
			);
		}
		options = options.filter(function (option) {
			return !avoid_pos.includes(option.x + ":" + option.y);
		});
		next = pos.findClosestByPath(options, {
			ignoreCreeps: true,
			ignoreRoads: true,
			swampCost: 1,
			filter: can_build_here,
		});
	}
	return next;
}

function remove_road(pos) {
	coord = pos.x + ":" + pos.y;
	index = Memory[pos.roomName].roads.indexOf(coord);
	if (index != -1) {
		Memory[pos.roomName].roads.splice(index, 1);

		pos.lookFor(LOOK_STRUCTURES).forEach(function (structure) {
			structure.destroy();
		});
		pos.lookFor(LOOK_CONSTRUCTION_SITES).forEach(function (site) {
			site.remove();
		});
	}
}

module.exports = {
	create_construction_sites: function (room, path, structure_type) {
		let unfinished_count = 0;
		Memory[room.name][path].forEach(function (coord) {
			let x = parseInt(coord.split(":")[0]);
			let y = parseInt(coord.split(":")[1]);
			pos = room.getPositionAt(x, y);
			let unfinished = true;
			pos.lookFor(LOOK_STRUCTURES).forEach(function (structure) {
				if (structure.structureType == structure_type) {
					unfinished = false;
				}
			});
			if (unfinished) {
				unfinished_count++;
				if (pos.lookFor(LOOK_CONSTRUCTION_SITES).length == 0) {
					pos.createConstructionSite(structure_type);
				}
			}
		});
		return unfinished_count;
	},
	place_extensions: function (room, spawn) {
		const room_level = room.controller.level;
		let max_entensions;
		if (room_level < 2) {
			max_entensions = 0;
		} else if (room_level == 2) {
			max_entensions = 5;
		} else {
			max_entensions = (room_level - 2) * 10;
		}
		if (max_entensions > 20) {
			max_entensions = 20;
		}
		if (Memory[room.name].extensions.length < max_entensions) {
			let new_site = get_next_adjacent(room, spawn.pos, 2);
			remove_road(new_site);
			place_road_around(room, new_site);
			Memory[room.name].extensions.push(new_site.x + ":" + new_site.y);
		}
		this.create_construction_sites(room, "extensions", STRUCTURE_EXTENSION);
	},
	place_source_roads: function (spawn) {
		memory.set_up_memory(spawn.id, {});
		memory.set_up_memory(spawn.id, [], "roads");
		place_road_around(spawn.room, spawn.pos, true);
		place_road_around(spawn.room, spawn.room.controller.pos);
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				return !Memory[spawn.id].roads.includes(_source.id);
			},
		});
		if (_source) {
			place_road(spawn.room, _source.pos, spawn.pos);
			place_road(spawn.room, _source.pos, spawn.room.controller.pos);
			Memory[spawn.id].roads.push(_source.id);
		}
	},
	place_towers: function (room) {
		const room_level = room.controller.level;
		let max_towers = 0;
		switch (true) {
			case room_level == 8:
				max_towers += 3;
			case room_level == 7:
				max_towers += 1;
			case [5, 6].includes(room_level):
				max_towers += 1;
			case [3, 4].includes(room_level):
				max_towers += 1;
		}
		for (
			let tower_sites = Memory[room.name].towers.length;
			tower_sites < max_towers;
			tower_sites++
		) {
			let new_site = get_next_adjacent(room, room.controller.pos, 2);
			remove_road(new_site);
			place_road_around(room, new_site);
			Memory[room.name].towers.push(new_site.x + ":" + new_site.y);
		}
		this.create_construction_sites(room, "towers", STRUCTURE_TOWER);
	},
};
