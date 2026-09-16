const combat = require("utility.combat");
const memory = require("utility.memory");

module.exports = {
	explore: function (home, creep) {
		let map = home.memory.map;
		let target = null;
		let route;
		let range = 100;
		for (room_name in map) {
			if (map[room_name].status == "pending") {
				let path = Game.map.findRoute(creep.room, room_name);
				if (path.length < range) {
					target = room_name;
					route = path;
					range = path.length;
				}
			}
		}
		if (target == null) {
			creep.memory.recycle = home.memory.core;
		} else {
			let direction;
			switch (route[0].exit) {
				case FIND_EXIT_TOP:
					direction = "North";
				case FIND_EXIT_RIGHT:
					direction = "East";
				case FIND_EXIT_BOTTOM:
					direction = "South";
				case FIND_EXIT_LEFT:
					direction = "West";
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
			let exit = creep.pos.findClosestByRange(route[0].exit);
			creep.moveTo(exit);
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
