const builder = require("structure.builder");
const combat = require("utility.combat");
const memory = require("utility.memory");

module.exports = {
	explore: function (home, creep) {
		let map = home.memory.map;
		let target = null;
		let route;
		let range = 100;
		let avoid_rooms = [];
		let pending_rooms = 0;
		let active_rooms = [];
		for (room_name in Game.rooms) {
			active_rooms.push(room_name);
		}
		for (room_name in map) {
			if (map[room_name].status == "owned") {
				let avoid = true;
				if (active_rooms.indexOf(room_name) != -1) {
					if (Game.rooms[room_name].memory.core) {
						avoid = false;
					}
				}
				if (avoid) {
					avoid_rooms.push(room_name);
				}
			}
		}
		for (room_name in map) {
			if (map[room_name].status == "pending") {
				pending_rooms++;
				let path = Game.map.findRoute(creep.room, room_name, {
					routeCallback(roomName, fromRoomName) {
						if (avoid_rooms.indexOf(roomName) != -1) {
							// avoid this room
							return Infinity;
						}
						return 1;
					},
				});
				if (
					path.length < range &&
					creep.pos.findClosestByPath(path[0].exit)
				) {
					target = room_name;
					route = path;
					range = path.length;
				}
			}
		}
		if (
			target == null &&
			pending_rooms > 0 &&
			creep.room.name != home.name
		) {
			target = home.name;
			route = Game.map.findRoute(creep.room, home.name, {
				routeCallback(roomName, fromRoomName) {
					if (avoid_rooms.indexOf(roomName) != -1) {
						// avoid this room
						return Infinity;
					}
					return 1;
				},
			});
		}
		if (target == null) {
			creep.memory.recycle = home.memory.core;
		} else {
			let exit = creep.pos.findClosestByPath(route[0].exit);
			if (
				[0, 49].indexOf(creep.pos.x) != -1 ||
				[0, 49].indexOf(creep.pos.y) != -1
			) {
				let x_options = [];
				let y_options = [];
				switch (creep.pos.x) {
					case 0:
						x_options.push(1);
					case 49:
						x_options.push(48);
				}
				switch (creep.pos.y) {
					case 0:
						y_options.push(1);
					case 49:
						y_options.push(48);
				}
				if (x_options.length == 0) {
					x_options = [creep.pos.x - 1, creep.pos.x, creep.pos.x + 1];
				}
				if (y_options.length == 0) {
					y_options = [creep.pos.y - 1, creep.pos.y, creep.pos.y + 1];
				}
				let options = [];
				for (x in x_options) {
					for (y in y_options) {
						let option = creep.room.getPositionAt(x, y);
						console.log("Option: " + option);
						if (
							_.every(option.look(), function (item) {
								if (item.type == LOOK_TERRAIN) {
									console.log("\tTerrain: " + item.terrain);
									return item.terrain !== "wall";
								} else if (
									[
										LOOK_CREEPS,
										LOOK_STRUCTURES,
										LOOK_POWER_CREEPS,
									].indexOf(item.type) != -1
								) {
									console.log("\tOccupied");
									return false;
								}
								return true;
							})
						) {
							console.log("\tApproved");
							options.push(option);
						}
					}
				}
				let spot = exit.findClosestByPath(options);
				console.log("Spot: " + spot);
				creep.moveTo(spot);
			} else {
				let direction;
				switch (route[0].exit) {
					case FIND_EXIT_TOP:
						direction = "North";
						break;
					case FIND_EXIT_RIGHT:
						direction = "East";
						break;
					case FIND_EXIT_BOTTOM:
						direction = "South";
						break;
					case FIND_EXIT_LEFT:
						direction = "West";
						break;
				}
				console.log(
					"Scout [" +
						creep.name +
						"] heading [" +
						direction +
						"] to [" +
						target +
						"] via [" +
						route[0].room +
						"]",
				);
				creep.moveTo(exit);
			}
		}
	},
	map: function (home, creep) {
		let map = home.memory.map[creep.room.name];
		let sources = creep.room.find(FIND_SOURCES);
		if (sources.length > 0) {
			map.sources = [];
			sources.forEach(function (source) {
				map.sources.push(memory.pos_to_coord(source.pos));
			});
		}
		let minerals = creep.room.find(FIND_MINERALS);
		if (minerals.length > 0) {
			map.mineral = minerals[0].mineralType;
		}
		let controller = creep.room.controller;
		let owned = false;
		if (controller) {
			if (controller.level > 0) {
				owned = true;
			}
		}
		if (owned) {
			map.status = "owned";
		} else if (combat.safe_check(creep, 50)) {
			map.status = "explored";
		} else {
			map.status = "hostile";
		}
	},
	return: function (home, creep) {
		creep.moveTo(memory.coord_to_pos(home.memory.core, home));
	},
};
