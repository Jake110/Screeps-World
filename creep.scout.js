const builder = require("structure.builder");
const combat = require("utility.combat");
const memory = require("utility.memory");

function get_route(room_start, room_end, avoid_list, blocked = null) {
	return Game.map.findRoute(room_start, room_end, {
		routeCallback(roomName, fromRoomName) {
			if (avoid_list.indexOf(roomName) != -1) {
				// avoid this room
				return Infinity;
			} else if (blocked != null) {
				if (roomName == blocked[1] && fromRoomName == blocked[0]) {
					return Infinity;
				}
			}
			return 1;
		},
	});
}

module.exports = {
	avoid_rooms: function (home) {
		let map = home.memory.map;
		let avoid_rooms = [];
		for (room_name in map) {
			if (map[room_name].status == "owned") {
				room = Game.rooms[room_name];
				if (room != null) {
					if (room.controller.my) {
						continue;
					}
				}
				avoid_rooms.push(room_name);
			}
		}
		return avoid_rooms;
	},
	explore: function (home, creep) {
		let map = home.memory.map;
		let target = creep.memory.target;
		let avoid_rooms = this.avoid_rooms(home);
		if (creep.memory.route.length == 0) {
			target = null
		}
		if (target == null) {
			let route = null;
			let range = 100;
			let pending_rooms = 0;
			for (room_name in map) {
				if (map[room_name].status == "pending") {
					pending_rooms++;
					let path = get_route(creep.room, room_name, avoid_rooms);
					if (path.length < range) {
						target = room_name;
						route = path;
						range = path.length;
					}
				}
			}
			if (target != null) {
				creep.memory.target = target;
				creep.memory.route = route;
			}
		}
		console.log("Target: " + target);
		console.log("Route: " + creep.memory.route);
		if (target == null) {
			console.log(
				"Scout [" +
					creep.name +
					"] cannot reach any more unexplored rooms. Recycling...",
			);
			creep.memory.recycle = home.memory.core;
			for (room_name in map) {
				if (map[room_name].status == "pending") {
					console.log("\tMarking [" + room_name + "] as [blocked]");
					map[room_name].status = "blocked";
				}
			}
		} else {
			let next_step = creep.memory.route[0];
			if (next_step.room == creep.room.name) {
				creep.memory.route.shift()
				next_step = creep.memory.route[0]
			}
			let exit = creep.pos.findClosestByPath(next_step.exit);
			let blocked_exits = [];
			while (creep.moveTo(exit, { maxRooms: 1 }) == ERR_NO_PATH) {
				blocked_exits.push([creep.room.name, next_step.room]);
				let route = get_route(
					creep.room.name,
					target,
					avoid_rooms,
					blocked_exits,
				);
				if (route == ERR_NO_PATH) {
					console.log("Marking [" + target + "] as [blocked]");
					map[target].status = "blocked";
					creep.memory.target = null;
					creep.memory.route = null;
					return null;
				}
				next_step = route[0];
				exit = creep.pos.findClosestByPath(next_step.exit);
				creep.memory.route = route;
			}
			let direction;
			switch (next_step.exit) {
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
					next_step.room +
					"]",
			);
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
		creep.memory.target = null;
		creep.memory.route = null;
	},
	return: function (home, creep) {
		let avoid_rooms = this.avoid_rooms(home);
		creep.moveTo(memory.coord_to_pos(home.memory.core, home), {
			routeCallback(roomName, fromRoomName) {
				if (avoid_list.indexOf(roomName) != -1) {
					// avoid this room
					return Infinity;
				}
				return 1;
			},
		});
	},
};
