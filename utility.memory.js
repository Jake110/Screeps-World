let structure_names = ["extensions", "towers"];

function set_up_list(path) {
	if (path.constructor != Array) {
		path = [path];
	}
	console.log("Setting Memory List: " + path);
	let position = Memory;
	while (path.length > 0) {
		let next = path.shift();
		console.log("\tNext: " + next);
		if (!position[next]) {
			if (path.length > 0) {
				console.log("Adding");
				position[next] = {};
				position = position[next];
			} else {
				console.log("End of path");
				position[next] = [];
			}
		} else {
			console.log("Exists")
			position = position[next];
		}
	}
}

module.exports = {
	build_coords: function (room_name) {
		positions = [];
		this.structure_names.forEach(function (name) {
			positions = positions.concat(Memory[room_name][name]);
		});
		return positions;
	},
	build_pos: function (room) {
		let pos_list = [];
		this.build_coords(room.name).forEach(function (coord) {
			pos_list.push(this.coord_to_pos(coord, room));
		});
		return pos_list;
	},
	clear: function () {
		for (let name in Memory.creeps) {
			if (!Game.creeps[name]) {
				delete Memory.creeps[name];
			}
		}
	},
	coord_to_pos: function (coord, room) {
		let split_coord = coord.split(":");
		return room.getPositionAt(split_coord[0], split_coord[1]);
	},
	pos_to_coord: function (pos) {
		return pos.x + ":" + pos.y;
	},
	set_up: function (room_name) {
		this.tracker_names.forEach(function (name) {
			set_up_list([room_name, name]);
		});
	},
	set_up_list: set_up_list,
	structure_names: structure_names,
	tracker_names: structure_names.concat(["roads"]),
};
