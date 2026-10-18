const memory = require("utility.memory");

module.exports = {
	update_remote_list: function () {
		// if (Game.time % 53 == 0) {
		let remotes = [];
		let room_names = [];
		for (room_name in Game.rooms) {
			let room = Game.rooms[room_name];
			if (room.memory.remotes) {
				remotes = remotes.concat(room.memory.remotes);
				room_names.push(room_name);
			}
		}
		console.log("Remotes in use: " + remotes);
		console.log("Owned Rooms: " + room_names);
		for (room_name in Memory.map) {
			let map = Memory.map[room_name];
			if (map.sources && room_names.indexOf(room_name) == -1) {
				map.sources.forEach(function (source) {
					let coord = room_name + "_" + source;
					if (remotes.indexOf(coord) == -1) {
						console.log("Assigning: " + coord);
						let home = null;
						let route = null;
						room_names.forEach(function (name) {
							let path = Game.map.findRoute(room_name, name);
							if (path.length < 2) {
								if (
									route == null ||
									path.length < route.length
								) {
									home = name;
									route = path;
								} else if (
									path.length == route.length &&
									Memory.rooms[name].remotes.length <
										Memory.rooms[home].remotes.length
								) {
									home = name;
									route = path;
								}
							}
						});
						console.log("\tClosest Room: " + home);
					}
				});
			}
		}
		//  }
	},
};
