const memory = require("utility.memory");

function get_direction(exit) {
	let direction;
	switch (exit) {
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
	return direction;
}

function get_route(room_start, room_end, avoid_list, blocked = null) {
	return Game.map.findRoute(room_start, room_end, {
		routeCallback(room_name, from_room_name) {
			if (avoid_list.indexOf(room_name) != -1) {
				// avoid this room
				return Infinity;
			} else if (blocked != null) {
				let deny = false;
				blocked.forEach(function (block) {
					if (room_name == block[1] && from_room_name == block[0]) {
						deny = true;
					}
				});
				if (deny) {
					return Infinity;
				}
			}
			return 1;
		},
	});
}

module.exports = {
	explore: function (home, creep) {
		console.log("[" + creep.name + "] exploring...");
		let map = Memory.map;
		let target = creep.memory.target;
		let avoid_rooms = this.get_enemy_rooms();
		if (target == null) {
			let route = null;
			let range = 100;
			let room_status = "pending";
			let room_list = home.memory.defend + home.memory.expand;
			if (creep.memory.role == "guard") {
				room_status = "hostile";
				room_list = home.memory.defend;
			}
			console.log(
				"\tLooking for rooms with a status of [" + room_status + "]",
			);
			for (room_name in map) {
				console.log("\t\tChecking Room [" + room_name + "]");
				if (
					map[room_name].status == room_status &&
					room_list.indexOf(room_name) != -1
				) {
					let path = get_route(creep.room, room_name, avoid_rooms);
					console.log("\t\t\tPath length: " + path.length);
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
		console.log("\tTarget: " + creep.memory.target);
		console.log("\tRoute: " + creep.memory.route);
		if (creep.memory.target == null) {
			let log =
				"Scout [" +
				creep.name +
				"] cannot reach any more unexplored rooms. Recycling...";
			if (creep.memory.role == "guard") {
				log = "Guard [" + creep.name + "] standing down. Recycling...";
			}
			console.log(log);
			creep.memory.recycle = home.memory.core;
			if (creep.memory.role == "scout") {
				for (room_name in home.memory.defend + home.memory.expand) {
					if (map[room_name].status == "pending") {
						console.log(
							"\tMarking [" + room_name + "] as [blocked]",
						);
						map[room_name].status = "blocked";
					}
				}
			}
		} else if (
			creep.memory.role == "guard" &&
			length(
				creep.pos.findInRange(FIND_MY_CREEPS, 1, {
					filter: function (_creep) {
						return _creep.memory.role == "medic";
					},
				}),
			) == 0
		) {
			console.log("Guard [" + creep.name + "] awaiting arrival of Medic");
		} else {
			let next_step = creep.memory.route[0];
			if (next_step.room == creep.room.name) {
				creep.memory.route.shift();
				next_step = creep.memory.route[0];
			}
			let exit = creep.pos.findClosestByPath(next_step.exit);
			let blocked_exits = [];
			while (
				[ERR_NO_PATH, ERR_INVALID_TARGET].indexOf(
					creep.moveTo(exit, { maxRooms: 1 }),
				) != -1
			) {
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
			let direction = get_direction(next_step.exit);
			console.log(
				"Creep [" +
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
	get_enemy_rooms: function () {
		let map = Memory.map;
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
	return: function (home, creep) {
		let avoid_rooms = this.get_enemy_rooms();
		creep.moveTo(memory.coord_to_pos(home.memory.core, home), {
			routeCallback(room_name) {
				if (avoid_rooms.indexOf(room_name) != -1) {
					// avoid this room
					return Infinity;
				}
				return 1;
			},
		});
	},
};
