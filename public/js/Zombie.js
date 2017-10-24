var Character = require('./character.js');

module.exports = function(options) {

    var currentAttractor = false;
    var speed = 1 + Math.random() * 3;

    var zombie = Character({
        type: 'zombie',
        mode: 'wandering',
        pos: options.pos,
        modes: {
            rewandering: function() {
                zombie.addMode('wandering');
            },
            wandering: function() {
                //console.log('wandering');
                //if (Math.random() < 0.05) zombie.audio = 'growl';
                var timeLength = 1 + parseInt(Math.random() * 3 * 1000);
                var startTime = Date.now();
                var randomSpeed = Math.random() * 2;
                zombie.pos.rot = Math.random() * Math.PI * 2;
                zombie.pose.y = 1;

                zombie.addEffect(function() {
                    var now = Date.now();
                    if (zombie.currentMode !== 'wandering') {
                        return false;
                    }
                    if (startTime + timeLength < now) {
                        zombie.addMode('rewandering');
                        return false; 
                    }
                    zombie.push({x: Math.cos(zombie.pos.rot) * randomSpeed, y: Math.sin(zombie.pos.rot) * randomSpeed});
                    return true;
                });
            },
            searching: function() {
            },
            chasing: function() {
                zombie.addEffect(function() {
                    var theta = zombie.lookAtObj(currentAttractor);
                    if (zombie.currentMode !== 'chasing' || !currentAttractor) {
                        return false;
                    }
                    zombie.push({x: Math.cos(theta) * speed / 2, y: Math.sin(theta) * speed / 2});
                    return true;
                });
            },
            running: function() {
            },
            biting: function() {
            },
            staggering: function() {
            },
            die: function() {
                zombie.unload();
            }
        },
        collide: function(collider) {
            switch (collider.type) {
                case 'bullet':
                case 'meelee':
                    zombie.health -= collider.power / 100;
                    break;
            }
        }
    });

    zombie.step(function() {
        currentAttractor = world.getItemsByType('player')[0];
        if (currentAttractor) {
            zombie.addMode('chasing');
        } else {
            zombie.addMode('wandering');
        }
    });

    return zombie;
};
