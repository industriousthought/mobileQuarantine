var Entities = {};

Entities['player'] = require('./Player.js');
Entities['test'] = require('./test-obj.js');
Entities['gun'] = require('./gun.js');
Entities['tile'] = require('./square.js');
Entities['zombieSpawner'] = require('./spawner.js');
Entities['zombie'] = require('./Zombie.js');
Entities['wall'] = require('./wall.js');
Entities['door'] = require('./door.js');
Entities['area'] = require('./area.js');

module.exports = Entities;
