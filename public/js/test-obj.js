var baseEntity = require('./baseEntity.js');
var makeGeometry = require('./makeGeometry.js');
var makeSolid = require('./makeSolid.js');

module.exports = function(options) {
    var obj = baseEntity();
    obj.radius = 10;
    makeGeometry(obj, 'circle');
    makeSolid(obj);
    obj.base = 'obj';
    obj.type = 'test';
    obj.move(options.pos);
    obj.collide = function() {};

    return obj;
};

