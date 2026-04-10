const role_grunt = require("role.grunt");
const role_harvester = require("role.harvester");
const role_hauler = require("role.hauler");
const role_medic = require("role.medic");
const role_quartermaster = require("role.quartermaster");
const role_worker = require("role.worker");
const creepHarvest = require("./creep.harvest");

module.exports = {
	active_defence_check: function (room) {
		let hostiles = room.find(FIND_HOSTILE_CREEPS).length;
		if (hostiles > 0) {
			let grunts = room.find(FIND_MY_CREEPS, {
				filter: function (creep) {
					return creep.memory.role == "grunt";
				},
			});
			let medics = room.find(FIND_MY_CREEPS, {
				filter: function (creep) {
					return creep.memory.role == "medic";
				},
			}).length;
			if (grunts.length == hostiles * 4 && medics == hostiles * 2) {
				grunts.forEach(function (grunt) {
					grunt.memory.active_defence = true;
				});
			}
		}
	},
	body: function (role, energy) {
		if (role == "quartermaster") {
			role = "hauler";
		}
		let parts = [];
		let cost = 0;
		let set_cost;
		switch (role) {
			case "grunt":
				set_cost = 60;
				if (energy >= 130) {
					parts = [ATTACK, MOVE];
					cost = 130;
					while (energy - cost >= set_cost) {
						parts = [TOUGH].concat(parts, [MOVE]);
						cost += set_cost;
						if (parts.length == 50) {
							break;
						}
					}
				}
				break;
			case "harvester":
				set_cost = 150;
				if (energy >= set_cost + 50) {
					work = [];
					parts = [CARRY];
					move = [];
					cost = 50;
					while (energy - cost >= set_cost) {
						cost += set_cost;
						work.push(WORK);
						move.push(MOVE);
					}
					parts = work.concat(parts, move);
				}
				break;
			case "hauler":
				set_cost = 100;
				if (energy >= set_cost) {
					while (energy - cost >= set_cost) {
						parts = [CARRY].concat(parts, [MOVE]);
						cost += set_cost;
						if (parts.length == 50) {
							break;
						}
					}
				}
				break;
			case "medic":
				set_cost = 300;
				if (energy >= set_cost) {
					while (energy - cost >= set_cost) {
						parts = [MOVE].concat(parts, [HEAL]);
						cost += set_cost;
						if (parts.length == 50) {
							break;
						}
					}
				}
				break;
			case "worker":
				set_cost = 200;
				if (energy >= set_cost) {
					let work = [];
					let move = [];
					while (energy - cost >= set_cost) {
						work.push(WORK);
						parts.push(CARRY);
						move.push(MOVE);
						cost += set_cost;
						if (parts.length == 48) {
							break;
						}
					}
					parts = work.concat(parts, move);
				}
				break;
		}
		return {
			parts: parts,
			cost: cost,
		};
	},
	main: function () {
		for (let name in Game.creeps) {
			console.log("-------> " + name);
			let creep = Game.creeps[name];
			let creep_memory = creep.memory;
			console.log("Recycle? " + creep_memory.recycle);
			console.log("Renew? " + creep_memory.renew);
			if (!creep_memory.recycle && !creep_memory.renew) {
				switch (creep_memory.role) {
					case "grunt":
						role_grunt.run(creep);
						break;
					case "harvester":
						role_harvester.run(creep);
						break;
					case "hauler":
						role_hauler.run(creep);
						break;
					case "medic":
						role_medic.run(creep);
						break;
					case "quartermaster":
						role_quartermaster.run(creep);
						break;
					case "worker":
						role_worker.run(creep);
						break;
				}
			}
		}
	},
	roles: function (room) {
		let container_count = room.find(FIND_STRUCTURES, {
			filter: { structureType: STRUCTURE_CONTAINER },
		}).length;
		let source_count = room.find(FIND_SOURCES, {
			filter: function (_source) {
				return (
					_source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20)
						.length == 0 || room.memory.towers.length > 0
				);
			},
		}).length;
		let storage_count = room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_STORAGE },
		}).length;
		let hostiles = 0; //room.find(FIND_HOSTILE_CREEPS).length;
		return [
			{
				name: "grunt",
				max: hostiles * 4,
			},
			{
				name: "medic",
				max: hostiles * 2,
			},
			{
				name: "harvester",
				max: source_count,
			},
			{
				name: "hauler",
				max: container_count,
			},
			{ name: "quartermaster", max: 1 ? storage_count > 0 : 0 },
			{
				name: "worker",
				max: source_count,
			},
		];
	},
};
