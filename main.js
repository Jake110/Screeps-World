var role_builder = require('role.builder');
var role_harvester = require('role.harvester');
var role_upgrader = require('role.upgrader');

var roles = [
    {
        name: 'builder',
        count: 1,
    },
    {
        name: 'harvester',
        count: 2,
    },
    {
        name: 'upgrader',
        count: 1,
    }
];

module.exports.loop = function () {

    // Memory cleanup
    for(let name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        };
    };

    // Spawn new creeps
    for(let n in roles) {
        if(Game.spawns['Spawn1'].spawnCreep([WORK,CARRY,MOVE], 'Test', {dryRun: true}) != OK) {
            break;
        };
        let role = roles[n]
        let role_name = role.name;
        let role_cap = role.name;
        role_cap[0] = role_cap[0].toUpperCase();
        let max = role.count;

        let role_creeps = _.filter(Game.creeps, (creep) => creep.memory.role == role.name);
        
        if(role_creeps.length < max) {
            console.log(role_cap + ' count: ' + role_creeps.length + '/' + max);
            let new_name = role_cap + Game.time;
            console.log('Spawning new ' + role.name + ': ' + new_name);
            Game.spawns['Spawn1'].spawnCreep([WORK,CARRY,MOVE], new_name, 
                {memory: {role: role.name}});
        };
        
        if(Game.spawns['Spawn1'].spawning) { 
            let spawning_creep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                '🛠️' + spawning_creep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1, 
                Game.spawns['Spawn1'].pos.y, 
                {align: 'left', opacity: 0.8});
        };
    };

    // Tower control
    let tower = Game.getObjectById('c892c3d7f0ca9bd30c8f2c8d');
    if(tower) {
        let damaged_structure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if(damaged_structure) {
            tower.repair(damaged_structure);
        };

        let closest_hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closest_hostile) {
            tower.attack(closest_hostile);
        };
    };

    // Creep control
    for(let name in Game.creeps) {
        let creep = Game.creeps[name];
        if(creep.memory.role == 'builder') {
            role_builder.run(creep);
        };
        if(creep.memory.role == 'harvester') {
            role_harvester.run(creep);
        };
        if(creep.memory.role == 'upgrader') {
            role_upgrader.run(creep);
        };
    };
};