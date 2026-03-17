const hauler = require("creep.hauler");
const quartermaster = require("creep.quartermaster");

module.exports = {
	run: function (creep) {
		let room_memory = creep.room.memory;
		hauler.capacity_check(creep, RESOURCE_ENERGY);
		if (creep.memory.full) {
			let storage = quartermaster.get_structure(
				creep.room,
				room_memory.storage,
				STRUCTURE_STORAGE,
			);
			if (storage) {
				console.log("Depositing at " + storage.pos);
				if (
					creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE
				) {
					creep.moveTo(storage, {
						visualizePathStyle: { stroke: "#2bff00" },
					});
				}
			}
		} else {
			let core_link = quartermaster.get_structure(
				creep.room,
				room_memory.links[0],
				STRUCTURE_LINK,
			);
			if (core_link) {
				console.log("Collecting from " + core_link.pos);
				if (
					creep.withdraw(core_link, RESOURCE_ENERGY) ==
					ERR_NOT_IN_RANGE
				) {
					creep.moveTo(core_link, {
						visualizePathStyle: { stroke: "#fff23e" },
					});
				}
			}
		}
	},
};
