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

function place_container(room, source_pos, spawn_pos) {
	let harvest_points = [];
	for (let x = -1; x <= 1; x++) {
		for (let y = -1; y <= 1; y++) {
			if (x == 0 && y == 0) {
				// Ignore the source tile
				continue;
			}
			let pos = room.getPositionAt(source_pos.x + x, source_pos.y + y);
			if (can_build_here(pos, true)) {
				harvest_points.push(pos);
			}
		}
	}
	let pos = spawn_pos.findClosestByPath(harvest_points);
	let coord = memory.pos_to_coord(pos);
	room.memory.containers.push(coord);
	save_road(room, coord);
	return pos;
}

function place_wall(room, pos, dist = 2) {
	if (dist > 0) {
		let pos_wall = shift_to_centre(room, pos, dist);
	} else {
		let pos_wall = pos;
	}
	if (can_build_here(pos_wall, true)) {
		room.memory.walls.push(memory.pos_to_coord(pos_wall));
	}
}

function place_rampart(room, start, end) {
	let x = Math.round((start.x + end.x) / 2);
	let y = Math.round((start.y + end.y) / 2);
	let pos_mid;
	if (![0, 49].includes(x) && ![0, 49].includes(y)) {
		let x_diff = 49 - x;
		let y_diff = 49 - y;
		switch ((x < 25) + ":" + (y < 25)) {
			case "true:true":
				if (x > y) {
					x -= y;
					y = 0;
				} else {
					y -= x;
					x = 0;
				}
				break;
			case "true:false":
				if (x > y_diff) {
					x -= y_diff;
					y = 49;
				} else {
					y += x;
					x = 0;
				}
				break;
			case "false:true":
				if (x_diff > y) {
					x += y;
					y = 0;
				} else {
					y -= x_diff;
					x = 49;
				}
				break;
			case "false:false":
				if (x_diff > y_diff) {
					x += y_diff;
					y = 49;
				} else {
					y += x_diff;
					x = 49;
				}
		}
	}
	pos_mid = room.getPositionAt(x, y);
	pos_rampart = shift_to_centre(room, pos_mid, 2);
	room_memory = room.memory;
	if (
		!can_build_here(pos_rampart, true) ||
		!can_get_to_core(room, pos_rampart)
	) {
		pos_wall_list = [];
		room_memory.walls.forEach(function (wall_coord) {
			pos_wall_list.push(memory.coord_to_pos(wall_coord, room));
		});
		pos_rampart = pos_rampart.findClosestByRange(pos_wall_list);
	}
	coord = memory.pos_to_coord(pos_rampart);
	const index = room_memory.walls.indexOf(coord);
	if (index != -1) {
		room_memory.walls.splice(index, 1);
	}
	room_memory.ramparts.push(coord);
}

