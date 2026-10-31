module.exports = {
	coord_to_pos: function (coord, room) {
		let split_coord = coord.split(":");
		return room.getPositionAt(split_coord[0], split_coord[1]);
	},
	pos_to_coord: function (pos) {
		return pos.x + ":" + pos.y;
	},
};
