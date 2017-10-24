var baseEntity = require('./baseEntity.js');
var makeVisible = require('./makeVisible.js');
var makeGeometry = require('./makeGeometry.js');

module.exports = function() {
    var projectile = baseEntity();
    makeVisible(projectile);
    makeGeometry(projectile, 'circle');
    projectile.base = 'projectile';

    return projectile;
};

