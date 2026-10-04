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
		if (target == null) {
			console.log(
				"Scout [" +
					creep.name +
					"] cannot reach any more unexplored rooms. Recycling...",
			);
			creep.memory.recycle = home.memory.core;
			for (room_name in map) {
				if (map[room_name].status == "pending") {
					console.log("\tMarking [" + room_name + "] as blocked");
					map[room_name].status = "blocked";
				}
			}
		} else {
			let exit = creep.pos.findClosestByPath(route[0].exit);
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
			creep.moveTo(exit, { maxRooms: 1 });
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