/**
 * Map a road from the origin to the target
 * @param {Room} room
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function place_road(
	room,
	origin,
	target,
	mode,
	range = 0,
	link_points = null,
	avoid = null,
) {
	let route = [];

	route = origin.findPathTo(target, {
		ignoreCreeps: true,
		ignoreRoads: true,
		costCallback: function (roomName, costMatrix) {
			let _room = null;
			try {
				_room = Game.rooms[roomName];
			} catch (error) {}
			if (_room != null) {
				let adjust_matrix = function (pos) {
					// Set all positions to be non-walkable
					costMatrix.set(pos.x, pos.y, 0xff);
				};
				memory.build_pos(_room).forEach(adjust_matrix);
				if (avoid) {
					avoid.forEach(function (coord) {
						adjust_matrix(memory.coord_to_pos(coord, _room));
					});
				}
			}
		},
		swampCost: 1,
	});
	for (; range > 0; range--) {
		route.pop();
	}
	if (!avoid) {
		route.pop();
		route.shift();
	}
	if (mode == "tunnels") {
		let tunnel_route = [];
		let x = origin.x;
		let y = origin.y;
		while (x != target.x && y != target.y) {
			let step = step_with_coord(x, y, target, room);
			tunnel_route.push(step);
			x = step.split(":")[0];
			y = step.split(":")[1];
		}
		for (; range > 0; range--) {
			tunnel_route.pop();
		}
		if (tunnel_route.length < route.length / 2) {
			tunnel_route.forEach(function (coord) {
				save_road(room, coord);
			});
		}
	} else {
		route.forEach(function (step) {
			save_road(room, memory.pos_to_coord(step));
		});
	}
	if (link_points) {
		link_points.outer.forEach(function (link_point) {
			place_road(
				room,
				link_point,
				target,
				mode,
				0,
				null,
				link_points.inner,
			);
		});
	}
}

function place_road_around(room, pos, mode, radius = 1) {
	let edges = [0 - radius, radius];
	for (let n = 0 - radius; n <= radius; n++) {
		for (let m = 0 - radius; m <= radius; m++) {
			let edge = edges.includes(n) || edges.includes(m);
			if (!edge || (edges.includes(n) && edges.includes(m))) {
				// Don't build inside the radius or in the corners
				continue;
			}
			let coord = pos.x + n + ":" + (pos.y + m);
			if (
				can_build_here(
					memory.coord_to_pos(coord, room),
					mode == "roads",
				)
			) {
				save_road(room, coord);
			}
		}
	}
}

function place_wall_around(room, pos, radius = 1) {
	let edges = [0 - radius, radius];
	for (let n = 0 - radius; n <= radius; n++) {
		for (let m = 0 - radius; m <= radius; m++) {
			let edge = edges.includes(n) || edges.includes(m);
			if (!edge) {
				// Don't build inside the radius
				continue;
			}
			let wall_pos = memory.coord_to_pos(
				pos.x + n + ":" + (pos.y + m),
				room,
			);
			place_wall(room, wall_pos, 0);
		}
	}
}

function save_road(room, coord) {
	let blocked = false;
	memory.structure_names.forEach(function (avoid_list) {
		if (avoid_list.includes(coord)) {
			blocked = true;
		}
	});
	let current = room.memory.roads;
	if (!current.includes(coord) && !blocked) {
		current.push(coord);
	}
}

function shift_to_centre(room, pos, dist) {
	let x = pos.x;
	let y = pos.y;
	let max = 49 - dist;
	if (x < dist) {
		x = dist;
	} else if (x > max) {
		x = max;
	}
	if (y < dist) {
		y = dist;
	} else if (y > max) {
		y = max;
	}
	return room.getPositionAt(x, y);
}

/**
 * @param {RoomPosition} pos
 * @param {boolean} respect_walls
 **/
function can_build_here(pos, respect_walls = false) {
	coord = memory.pos_to_coord(pos);
	let room_edges = [0, 49];
	if (room_edges.includes(pos.x) || room_edges.includes(pos.y)) {
		// Can't build anything on the room edges
		return false;
	}
	if (memory.build_coords(Game.rooms[pos.roomName]).includes(coord)) {
		// Don't try to build over something we already built
		return false;
	}
	if (respect_walls) {
		return _.every(pos.look(), function (item) {
			if (item.type == LOOK_TERRAIN) {
				return item.terrain !== "wall";
			}
			return true;
		});
	}
	return true;
}

function can_get_to_core(room, pos) {
	let room_memory = room.memory;
	let pos_core = memory.coord_to_pos(room_memory.core, room);
	let route = pos.findPathTo(pos_core, {
		ignoreCreeps: true,
		costCallback: function (roomName, costMatrix) {
			let _room = null;
			try {
				_room = Game.rooms[roomName];
			} catch (error) {}
			if (_room != null) {
				let adjust_matrix = function (pos) {
					// Set all positions to be non-walkable
					costMatrix.set(pos.x, pos.y, 0xff);
				};
				memory.build_pos(_room).forEach(adjust_matrix);
				room_memory.walls.forEach(function (coord) {
					adjust_matrix(memory.coord_to_pos(coord, _room));
				});
			}
		},
	});
	if (route.length == 0) {
		return false;
	}
	let last_step = route[route.length - 1];
	return last_step.x == pos_core.x && last_step.y == pos_core.y;
}

