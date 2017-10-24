var getId = require('./getId.js').getId;
var square = require('./square.js');
var makeSolid = require('./makeSolid.js');

module.exports = function(options) {
    var objEvents = [];
    var area = square(options);
    area.onTop = true;
    area.type = 'area';
    area.playerMessage = '';
    area.addObjEvent = function(trigger, verb, noun) {
        var id = getId();
        objEvents.push({id: id, trigger: trigger, verb: verb, noun: noun});
        return id;
    };
    area.deleteObjEvent = function(id) {
        objEvents = objEvents.filter(function(item) { return (item.id !== id); });
    };
    area.getObjEvent = function(id) {
        if (id) return objEvents.filter(function(item) { if (item.id = id) return true; })[0];
        return objEvents;
    };
    area.collide = function(collider) {
        objEvents.forEach(function(item) {
            if (item.trigger === collider.type || item.trigger === collider.base) {
                world.getObjByName(item.noun).verbs[item.verb]();
            }
        });
    };

    return area;
};
