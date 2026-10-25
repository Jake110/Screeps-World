const memory = require("utility.memory");
const spawn_util = require("utility.spawn");

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
	explore: function (creep) {
		let home = Game.rooms[creep.memory.home];
		console.log("[" + creep.name + "] exploring...");
		let map = Memory.map;
		let target = creep.memory.target;
		if (creep.room.name == target) {
			// find new target if already in room
			target = null;
		}
		let avoid_rooms = this.get_enemy_rooms();
		if (target == null) {
			let route = null;
			let range = 100;
			let current_tick = Game.time;
			for (let room_name in map) {
				let room_map = map[room_name];
				console.log(
					"\tChecking Room [" +
						room_name +
						"] with status [" +
						room_map.status +
						"]",
				);
				if (
					(creep.memory.role == "scout" &&
						(room_map.status == "pending" ||
							room_map.last_checked < current_tick - 500) &&
						home.memory.defend
							.concat(home.memory.expand)
							.includes(room_name)) ||
					(creep.memory.role == "guard" &&
						["hostile", "rival"].includes(room_map.status) &&
						home.memory.defend.includes(room_name))
				) {
					let path = get_route(creep.room, room_name, avoid_rooms);
					console.log("\t\tPath length: " + path.length);
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
		console.log("\tCurrent Room: " + creep.room.name);
		console.log("\tTarget: " + creep.memory.target);
		console.log("\tRoute length: " + creep.memory.route.length);
		console.log(creep.memory.route);
		console.log("\tStatus: " + map[creep.memory.target].status);
		console.log(
			"\tTicks since last checked: " +
				Game.time -
				map[creep.memory.target].last_checked,
		);
		if (creep.memory.target == null) {
			let log =
				"Scout [" +
				creep.name +
				"] cannot reach any more unexplored rooms. Recycling...";
			if (creep.memory.role == "guard") {
				log = "Guard [" + creep.name + "] standing down. Recycling...";
			}
			console.log(log);
			creep.memory.recycle = spawn_util.get_spawn_coord(home);
			if (creep.memory.role == "scout") {
				for (let room_name in home.memory.defend.concat(
					home.memory.expand,
				)) {
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
			if (!this.travel(creep.memory.target, creep, true)) {
				console.log(
					"Marking [" + creep.memory.target + "] as [blocked]",
				);
				map[creep.memory.target].status = "blocked";
				creep.memory.target = null;
				creep.memory.route = null;
				return null;
			}
		}
	},
	get_enemy_rooms: function () {
		let map = Memory.map;
		let avoid_rooms = [];
		for (let room_name in map) {
			if (map[room_name].status == "enemy") {
				avoid_rooms.push(room_name);
			}
		}
		return avoid_rooms;
	},
	return: function (creep) {
		if (creep.room.name == creep.memory.home) {
			let home = Game.rooms[creep.memory.home];
			creep.moveTo(memory.coord_to_pos(home.memory.core, home));
		} else {
			this.travel(creep.memory.home, creep, true);
		}
	},
	travel: function (target, creep, avoid_hostiles) {
		memory.map_room(creep);
		if (creep.room.name == target) {
			// Already in target room
			return true;
		}
		let avoid = [];
		if (avoid_hostiles) {
			avoid = this.get_enemy_rooms();
		}
		if (
			!creep.memory.route ||
			creep.memory.route.length == 0 ||
			creep.memory.route[creep.memory.route.length - 1].room != target
		) {
			console.log(
				"Getting new route from [" +
					creep.room.name +
					"] to [" +
					target +
					"]",
			);
			creep.memory.route = get_route(creep.room.name, target, avoid);
			console.log(creep.memory.route.length);
		}
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
			if (
				creep.getActiveBodyparts(WORK) +
					creep.getActiveBodyparts(ATTACK) +
					creep.getActiveBodyparts(RANGED_ATTACK) >
				0
			) {
				if (exit == null) {
					exit = creep.pos.findClosestByRange(next_step.exit);
				}
				// Check for blocking walls to dismantle
				let wall = creep.pos.findClosestByPath(
					exit.findInRange(FIND_STRUCTURES, 5, {
						filter: { structureType: STRUCTURE_WALL },
					}),
				);
				if (wall) {
					if (wall.hits) {
						creep.attack(wall);
						creep.rangedAttack(wall);
						creep.dismantle(wall);
						creep.moveTo(wall, {
							visualizePathStyle: { stroke: "#FF0000" },
						});
						return true;
					}
				}
			}
			blocked_exits.push([creep.room.name, next_step.room]);
			let route = get_route(
				creep.room.name,
				target,
				avoid,
				blocked_exits,
			);
			if (route == ERR_NO_PATH) {
				// All exits blocked, cannot reach target room
				return false;
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
				"] via [" +
				next_step.room +
				"] to [" +
				target +
				"]",
		);
		return true;
	},
};
