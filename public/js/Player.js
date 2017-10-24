var events = require('./events.js');
var Character = require('./character.js');

module.exports = function(options) {

    var player = Character({
        pos: options.pos,
        type: 'player',
        mode: 'standing',
        modes: {
            die: function() {
                events.emit('die');
            },
            standing: function() {
                player.pose.y = 0;
                player.velocity = 0;
            },
            running: function() {

            },
            walking: function() {

            },
            shooting: function() {
                player.pose.y = 1;
                if (player.currentWeapons.length === 0) return;
                var coolDown = player.currentWeapons[player.weilding].coolDown;
                var tick = coolDown - 1;
                player.addEffect(function() {
                    if (player.currentMode !== 'shooting') return false;
                    tick++;
                    if (tick > coolDown) { 
                        player.currentWeapons[player.weilding].use();
                        tick = 0;
                    }
                    return true;
                });
            }
        },

        collide: function(collider) {
            switch (collider.base) {
                case 'weapon':
                    if (!collider.inContainer()) player.takeItems(collider);
                    break;

            }

            switch (collider.type) {
                case 'zombie':
                    events.emit('gameOver');
                    console.log('gameoverrrrrr');
                    //player.health -= 0.4;
                    break;
                case 'area': 

                    break;
            }

        }
        
    });
    player.nextWeapon = function() {
        player.weilding++;
        if (weilding === player.currentWeapons.length) weilding = 0;
    };
    player.weilding = 0;
    player.addEffect(function() {
        player.currentWeapons = player.getInventoryByBase('weapon');
        player.currentWeapons.forEach(function(weapon, index) {
            if (weapon.selectWeapon) player.weilding = index;
        });
        return true;
    });


    return player;
};
