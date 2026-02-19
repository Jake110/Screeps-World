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
			pos_list.push(
				room.getPositionAt(coord.split(":")[0], coord.split(":")[1]),
			);
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
	set_up: function (room_name) {
		this.set_up_memory(room_name, {});
		this.tracker_names.forEach(function (name) {
			this.set_up_memory(room_name, [], name);
		});
	},
	set_up_memory: function (path, value, sub_path = null) {
		if (sub_path) {
			if (Memory[path][sub_path] == null) {
				Memory[path][sub_path] = value;
			}
		} else if (Memory[path] == null) {
			Memory[path] = value;
		}
	},
	structure_names: ["extensions", "towers"],
	tracker_names: this.structure_names.concat(["roads"]),
};