function exit_edge_check(
	room,
	index,
	exit_list,
	clockwise = true,
	place_the_wall = true,
) {
	console.log("\t\tClockwise: " + clockwise);
	let pos = exit_list[index];
	let index_adjacent;
	if (clockwise) {
		if (index == exit_list.length - 1) {
			index_adjacent = 0;
		} else {
			index_adjacent = index + 1;
		}
	} else {
		if (index == 0) {
			index_adjacent = exit_list.length - 1;
		} else {
			index_adjacent = index - 1;
		}
	}
	let pos_adjacent_index = exit_list[index_adjacent];
	if (
		(pos.x != pos_adjacent_index.x ||
			![pos.y - 1, pos.y + 1].includes(pos_adjacent_index.y)) &&
		(pos.y != pos_adjacent_index.y ||
			![pos.x - 1, pos.x + 1].includes(pos_adjacent_index.x))
	) {
		if (place_the_wall) {
			let shift_pos_one = function (pos) {
				let x = pos.x;
				let y = pos.y;
				if (clockwise) {
					if (pos.x == 0) {
						y--;
					} else if (pos.x == 49) {
						y++;
					} else if (pos.y == 0) {
						x++;
					} else {
						x--;
					}
				} else {
					if (pos.x == 0) {
						y++;
					} else if (pos.x == 49) {
						y--;
					} else if (pos.y == 0) {
						x--;
					} else {
						x++;
					}
				}
				return room.getPositionAt(x, y);
			};
			let pos_adjacent = shift_pos_one(pos);
			place_wall(room, pos_adjacent);
			let pos_exit_edge = shift_pos_one(pos_adjacent);
			place_wall(room, pos_exit_edge, 1);
			place_wall(room, pos_exit_edge);
		}
		return true;
	}
	return false;
}

