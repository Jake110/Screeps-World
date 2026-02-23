const memory = require("utility.memory");

function step_with_coord(
	x,
	y,
	target,
	room,
	pos_return = false,
	leave = false,
) {
	let pass_room = false;
	if (pos_return) {
		pass_room = room;
	}
	return step_with_pos(room.getPositionAt(x, y), target, pass_room, leave);
}

function step_with_pos(pos, target, pos_return = false, leave = false) {
	let x = pos.x;
	let y = pos.y;
	let direction = pos.getDirectionTo(target);
	if (leave) {
		if (direction > 4) {
			direction -= 4;
		} else {
			direction += 4;
		}
	}
	switch (direction) {
		case 1:
			y--;
			break;
		case 2:
			x++;
			y--;
			break;
		case 3:
			x++;
			break;
		case 4:
			x++;
			y++;
			break;
		case 5:
			y++;
			break;
		case 6:
			x--;
			y++;
			break;
		case 7:
			x--;
			break;
		case 8:
			x--;
			y--;
			break;
	}
	if (pos_return) {
		return pos_return.getPositionAt(x, y);
	}
	return x + ":" + y;
}

function place_container(room, pos_list, spawn_pos) {
	let harvest_points = [];
	pos_list.forEach(function (pos) {
		harvest_points.push(memory.coord_to_pos(pos, room));
	});
	let options = [];
	while (harvest_points.length > 1) {
		let harvest_point = harvest_points.pop();
		harvest_points.forEach(function (other_point) {
			let steps = harvest_point.findPathTo(other_point, {
				ignoreCreeps: true,
				swampCost: 1,
			});
			if (steps.length == 2) {
				console.log("2 step point: " + steps[0].x + ":" + steps[0].y);
				options.push(room.getPositionAt(steps[0].x, steps[0].y));
			} else if (steps.length == 1) {
				[harvest_point, other_point].forEach(function (point) {
					if (!options.includes(point)) {
						console.log(
							"Adjacent point: " + point.x + ":" + point.y,
						);
						options.push(point);
					}
				});
			}
		});
	}
	Memory[room.name].containers.push(
		memory.pos_to_coord(spawn_pos.findClosestByPath(options)),
	);
}

/**
 * Map a road from the origin to the target
 * @param {Room} room
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function place_road(room, origin, target, mode, range = 0) {
	if (mode == "roads") {
		steps = origin.findPathTo(target, {
			ignoreCreeps: true,
			ignoreRoads: true,
			costCallback: function adjust_cost_matrix(roomName, costMatrix) {
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
		steps.shift();
		for (; range >= 0; range--) {
			steps.pop();
		}
		steps.forEach(function (step) {
			save_road(room.name, memory.pos_to_coord(step), mode);
		});
	} else {
		let x = origin.x;
		let y = origin.y;
		let route = [];
		while (x != target.x && y != target.y) {
			route.push(step_with_coord(x, y, target, room));
		}
		route.shift();
		for (; range > 0; range--) {
			route.pop();
		}
		route.forEach(function (coord) {
			save_road(room.name, coord, mode);
		});
	}
}

function place_road_around(
	room,
	pos,
	mode,
	square = false,
	radius = 1,
	thickness = 1,
	full_inner_ring = false,
	return_inner_ring = false,
) {
	let outer_edges = [0 - radius, radius];
	let outer_ring = [];
	let inner_edges = [-1 - radius + thickness, 1 + radius - thickness];
	let inner_ring = [];
	for (let n = 0 - radius; n <= radius; n++) {
		for (let m = 0 - radius; m <= radius; m++) {
			let outer_edge = outer_edges.includes(n) || outer_edges.includes(m);
			let inner_edge = inner_edges.includes(n) || inner_edges.includes(m);
			if (
				(!full_inner_ring &&
					!outer_edge &&
					(!inner_edge ||
						inner_edges.includes(n) != inner_edges.includes(m))) ||
				(full_inner_ring && !outer_edge && !inner_edge) ||
				(!square && outer_edges.includes(n) && outer_edges.includes(m))
			) {
				// Only place road in the radius zone
				// Don't place road in the corners unless flagged as square
				continue;
			}
			if (outer_edge) {
				pos_step = room.getPositionAt(pos.x + n, pos.y + m);
				let steps = [];
				for (let thick = 0; thick < thickness; thick++) {
					if (thick > 0) {
						pos_step = step_with_pos(pos_step, pos, room);
					}
					if (!can_build_here(pos_step, mode == "roads")) {
						break;
					}
					steps.push(pos_step);
				}
				if (steps.length != thickness) {
					continue;
				}
				steps.forEach(function (step) {
					save_road(room.name, memory.pos_to_coord(step), mode);
				});
				outer_ring.push(memory.pos_to_coord(steps[0]));
				if (return_inner_ring) {
					let inner_tile = memory.pos_to_coord(
						steps[steps.length - 1],
					);
					if (!inner_ring.includes(inner_tile)) {
						inner_ring.push(inner_tile);
					}
				}
			} else {
				let coord = pos.x + n + ":" + (pos.y + m);
				if (
					can_build_here(
						memory.coord_to_pos(coord, room),
						mode == "roads",
					)
				) {
					save_road(room.name, coord, mode);
					if (return_inner_ring && !inner_ring.includes(coord)) {
						inner_ring.push(coord);
					}
				}
			}
		}
	}
	console.log("Inner Ring: " + inner_ring);
	return inner_ring;
}

function save_road(room_name, coord, mode) {
	if (!Memory[room_name][mode].includes(coord)) {
		Memory[room_name][mode].push(coord);
	}
}

/**
 * @param {RoomPosition} pos
 * @param {boolean} respect_walls
 **/
