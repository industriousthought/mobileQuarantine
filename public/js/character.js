var baseEntity = require('./baseEntity.js');
var makeVisible = require('./makeVisible.js');
var makeInventory = require('./makeInventory.js');
var makeSolid = require('./makeSolid.js');
var makeGeometry = require('./makeGeometry.js');

module.exports = function(options) {
    var character = baseEntity();
    var aniTick = 0;
    makeInventory(character);
    makeGeometry(character, 'circle');
    makeSolid(character);
    makeVisible(character);
    character.radius = 50;
    character.solid = true;
    character.onTop = true;
    character.geometry = 'circle';
    character.lookAtVec = function(vec) {
        var theta = Math.atan2(vec.y, vec.x);
        character.pos.rot = theta + Math.PI;
        return theta;
    };
    character.lookAtObj = function(obj) {
        var theta = Math.atan2(obj.pos.y - character.pos.y, obj.pos.x - character.pos.x);
        character.pos.rot = theta;
        return theta;
    };
    character.base = 'character';
    character.health = 1;
    character.step(function() {
        if (character.health <= 0) character.addMode('die');
        aniTick++;
        if (!character.velocity) {
            character.pose.x = 0;
        } else {
            if (aniTick > 16 - character.velocity) {
                aniTick = 0;
                if (character.pose.x < character.textureData.poses.slides[character.pose.y] - 1) {
                    character.pose.x++;
                } else {
                    character.pose.x = 0;
                }
            } else {
                aniTick++;
            }
        }
    });
    character.modes = options.modes;
    character.collide = options.collide;
    character.type = options.type;
    character.addMode = function(mode) {
        if (character.currentMode === mode) return;
        character.currentMode = mode;
        character.modes[mode]();
    };
    character.pose = {x: 0, y: 0};
    character.load(function() { character.addMode(options.mode); });
    character.move(options.pos);
    return character;
};

