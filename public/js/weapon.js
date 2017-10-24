var makeVisible = require('./makeVisible.js');
var makeInventory = require('./makeInventory.js');
var baseEntity = require('./baseEntity.js');
var makeSolid = require('./makeSolid.js');
var makeGeometry = require('./makeGeometry.js');


module.exports = function() {
    var weapon = baseEntity();
    makeGeometry(weapon, 'circle');
    makeSolid(weapon);
    makeVisible(weapon);
    makeInventory(weapon);
    weapon.base = 'weapon';
    weapon.radius = '10';
    weapon.coolDown = 5;
    weapon.consolidateInventory = true;
    weapon.collide = function(collider) {
        switch (collider.type) {
            case 'player':
                break;
        }

    };

    return weapon;
};