function can_build_here(pos, respect_walls = false) {
	coord = memory.pos_to_coord(pos);
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
	for (; !next; layer++) {
		let options = [];
		for (let n = 0 - layer; n <= layer - 2; n += 2) {
			options.push(
				room.getPositionAt(pos.x - layer, pos.y + n),
				room.getPositionAt(pos.x + layer, pos.y + n),
				room.getPositionAt(pos.x + n, pos.y - layer),
				room.getPositionAt(pos.x + n, pos.y + layer),
			);
		}
		options = options.filter(function (option) {
			return !avoid_pos.includes(memory.pos_to_coord(option));
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
	let mode = "roads";
	if (new Room.Terrain(pos.roomName).get(pos.x, pos.y) == TERRAIN_MASK_WALL) {
		mode = "tunnels";
	}
	coord = memory.pos_to_coord(pos);
	index = Memory[pos.roomName][mode].indexOf(coord);
	if (index != -1) {
		Memory[pos.roomName][mode].splice(index, 1);

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
			pos = memory.coord_to_pos(coord, room);
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
	place_controller_road: function (spawn, mode) {
		if (
			!Memory[spawn.room.name].spawners[memory.pos_to_coord(spawn.pos)][
				mode
			].includes("controller")
		) {
			place_road_around(spawn.room, spawn.pos, mode, true);
			place_road_around(
				spawn.room,
				spawn.room.controller.pos,
				mode,
				false,
				4,
				2,
			);
			place_road(
				spawn.room,
				spawn.pos,
				spawn.room.controller.pos,
				mode,
				4,
			);
			Memory[spawn.room.name].spawners[memory.pos_to_coord(spawn.pos)][
				mode
			].push("controller");
		}
	},
	place_extensions: function (spawn) {
		const room_level = spawn.room.controller.level;
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
		if (Memory[spawn.room.name].extensions.length < max_entensions) {
			let new_site = get_next_adjacent(spawn.room, spawn.pos, 2);
			remove_road(new_site);
			place_road_around(spawn.room, new_site, "roads");
			Memory[spawn.room.name].extensions.push(
				memory.pos_to_coord(new_site),
			);
		}
		this.create_construction_sites(
			spawn.room,
			"extensions",
			STRUCTURE_EXTENSION,
		);
	},
	place_source_roads: function (spawn) {
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				if (
					_source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20)
						.length != 0 &&
					Memory[spawn.room.name].towers.length == 0
				) {
					return false;
				}
				return !Memory[spawn.room.name].spawners[
					memory.pos_to_coord(spawn.pos)
				].roads.includes(_source.id);
			},
		});
		if (_source) {
			place_road(spawn.room, spawn.pos, _source.pos, "roads", 2); // return pos of closest road to source
			let inner_ring = place_road_around(
				spawn.room,
				_source.pos,
				"roads",
				true,
				2,
				2,
				true,
				true,
			);
			place_container(spawn.room, inner_ring, spawn.pos);
			Memory[spawn.room.name].spawners[
				memory.pos_to_coord(spawn.pos)
			].roads.push(_source.id);
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
			let new_site = get_next_adjacent(room, room.controller.pos);
			remove_road(new_site);
			place_road_around(room, new_site, "roads");
			Memory[room.name].towers.push(memory.pos_to_coord(new_site));
		}
		this.create_construction_sites(room, "towers", STRUCTURE_TOWER);
	},
};
