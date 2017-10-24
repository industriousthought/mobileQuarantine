var getId = require('./getId.js').getId;


module.exports = function() {
    var pushEvents = [];
    var moveEvents = [];
    var loadEvents = [];
    var unloadEvents = [];
    var stepEvents = [];
    var loaded = false;
    var objName = false;
    var moved = false;
    var newEffects = [];
    var effects = [];
    var obj = {
        inContainer: function() {
            return (!!obj.owner);
        },
        setObjName: function(name) {
            objName = name;
        },
        getObjName: function() {
            return objName;
        },
        load: function() {
            var args = [].slice.call(arguments);
            if (args.length) {
                if (loaded) {
                    args.forEach(function(e) { e(); });
                } else {
                    loadEvents = args.concat(loadEvents);
                }
                return;
            }
            if (!loaded) {
                loadEvents.forEach(function(e) { e(); });
                loaded = true;
            }
        },
        unload: function() {
            var args = [].slice.call(arguments);
            if (args.length > 0) return unloadEvents = args.concat(unloadEvents);
            unloadEvents.forEach(function(e) { e(); });
            world.deleteItem(obj.id);
            if (obj.owner) obj.owner.dropItem(obj);
        },
        step: function() {
            var args = [].slice.call(arguments);
            if (args.length > 0) return stepEvents = args.concat(stepEvents);
            stepEvents.forEach(function(e) { e(); });
            effects = effects.concat(newEffects);
            newEffects = [];
            effects = effects.filter(function(item) { return item.call(obj); });
            if (moved) obj.processMovementEvents();
            if (obj.pos.rot > Math.PI * 2) obj.pos.rot -= Math.PI * 2;
            if (obj.pos.rot < 0) obj.pos.rot += Math.PI * 2;

        },
        processMovementEvents: function() {
            obj.velocity = Math.sqrt(obj.pos.vec.x * obj.pos.vec.x + obj.pos.vec.y * obj.pos.vec.y);
            if (obj.velocity > 30) {
                //debugger;
                obj.pos.vec.x = obj.pos.vec.x / (obj.velocity / 30);
                obj.pos.vec.y = obj.pos.vec.y / (obj.velocity / 30);
                obj.velocity = 30;
            }
            obj.pos.x += obj.pos.vec.x;
            obj.pos.y += obj.pos.vec.y;
            if (obj.owner) {
                obj.move(obj.owner.pos);
            }
            obj.pos.vec.x = 0;
            obj.pos.vec.y = 0;
            moveEvents.forEach(function(fn) { fn(); });
            moved = false;
        },
        id: getId(),
        pos: {
            x: 0,
            y: 0,
            rot: 0,
            vec: {
                x: 0,
                y: 0
            }
        },
        move: function(pos) {
            if (pos.ev) {
                moveEvents.push(pos.ev);
            }
            if (pos.x) obj.pos.x = pos.x;
            if (pos.y) obj.pos.y = pos.y;
            if (pos.rot) obj.pos.rot = pos.rot;
            moved = true;
        },
        push: function(vec) {
            if (vec.ev) {
                moveEvents.push(vec.ev);
            }
            if (vec.x) obj.pos.vec.x += vec.x;
            if (vec.y) obj.pos.vec.y += vec.y;
            moved = true;
        },
        addEffect: function(fn) {
            newEffects.push(fn);
        }
    };


    return obj;
};

