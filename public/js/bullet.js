var projectile = require('./projectile.js');
var makeSolid = require('./makeSolid.js');

var Bullet = function(options) {

    var bullet = projectile();

    bullet.fire = function(pos) {
        var distance = 0;
        var theta = pos.rot;
        bullet.inertia = true;
        bullet.pos.rot = pos.rot;
        bullet.onTop = true;
        bullet.velocity = 25;
        makeSolid(bullet);
        bullet.step(function() {
            if (bullet.die || distance > bullet.range) bullet.unload();
            distance++;
            bullet.push({x: Math.cos(theta) * bullet.velocity, y: Math.sin(theta) * bullet.velocity});
        });
        bullet.radius = 1;
        bullet.collide = function(collider){
            switch (collider.type) {
                case 'zombie':
                    bullet.unload();
                    break;
            }
            switch (collider.base) {
                case 'square':
                    bullet.unload();
                    break;
            }
        }
        bullet.move({x: pos.x + Math.cos(theta) * 75, y: pos.y + Math.sin(theta) * 75});
    };

    for (var key in options) {
        bullet[key] = options[key];
    }

    bullet.type = 'bullet';
    return bullet;
};




module.exports = Bullet;
