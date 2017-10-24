var weapon = require('./weapon.js');
//var world = require('./world.js');
var Bullet = require('./bullet.js');
var makeInventory = require('./makeInventory.js');

module.exports = function(options) {
    var gun = weapon();
    var bullet;
    if (options.pos) gun.move(options.pos);
    gun.use = function() {
        var bullet = gun.getInventory()[0];
        if (!bullet) {
            bullet = Bullet({velocity: 10, power: 10, range: 500});
            gun.takeItems(bullet);
            world.loadItems(bullet);
        }
        gun.dropItem(bullet);
        bullet.fire(gun.owner.pos);
    };

    gun.type = 'gun';

    for (var i = 0; i < options.startAmmo; i++) {
    }

    return gun;
};