function get_next_adjacent(room, pos, layer = 1, diagonal = true) {
	let avoid_pos = memory.build_coords(room);
	let next;
	for (; !next; layer++) {
		let options = [];
		for (let n = 0; n <= layer * 2; n++) {
			options.push(
				room.getPositionAt(pos.x - layer + n, pos.y - layer),
				room.getPositionAt(pos.x + layer, pos.y - layer + n),
				room.getPositionAt(pos.x + layer - n, pos.y + layer),
				room.getPositionAt(pos.x - layer, pos.y + layer - n),
			);
			if (diagonal) {
				n++;
			}
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

function remove_extension(pos, extension_list) {
	remove_structure(pos, STRUCTURE_EXTENSION, extension_list);
	return true;
}

function remove_road(pos) {
	let room_memory = Memory.rooms[pos.roomName];
	let memory_list = room_memory.roads;
	remove_structure(pos, STRUCTURE_ROAD, memory_list);
}

function remove_structure(pos, structure_type, memory_list) {
	coord = memory.pos_to_coord(pos);
	index = memory_list.indexOf(coord);
	if (index != -1) {
		memory_list.splice(index, 1);
		pos.lookFor(LOOK_STRUCTURES).forEach(function (structure) {
			if (structure.structureType == structure_type) {
				structure.destroy();
			}
		});
		pos.lookFor(LOOK_CONSTRUCTION_SITES).forEach(function (site) {
			if (site.structureType == structure_type) {
				site.remove();
			}
		});
	}
}

module.exports = {
	create_construction_sites: function (room, path, structure_type) {
		let unfinished_count = 0;
		let coord_list = room.memory[path];
		if (!Array.isArray(coord_list)) {
			coord_list = [coord_list];
		}
		coord_list.forEach(function (coord) {
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
		let memory_list = spawn.room.memory.source_connections[mode];
		if (!memory_list.includes("controller")) {
			place_road_around(spawn.room, spawn.pos, mode);
			if (mode == "roads") {
				place_road_around(
					spawn.room,
					spawn.room.controller.pos,
					mode,
					3,
				);
			}
			place_road(spawn.room, spawn.pos, spawn.room.controller.pos, mode);
			memory_list.push("controller");
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
		let extension_list = spawn.room.memory.extensions;
		while (extension_list.length > max_entensions) {
			let end_loop = false;
			for (let n = extension_list.length - 1; n >= 0; n--) {
				let pos = memory.coord_to_pos(extension_list[n], spawn.room);
				let extension_not_found = true;
				pos.lookFor(LOOK_STRUCTURES).forEach(function (structure) {
					if (structure.structureType == STRUCTURE_EXTENSION) {
						extension_not_found = false;
						if (structure.store[RESOURCE_ENERGY] == 0) {
							end_loop = remove_extension(pos, extension_list);
						}
					}
				});
				if (extension_not_found) {
					end_loop = remove_extension(pos, extension_list);
				}
				if (end_loop) {
					break;
				}
			}
		}
		while (extension_list.length < max_entensions) {
			let new_site = get_next_adjacent(spawn.room, spawn.pos, 2);
			remove_road(new_site);
			place_road_around(spawn.room, new_site, "roads");
			extension_list.push(memory.pos_to_coord(new_site));
		}
		this.create_construction_sites(
			spawn.room,
			"extensions",
			STRUCTURE_EXTENSION,
		);
	},
	place_links: function (room) {
		const room_level = room.controller.level;
		let max_links = 0;
		switch (true) {
			case room_level == 8:
				max_links += 2;
			case room_level == 7:
				max_links++;
			case room_level == 6:
				max_links++;
			case room_level == 5:
				max_links += 2;
		}
		let room_memory = room.memory;
		for (
			let link_sites = room_memory.links.length;
			link_sites < max_links;
			link_sites++
		) {
			const core_pos = memory.coord_to_pos(room_memory.core, room);
			let core_link = false;
			room_memory.links.forEach(function (link_coord) {
				if (
					core_pos.inRangeTo(memory.coord_to_pos(link_coord, room), 1)
				) {
					core_link = true;
				}
			});
			let link_site = null;
			if (!core_link) {
				link_site = memory.pos_to_coord(
					get_next_adjacent(room, core_pos),
				);
			} else {
				let container_coords = [];
				room_memory.containers.forEach(function (container_coord) {
					container_coords.push(container_coord);
				});
				let dist_max = 0;
				while (container_coords.length > 0) {
					let container_coord = container_coords.pop();
					let container_pos = memory.coord_to_pos(
						container_coord,
						room,
					);
					if (
						container_pos.findInRange(FIND_MY_STRUCTURES, 1, {
							filter: { structureType: STRUCTURE_LINK },
						}).length > 0
					) {
						continue;
					}
					let dist = core_pos.findPathTo(container_pos).length;
					if (dist > dist_max) {
						link_site = memory.pos_to_coord(
							get_next_adjacent(room, container_pos, 1, false),
						);
						dist_max = dist;
					}
				}
			}
			if (link_site) {
				room_memory.links.push(link_site);
			} else {
				break;
			}
		}
		this.create_construction_sites(room, "links", STRUCTURE_LINK);
	},
	place_source_roads: function (spawn, mode) {
		let room_memory = spawn.room.memory;
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				if (
					_source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20)
						.length != 0 &&
					room_memory.towers.length == 0
				) {
					return false;
				}
				return !room_memory.source_connections[mode].includes(
					_source.id,
				);
			},
		});
		if (_source) {
			let container = _source.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			})[0];
			let container_pos;
			if (container) {
				container_pos = container.pos;
			} else {
				container_pos = place_container(
					spawn.room,
					_source.pos,
					spawn.pos,
				);
			}
			place_road(spawn.room, spawn.pos, container_pos, mode);
			room_memory.source_connections[mode].push(_source.id);
		}
	},
	place_storage: function (room) {
		let room_memory = room.memory;
		if (room.controller.level >= 5 && !room_memory.storage) {
			let pos = get_next_adjacent(
				room,
				memory.coord_to_pos(room_memory.core, room),
			);
			room_memory.storage = memory.pos_to_coord(pos);
		}
		if (room_memory.storage) {
			this.create_construction_sites(room, "storage", STRUCTURE_STORAGE);
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
		let towers_list = room.memory.towers;
		for (
			let tower_sites = towers_list.length;
			tower_sites < max_towers;
			tower_sites++
		) {
			let new_site = get_next_adjacent(room, room.controller.pos, 2);
			remove_road(new_site);
			place_road_around(room, new_site, "roads");
			towers_list.push(memory.pos_to_coord(new_site));
		}
		this.create_construction_sites(room, "towers", STRUCTURE_TOWER);
	},
	place_walls: function (room) {
		let room_memory = room.memory;
		if (room.controller.level >= 3 && room_memory.walls.length == 0) {
			// Room Exit walls
			let side_top = [];
			let side_right = [];
			let side_bottom = [];
			let side_left = [];
			let find_exit = function (x, y, side_list) {
				let pos = room.getPositionAt(x, y);
				if (
					_.every(pos.look(), function (item) {
						if (item.type == LOOK_TERRAIN) {
							return item.terrain !== "wall";
						}
						return true;
					})
				) {
					side_list.push(pos);
				}
			};
			for (let row = 0; row < 50; row++) {
				find_exit(row, 0, side_top);
				find_exit(49, row, side_right);
				find_exit(row, 49, side_bottom);
				find_exit(0, row, side_left);
			}
			side_bottom.reverse();
			side_left.reverse();
			let exit_list = side_top.concat(side_right, side_bottom, side_left);
			console.log("Exits found: " + exit_list.length);
			console.log("Exist List: " + exit_list);
			let exit_start = null;
			let exit_end = null;
			for (let index = 0; index < exit_list.length; index++) {
				console.log("\tChecking Exit: " + exit_list[index]);
				exit_edge_check(room, index, exit_list, true);
				exit_edge_check(room, index, exit_list, false);
				place_wall(room, exit_list[index]);
			}
			console.log("Planned Walls: " + room_memory.walls.length);
			let verified_walls = [];
			room_memory.walls.forEach(function (coord) {
				if (can_get_to_core(room, memory.coord_to_pos(coord, room))) {
					verified_walls.push(coord);
				}
			});
			console.log("Verified Walls: " + verified_walls.length);
			room_memory.walls = verified_walls;
			for (let index = 0; index < exit_list.length; index++) {
				if (exit_edge_check(room, index, exit_list, true, false)) {
					if (exit_start != null) {
						place_rampart(
							room,
							exit_list[exit_start],
							exit_list[index],
						);
						exit_start = null;
					} else {
						exit_end = index;
					}
				} else if (
					exit_edge_check(room, index, exit_list, false, false)
				) {
					if (exit_end != null) {
						place_rampart(
							room,
							exit_list[index],
							exit_list[exit_end],
						);
						exit_end = null;
					} else {
						exit_start = index;
					}
				}
			}
			// Controller walls
			place_wall_around(room, room.controller.pos);

			console.log("Walls Placed: " + room_memory.walls.length);
			room_memory.walls = [];
		}
		this.create_construction_sites(room, "walls", STRUCTURE_WALL);
		this.create_construction_sites(room, "ramparts", STRUCTURE_RAMPART);
		console.log("----------");
	},
};
