var baseEntity = require('./baseEntity.js');
var zombie = require('./Zombie.js');
var makeStartOptions = require('./makeStartOptions.js');
var makeGeometry = require('./makeGeometry.js');
//var world = require('./world.js');

module.exports = function(options) {
    var spawner = baseEntity();
    makeStartOptions(spawner);
    makeGeometry(spawner, 'circle');
    var timer = Date.now();
    var spawning = options.start;
    var spawnCount = options.spawnCount;
    var lastSpawn = Date.now();
    spawner.startOptions({
        start: options.start,
        spawnCount: options.spawnCount,
        interval: options.interval
    });
    
    spawner.base = 'spawner';
    spawner.type = 'zombieSpawner';
    spawner.move(options.pos);
    spawner.step(function() {
        var now = Date.now();
        if (spawning) {
            if (spawnCount === 0) {
                spawnCount = options.spawnCount;
                spawning = false;
                timer = now;
            }
            if (now - lastSpawn > 500) {
                lastSpawn = now;
                world.loadItems(zombie({pos: spawner.pos}));
                spawnCount--;
            }

        } else {
            if (now - timer > options.interval) {
                spawning = true;
            }
        }
    });

    return spawner;
};

