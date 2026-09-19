const combat = require("utility.combat");
const hauler = require("creep.hauler");
const memory = require("utility.memory");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		if (creep.room.memory.containers.length > 0) {
			let max_harvesters = this.harvester_per_source(creep.room);
			let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
				filter: function (source) {
					if (combat.safe_check(source.pos)) {
						let valid = false;
						source.pos
							.findInRange(FIND_STRUCTURES, 2, {
								filter: function (structure) {
									return (
										structure.structureType ==
											STRUCTURE_CONTAINER ||
										(structure.structureType ==
											STRUCTURE_LINK &&
											structure.my)
									);
								},
							})
							.forEach(function (structure) {
								if (
									structure.store.getFreeCapacity(
										RESOURCE_ENERGY,
									) > 0
								) {
									valid = true;
								}
							});
						if (valid) {
							return (harvesters =
								creep.room.find(FIND_MY_CREEPS, {
									filter: function (_creep) {
										return (
											_creep.memory.role == "harvester" &&
											_creep.memory.target == source.id
										);
									},
								}).length < max_harvesters);
						}
					}
				},
			});
			if (source) {
				creep.memory.target = source.id;
				if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
					creep.moveTo(source, {
						visualizePathStyle: { stroke: "#fff23e" },
					});
				}
			}
		} else {
			let harvest_target = creep.pos.findClosestByPath(
				FIND_SOURCES_ACTIVE,
				{
					filter: function (source) {
						return combat.safe_check(source);
					},
				},
			);
			if (harvest_target) {
				if (creep.harvest(harvest_target) == ERR_NOT_IN_RANGE) {
					creep.moveTo(harvest_target, {
						visualizePathStyle: { stroke: "#fff23e" },
					});
				}
			}
		}
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (deposit_target.length == 0) {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 3, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
		}
		if (deposit_target.length > 0) {
			deposit_target = deposit_target[0];
			creep.transfer(deposit_target, RESOURCE_ENERGY);
		}
	},
	/** @param {Room} room **/
	harvester_per_source: function (room) {
		let best_harvester = 3;
		room.find(FIND_MY_CREEPS, {
			filter: function (creep) {
				if (creep.memory.role == "harvester") {
					best_harvester = max(best_harvester, creep.body.length);
				}
			},
		});
		return 3000 / (best_harvester - 1) / 300;
	},
	/** @param {Creep} creep **/
	deposit: function (creep) {
		this.reset_target(creep);
		let invalid_target_check = function (target_list) {
			let invalid = true;
			if (target_list.length > 0) {
				let target = target_list[0];
				if (target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
					invalid = false;
				}
			}
			return invalid;
		};
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 4, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (invalid_target_check(deposit_target)) {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
		}
		if (invalid_target_check(deposit_target)) {
			if (creep.body.length > 4) {
				// We want to focus on building the container if it's missing
				let sites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
					filter: { structureType: STRUCTURE_CONTAINER },
				});
				if (sites.length > 0) {
					creep.build(sites[0]);
					return null;
				}
			}
			if (hauler.recharge(creep)) {
				return null;
			}
			worker.upgrade(creep);
		} else {
			deposit_target = deposit_target[0];
			let result = null;
			if (deposit_target.structureType == STRUCTURE_CONTAINER) {
				// If we're depositing into a container, make sure it's not about to die
				if (deposit_target.hits / deposit_target.hitsMax < 0.5) {
					result = creep.repair(deposit_target);
				}
			}
			result = creep.transfer(deposit_target, RESOURCE_ENERGY);
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(deposit_target, {
					visualizePathStyle: { stroke: "#2bff00" },
				});
			}
		}
	},
	reset_target: function (creep) {
		creep.memory.target = null;
	},
};
