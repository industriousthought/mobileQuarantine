(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./character.js":6,"./events.js":8}],2:[function(require,module,exports){
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

},{"./character.js":6}],3:[function(require,module,exports){
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

},{"./getId.js":11,"./makeSolid.js":17,"./square.js":25}],4:[function(require,module,exports){
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


},{"./getId.js":11}],5:[function(require,module,exports){
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

},{"./makeSolid.js":17,"./projectile.js":21}],6:[function(require,module,exports){
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


},{"./baseEntity.js":4,"./makeGeometry.js":15,"./makeInventory.js":16,"./makeSolid.js":17,"./makeVisible.js":19}],7:[function(require,module,exports){
var wall = require('./wall.js');
var makeStartOptions = require('./makeStartOptions.js');

module.exports = function(options) {
    var door = wall(options);
    makeStartOptions(door);
    door.startOptions({speed: options.speed});
    door.type = 'door';
    door.openPos = options.openPos || options.pos;
    door.closePos = options.closePos || options.pos;
    door.opened = options.opened || true;

    var progress = (door.opened) ? 1 : 0;
    var startTime;
    var updatePos = function(toggle) {
        if (toggle) progress = (door.opened) ? 1 : 0;
        door.move({
            x: door.openPos.x + (door.closePos.x - door.openPos.x) * progress,
            y: door.openPos.y + (door.closePos.y - door.openPos.y) * progress,
            rot: door.openPos.rot + (door.closePos.rot - door.openPos.rot) * progress
        });
    };

    door.updatePos = updatePos;

    updatePos();

    if (!door.verbs) door.verbs = {};
    door.verbs.open = function() {
        if (door.opened) {
            door.opened = false;
            door.addEffect(function() {
                progress -= options.speed;
                if (progress < 0) progress = 0;
                updatePos();
                return (progress && !door.opened);
            });
        } else {
            door.opened = true;
            door.addEffect(function() {
                progress += options.speed;
                if (progress > 1) progress = 1;
                updatePos();
                return (progress - 1 && door.opened);
            });
        }
    };

    return door;
};


},{"./makeStartOptions.js":18,"./wall.js":29}],8:[function(require,module,exports){
var events = {};

var api = {
    emit: function(e) {
        for (var id in events) {
            if (events[id].e === e) events[id].f();
        }
    },
    register: function(e, f, id) {
        //console.log('registering event ' + e, f, id);
        events[id] = {
            f: f,
            e: e
        };
    },
    unregister: function(id) {
        delete events[id];
    }
};

module.exports = api;

var animate = function() {
    api.emit('animate');
    window.requestAnimationFrame(animate);
};
if (typeof window !== 'undefined') animate();

},{}],9:[function(require,module,exports){

module.exports = function(url, callback) {
    var http = new XMLHttpRequest();

    http.open('GET', url, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        var data;
        if((http.readyState === 4) && http.status === 200) {
            if (/^[\],:{}\s]*$/.test(http.responseText.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                data = JSON.parse(http.responseText);
            } else {
                data = http.responseText;
            }
            callback(data)
        }
    };
    http.send();

};


},{}],10:[function(require,module,exports){
var Entities = {};

Entities['player'] = require('./Player.js');
Entities['test'] = require('./test-obj.js');
Entities['gun'] = require('./gun.js');
Entities['tile'] = require('./square.js');
Entities['zombieSpawner'] = require('./spawner.js');
Entities['zombie'] = require('./Zombie.js');
Entities['wall'] = require('./wall.js');
Entities['door'] = require('./door.js');
Entities['area'] = require('./area.js');

module.exports = Entities;

},{"./Player.js":1,"./Zombie.js":2,"./area.js":3,"./door.js":7,"./gun.js":13,"./spawner.js":23,"./square.js":25,"./test-obj.js":27,"./wall.js":29}],11:[function(require,module,exports){
var lastId = 0;

var api = {
    getId: function() {
        return 'a' + lastId++;
    }
};

module.exports = api;

},{}],12:[function(require,module,exports){
var events = require('./events.js');
window.world = require('./world.js');
window.renderer = require('./renderer.js');

world.loadItems(JSON.parse( '['+
            '{"entity":"zombie","pos":{"x":1500,"y":1500,"rot":0.028333665452588},"radius":50},'+
            '{"entity":"wall","pos":{"x":2100,"y":2100,"rot":1.028333665452588},"width":250,"height":150},'+
            '{"entity":"wall","pos":{"x":1300,"y":2100,"rot":1.028333665452588},"width":250,"height":350},'+
            '{"entity":"wall","pos":{"x":1700,"y":2100,"rot":1.028333665452588},"width":250,"height":250},'+
            '{"entity":"wall","pos":{"x":2100,"y":1660,"rot":1.028333665452588},"width":550,"height":150},'+
            '{"entity":"zombie","pos":{"x":2170,"y":2170,"rot":0.028333665452588},"radius":50},'+
            '{"entity":"zombie","pos":{"x":1500,"y":1500,"rot":0.028333665452588},"radius":50},'+
            '{"entity":"zombie","pos":{"x":2401,"y":2401,"rot":0.749632850988619},"radius":250}]' ));
            

window.addEventListener('load', function() {
    world.step();
    renderer.connectCamera(world.getItems()[0]);

    events.register('animate', function() {
        world.getItems().forEach(function(item) {
            item.move({rot: item.pos.rot + .05});
        });
        renderer.step();
    }, 'mainEventLoop');
});


},{"./events.js":8,"./renderer.js":22,"./world.js":32}],13:[function(require,module,exports){
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




},{"./bullet.js":5,"./makeInventory.js":16,"./weapon.js":30}],14:[function(require,module,exports){
module.exports = [
{"entity": "tile",
    "pos": {
        "x":9930,
        "y":10156,
        "rot":0.78
    },
    "width":"5000",
    "height":"5000"},
{"entity":"player",
    "pos": {"x":10023.028868996085,"y":9980.773164775213,"rot":0},"radius":50},
{"entity":"gun",
    "pos": {"x":10023.028868996085,"y":9980.773164775213,"rot":0}},
{"entity":"wall","pos":{"x":10448,"y":10773,"rot":0.78},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":9599,"y":9799,"rot":0.78},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":8133,"y":8445,"rot":0.78},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":10681,"y":9777,"rot":2.34},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":10924,"y":8514,"rot":1.58},"width":"100","height":"800"},{"entity":"wall","pos":{"x":10003,"y":8608,"rot":3.14},"width":"100","height":"1600"},{"entity":"wall","pos":{"x":11642,"y":8413,"rot":2.34},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":11695,"y":11877,"rot":0.78},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":8183,"y":11921,"rot":2.34},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":10267,"y":8790,"rot":3.14},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":10351,"y":7861,"rot":1.58},"width":"100","height":"800"},{"entity":"wall","pos":{"x":11024,"y":9055,"rot":0.3},"width":"400","height":"250"},{"entity":"wall","pos":{"x":11898,"y":9490,"rot":0.6},"width":"900","height":"100"},{"entity":"wall","pos":{"x":11619,"y":9895,"rot":0.6},"width":"900","height":"100"},{"entity":"wall","pos":{"x":9500,"y":11786,"rot":0},"width":"800","height":"800"},
{"entity":"zombieSpawner","pos":{"x":7769,"y":9411,"rot":0},"radius":10, "start": true, "interval": 20000, "spawnCount": 15},
{"entity":"zombieSpawner","pos":{"x":12379,"y":9449,"rot":0},"radius":10, "start": false, "interval": 45000, "spawnCount": 35},
{"entity":"zombieSpawner","pos":{"x":8760,"y":11983,"rot":0},"radius":10, "start": true, "interval": 20000, "spawnCount": 5}

];



},{}],15:[function(require,module,exports){
var perpPoint = function(verts, p) {
    var output = verts.map(function(v0, index, array) {
        var v1 = array[index + 1];
        if (index + 1 === array.length) v1 = array[0];
        var k = ((v1.y - v0.y) * (p.x - v0.x) - (v1.x - v0.x) * (p.y - v0.y)) / (Math.pow(v1.y - v0.y, 2) + Math.pow(v1.x - v0.x, 2));
        var perpPoint = {x: p.x - k * (v1.y - v0.y), y: p.y + k * (v1.x - v0.x)};
        var dis = Math.sqrt(Math.pow(p.x - perpPoint.x, 2) + Math.pow(p.y - perpPoint.y, 2));
        return {dis: dis, perpPoint: perpPoint};
    });
    return output.reduce(function(past, current) { 
        if (!past.dis) return current;
        if (current.dis < past.dis) return current;
        return past;
    }).perpPoint;
};


var pointInPolygon = function(square, circle) {
    var c = false;
    var i, j, x, y, p;
    var vertices = square.verts;
    var point = circle.pos;

    j = vertices.length - 1;

    for (i = 0; i < vertices.length; i++) {

        if ( ((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
        (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x) ) {
            c = !c;
        }

        j = i;
    }

    if (c) {
        if (square.solid && circle.solid) {
            p = perpPoint(vertices, point);
            //x = p.x - circle.pos.x;
            //y .= p.y - circle.pos.y;
            //circle.addEffect(function() { 
                circle.move({x: p.x, y: p.y}); 
            //});
            circle.collide(square);
            square.collide(circle);
        }
        return true;
    }
};

var longPush = function(a, b) {
    var then = Date.now();
    var x = Math.cos(b.pos.rot) * b.velocity;
    var y = Math.sin(b.pos.rot) * b.velocity;
    a.addEffect(function() {
        var elapsedTime = (Date.now() - then) / 1000;
        var scaler = Math.pow(elapsedTime - 1, 2);
        if (elapsedTime > 1) return false;
        a.push({x: x * scaler, y: y * scaler});

    });
};

var circleDetect = function(a, b) {
    var x, y, dis, radius, delta, theta, aDelta, bDelta;
    x = a.pos.x - b.pos.x;
    y = a.pos.y - b.pos.y;
    dis = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    radius = parseInt(a.radius) + parseInt(b.radius);

    if (dis < radius) {
        if (a.solid && b.solid) {
            delta = (radius - dis);
            theta = Math.atan2(y, x);
            a.addEffect(function() { 
                a.push({
                    x: (Math.cos(theta) * delta), 
                    y: (Math.sin(theta) * delta)
                }); 
                return false;
            });
            b.addEffect(function() { 
                b.push({
                    x: (Math.cos(theta) * -delta),  
                    y: (Math.sin(theta) * -delta)
                }); 
                return false;
            });
            if (b.inertia) longPush(a, b);
            if (a.inertia) longPush(b, a);
            a.collide(b);
            b.collide(a);
        }
        return true;
    }
};

var setAABB = function(obj) {
    var AABB = {
        xs: [{type: 'b', val: Infinity, obj: obj}, {type: 'e', val: -Infinity, obj: obj}],
        ys: [{type: 'b', val: Infinity, obj: obj}, {type: 'e', val: -Infinity, obj: obj}]
    };

    if (obj.geometry === 'circle') {
        AABB.xs[0].val = obj.pos.x - obj.radius;
        AABB.xs[1].val = obj.pos.x + obj.radius;
        AABB.ys[0].val = obj.pos.y - obj.radius;
        AABB.ys[1].val = obj.pos.y + obj.radius;
        obj.AABB = AABB;
        return;
    };
    if (obj.geometry === 'square') {
        obj.AABB = obj.verts.reduce(function(acc, vert) {
            if (vert.x < acc.xs[0].val) acc.xs[0].val = vert.x;
            if (vert.x > acc.xs[1].val) acc.xs[1].val = vert.x;
            if (vert.y < acc.ys[0].val) acc.ys[0].val = vert.y;
            if (vert.y > acc.ys[1].val) acc.ys[1].val = vert.y;
            return acc;
        }, AABB);
    }
};

var setVerts = function(obj) {

    obj.pos.x = parseInt(obj.pos.x);
    obj.pos.y = parseInt(obj.pos.y);

    var verts = [
        {x: obj.pos.x - obj.width / 2, y: obj.pos.y - obj.height / 2}, 
        {x: obj.pos.x + obj.width / 2, y: obj.pos.y - obj.height / 2}, 
        {x: obj.pos.x + obj.width / 2, y: obj.pos.y + obj.height / 2}, 
        {x: obj.pos.x - obj.width / 2, y: obj.pos.y + obj.height / 2}, 
    ];

    var rot = obj.pos.rot;
    var ox = obj.pos.x;
    var oy = obj.pos.y;

    obj.verts = verts.map(function(item) {
        var vx = item.x;
        var vy = item.y;
        item.x = Math.cos(rot) * (vx - ox) - Math.sin(rot) * (vy - oy) + ox;
        item.y = Math.sin(rot) * (vx - ox) + Math.cos(rot) * (vy - oy) + oy;
        return item;
    });

    setAABB(obj);
};

module.exports = function(obj, type) {
    obj.geometry = type;
    if (type === 'circle') {
        obj.detectCollide = function(collider) {
            if (collider.geometry === 'circle') return circleDetect(obj, collider);
            if (collider.geometry === 'square') return pointInPolygon(collider, obj);
        };
        obj.move({ev: setAABB.bind(null, obj)});
        setAABB(obj);
    }
    if (type === 'square') {
        obj.detectCollide = function(collider) {
            if (collider.geometry === 'square') return false;
            if (collider.geometry === 'circle') return pointInPolygon(obj, collider);
        };
        obj.width = 100;
        obj.height = 100;
        obj.setDimensions = function(dim) {
            if (dim) {
                if (dim.width) obj.width = dim.width;
                if (dim.height) obj.height = dim.height;
                setVerts(obj);
            }
        }
        obj.move({ev: setVerts.bind(null, obj)});
        setVerts(obj);
    }
};

},{}],16:[function(require,module,exports){

module.exports = function(obj) {

    var inventory = [];
    obj.takeItems = function(items) {
        if (!items.length) items = [items];
        items.forEach(function(item) {
            var currentObj = obj.getInventoryByType(item.type)[0];
            if (currentObj && currentObj.consolidateInventory) {
                currentObj.takeItems(item.getInventory());
                item.unload();
            } else {
                inventory.push(item);
                item.owner = obj;
                item.load();
            }
        });
    };
    obj.dropItem = function(item) {
        item.owner = false;
        inventory = inventory.filter(function(maybeItem) { if (maybeItem.id !== item.id) return true; });
    };
    obj.getInventory = function() {
        return inventory.slice();
    };
    obj.getInventoryByType = function(type) {
        return inventory.filter(function(item) { if (item.type === type) return true; });
    };
    obj.getInventoryByBase = function(base) {
        return inventory.filter(function(item) { if (item.base === base) return true; });
    };
}


},{}],17:[function(require,module,exports){
module.exports = function(obj) {
    obj.solid = true;
};

},{}],18:[function(require,module,exports){


module.exports = function(obj) {
    var startOptions = {};
    obj.startOptions = function(options) {
        if (!options) return startOptions;
        for (var option in options) {
            startOptions[option] = options[option];
        }
    };
};

},{}],19:[function(require,module,exports){
var textureData = require('./textureData.js');

module.exports = function makeVisible (obj) {
    obj.load(function() { 
        obj.textureData = textureData[obj.base][obj.type]; 
        obj.visible = true;
        obj.addEffect(function() {
            if (obj.inContainer()) {
                obj.visible = false;
            } else {
                obj.visible = true;
            }
            return true;
        });
    });
};

},{"./textureData.js":28}],20:[function(require,module,exports){
function MatrixStack() {
      this.stack = [];

      //since the stack is empty this will put an initial matrix in it
          this.restore();
}

// Pops the top of the stack restoring the previously saved matrix
MatrixStack.prototype.restore = function() {
    this.stack.pop();
    // Never let the stack be totally empty
    if (this.stack.length < 1) {
        this.stack[0] = m4.identity();
    }
};

// Pushes a copy of the current matrix on the stack
MatrixStack.prototype.save = function() {
    this.stack.push(this.getCurrentMatrix());
};

// Gets a copy of the current matrix (top of the stack)
MatrixStack.prototype.getCurrentMatrix = function() {
    return this.stack[this.stack.length - 1].slice();
};

// Lets us set the current matrix
MatrixStack.prototype.setCurrentMatrix = function(m) {
    return this.stack[this.stack.length - 1] = m;
};

// Translates the current matrix
MatrixStack.prototype.translate = function(x, y, z) {
    if (z === undefined) {
        z = 0;
    }
    var m = this.getCurrentMatrix();
    this.setCurrentMatrix(m4.translate(m, x, y, z));
};

// Rotates the current matrix around Z
MatrixStack.prototype.rotateZ = function(angleInRadians) {
    var m = this.getCurrentMatrix();
    this.setCurrentMatrix(m4.zRotate(m, angleInRadians));
};

// Scales the current matrix
MatrixStack.prototype.scale = function(x, y, z) {
    if (z === undefined) {
        z = 1;
    }
    var m = this.getCurrentMatrix();
    this.setCurrentMatrix(m4.scale(m, x, y, z));
};


module.exports = MatrixStack;

},{}],21:[function(require,module,exports){
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


},{"./baseEntity.js":4,"./makeGeometry.js":15,"./makeVisible.js":19}],22:[function(require,module,exports){
var events = require('events');
var gl = require('./webgl.js');
var World = require('./world.js');
//var audio = require('./audio.js');
var currentLevel;
var pov;
var canvasDim = gl.canvasDimensions;
World.canvasDim = canvasDim;


var step = function() {

    gl.clear();
    gl.setUpCamera(pov);
    var texture = gl.getTexture();
    var instances = [];
    var textures = [];
    var dims = [];
    World.getGeometry('square').forEach(function(item, index, array) {
        instances = instances.concat([item.pos.x, item.pos.y, item.pos.rot]);
        textures = textures.concat([
                item.textureData.frame.x / ((texture) ? texture.width : 1), 
                item.textureData.frame.y / ((texture) ? texture.height : 1), 
                item.textureData.frame.w / ((texture) ? texture.width : 1), 
                item.textureData.frame.h / ((texture) ? texture.height : 1)
        ]);
        dims = dims.concat([item.width, item.height]);
    });
    gl.drawSquares(instances, dims, textures);
    instances = [];
    textures = [];
    World.getGeometry('circle').forEach(function(item, index, array) {
        instances = instances.concat([item.pos.x, item.pos.y, item.pos.rot, item.radius]);
        textures = textures.concat([
                (item.textureData.frame.x + (((item.pose) ? item.pose.x : 0) / ((item.textureData.poses) ? item.textureData.poses.x : 1)) * item.textureData.frame.w) / ((texture) ? texture.width : 1), 
                (item.textureData.frame.y + (((item.pose) ? item.pose.y : 0) / ((item.textureData.poses) ? item.textureData.poses.y : 1)) * item.textureData.frame.h) / ((texture) ? texture.height : 1), 
                (item.textureData.frame.w / ((item.textureData.poses) ? item.textureData.poses.x : 1)) / ((texture) ? texture.width : 1), 
                (item.textureData.frame.h / ((item.textureData.poses) ? item.textureData.poses.y : 1)) / ((texture) ? texture.height : 1)
        ]);
    });
    gl.drawCircles(instances, textures);

};

var api = {
    step: function() {
        if (pov && gl.isLoaded()) step();
    },
    connectCamera: function(camera) {
        pov = camera.pos;
    }
};


module.exports = api;

},{"./webgl.js":31,"./world.js":32,"events":33}],23:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var zombie = require('./Zombie.js');
var makeStartOptions = require('./makeStartOptions.js');
var makeGeometry = require('./makeGeometry.js');
//var world = require('./world.js');

module.exports = function(options) {
    var spawner = baseEntity();
    makeStartOptions(spawner);
    makeGeometry(spawner, 'circle');
    var timer = Date.now();
    var spawning = options.start;
    var spawnCount = options.spawnCount;
    var lastSpawn = Date.now();
    spawner.startOptions({
        start: options.start,
        spawnCount: options.spawnCount,
        interval: options.interval
    });
    
    spawner.base = 'spawner';
    spawner.type = 'zombieSpawner';
    spawner.move(options.pos);
    spawner.step(function() {
        var now = Date.now();
        if (spawning) {
            if (spawnCount === 0) {
                spawnCount = options.spawnCount;
                spawning = false;
                timer = now;
            }
            if (now - lastSpawn > 500) {
                lastSpawn = now;
                world.loadItems(zombie({pos: spawner.pos}));
                spawnCount--;
            }

        } else {
            if (now - timer > options.interval) {
                spawning = true;
            }
        }
    });

    return spawner;
};


},{"./Zombie.js":2,"./baseEntity.js":4,"./makeGeometry.js":15,"./makeStartOptions.js":18}],24:[function(require,module,exports){
module.exports = {"frames":{"bullet":{"frame":{"x":453,"y":922,"w":201,"h":46},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":201,"h":46},"sourceSize":{"w":201,"h":46}},"machinegun":{"frame":{"x":0,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"pistol":{"frame":{"x":151,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"player":{"frame":{"x":0,"y":0,"w":1500,"h":280},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":280},"sourceSize":{"w":1500,"h":280}},"shotgun":{"frame":{"x":302,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"wall":{"frame":{"x":453,"y":969,"w":100,"h":100},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":100,"h":100},"sourceSize":{"w":100,"h":100}},"zombie1":{"frame":{"x":0,"y":1760,"w":1500,"h":560},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":560},"sourceSize":{"w":1500,"h":560}},"zombie2":{"frame":{"x":0,"y":281,"w":1500,"h":640},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":640},"sourceSize":{"w":1500,"h":640}},"zombie3":{"frame":{"x":0,"y":1634,"w":1500,"h":686},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":686},"sourceSize":{"w":1500,"h":686}}},"meta":{"app":"https://www.leshylabs.com/apps/sstool/","version":"Leshy SpriteSheet Tool v0.8.4","image":"spritesheet.png","size":{"w":1500,"h":2320},"scale":1}};

},{}],25:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var makeVisible = require('./makeVisible.js');
var makeGeometry = require('./makeGeometry.js');

module.exports = function(options) {
    var square = baseEntity();
    makeGeometry(square, 'square');
    makeVisible(square);
    square.setDimensions({width: options.width, height: options.height});
    square.move(options.pos);
    square.base = 'square';
    square.type = 'tile';
    square.collide = function() {};

    return square;
};

},{"./baseEntity.js":4,"./makeGeometry.js":15,"./makeVisible.js":19}],26:[function(require,module,exports){
module.exports = [

    {entity: 'test', pos: {x: -400, y: -405, rot: 0}},
    {entity: 'test', pos: {x: -400, y: -405, rot: 0}}
    //{entity: 'wall', pos: {x: -450, y: -450, rot: 0}, dim: {w: 300, h: 300}},
    //{entity: 'square', pos: {x: -1250, y: -1250, rot: 45}, dim: {w: 2500, h: 2500}}

    /*{entity: 'Tile', pos: {x: 2500, y: 2500}, width: 5000, height: 5000, path: './img/background.jpg'},
    {entity: 'Block', path: './img/wall.png', pos: {x: 0, y: 3900, rot: 0}, width: 100, height: 2600},
    {entity: 'Block', path: './img/wall.png', pos: {x: 0, y: 1100, rot: 0}, width: 100, height: 2200},
    {entity: 'Block', path: './img/wall.png', pos: {x: 2500, y: 0, rot: 0}, width: 5000, height: 100},
    {entity: 'Block', path: './img/wall.png', pos: {x: 2500, y: 5000, rot: 0}, width: 5000, height: 100},
    {entity: 'Block', path: './img/wall.png', pos: {x: 5000, y: 2500, rot: 0}, width: 100, height: 5000},
    {entity: 'Block', path: './img/car1.png', pos: {x: 300, y: 300, rot: 2}, width: 200, height: 300},
    {entity: 'Zombie', img: 2, pos: {x: 1900, y: 1700, rot: 0}}
*/
];



},{}],27:[function(require,module,exports){
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


},{"./baseEntity.js":4,"./makeGeometry.js":15,"./makeSolid.js":17}],28:[function(require,module,exports){
var sprites = require('./sprites.js');

module.exports = {
    character: {
        zombie: { 
            frame: sprites.frames.zombie2.frame,
            poses: {
                x: 6,
                y: 4,
                slides: [6, 5, 2, 3]
            }
        },
        zombie2: { 
            frame: sprites.frames.zombie2.frame,
            poses: {
                x: 6,
                y: 2,
                slides: [6, 5]
            }
        },
        zombie3: { 
            frame: sprites.frames.zombie3.frame,
            poses: {
                x: 6,
                y: 2,
                slides: [6, 5]
            }
        },
        player: { 
            frame: sprites.frames.player.frame,
            poses: {
                x: 6,
                y: 2,
                slides: [6, 5]
            }
        }
    },
    projectile: {
        bullet: {
            frame: sprites.frames.bullet.frame
        }
    },
    square: {
        tile: {
            frame: sprites.frames.wall.frame
        },
        wall: {
            frame: sprites.frames.wall.frame
        },
        door: {
            frame: sprites.frames.wall.frame
        }
    },
    weapon: {
        gun: {
            frame: sprites.frames.pistol.frame
        }
    }
};

},{"./sprites.js":24}],29:[function(require,module,exports){
var square = require('./square.js');
var makeSolid = require('./makeSolid.js');
var makeVisible = require('./makeVisible.js');

module.exports = function(options) {
    var  wall = square(options);
    makeVisible(wall);
    wall.onTop = true;
    makeSolid(wall);
    wall.type = 'wall';

    return wall;
};

},{"./makeSolid.js":17,"./makeVisible.js":19,"./square.js":25}],30:[function(require,module,exports){
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

},{"./baseEntity.js":4,"./makeGeometry.js":15,"./makeInventory.js":16,"./makeSolid.js":17,"./makeVisible.js":19}],31:[function(require,module,exports){
"use strict";
var matrixStack = require('./matrixStack.js');
var get = require('./get.js');
matrixStack = new matrixStack();

var gl, drawSquares, drawCircles, setUpCamera, texture, circleVertShader, squareVertShader, circleFragShader, squareFragShader, isLoaded;
var canvasSpace = {};
var assets = 0;
canvasSpace.width = 3000;
canvasSpace.height = 1500;

var loadedAsset = function() {
    assets++;
    if (assets === 5) loaded();
};

get('../glsl/circle.vert', function(data) {
    circleVertShader = data;
    loadedAsset();
});

get('../glsl/square.vert', function(data) {
    squareVertShader = data;
    loadedAsset();
});

get('../glsl/circle.frag', function(data) {
    circleFragShader = data;
    loadedAsset();
});

get('../glsl/square.frag', function(data) {
    squareFragShader = data;
    loadedAsset();
});

window.addEventListener('load', function() {
    loadedAsset();
});

var loaded = function() {
    isLoaded = true;
    var canvas = document.getElementById('canvas');
    canvas.setAttribute('width', canvasSpace.width);
    canvas.setAttribute('height', canvasSpace.height);
    gl = canvas.getContext('webgl');
    var ext = gl.getExtension("ANGLE_instanced_arrays"); // Vendor prefixes may apply!



    // Get A WebGL context
    /** @type {HTMLCanvasElement} */


    // setup GLSL program
    var circlesProgram = webglUtils.createProgramFromSources(gl, [circleVertShader, circleFragShader]);
    var squaresProgram = webglUtils.createProgramFromSources(gl, [squareVertShader, squareFragShader]);

    // look up where the vertex data needs to go.
    var circlePositionLocation = gl.getAttribLocation(circlesProgram, "a_position");
    var circleTexcoordLocation = gl.getAttribLocation(circlesProgram, "a_texcoord");
    var circleInstanceLocation = gl.getAttribLocation(circlesProgram, "a_instance");
    var circleTexturesLocation = gl.getAttribLocation(circlesProgram, "a_pose");
    var squarePositionLocation = gl.getAttribLocation(squaresProgram, "a_position");
    var squareTexcoordLocation = gl.getAttribLocation(squaresProgram, "a_texcoord");
    var squareInstanceLocation = gl.getAttribLocation(squaresProgram, "a_instance");
    var squareTexturesLocation = gl.getAttribLocation(squaresProgram, "a_pose");
    var squareDimsLocation = gl.getAttribLocation(squaresProgram, "a_dim");

    // lookup uniforms
    var circleCameraMatrixLocation = gl.getUniformLocation(circlesProgram, "u_cameraMatrix");
    var circleCanvasDimsLocation = gl.getUniformLocation(circlesProgram, "u_canvasDims");
    var squareCameraMatrixLocation = gl.getUniformLocation(squaresProgram, "u_cameraMatrix");
    var squareCanvasDimsLocation = gl.getUniformLocation(squaresProgram, "u_canvasDims");
    var squareTextureLocation = gl.getUniformLocation(squaresProgram, "u_texture");
    var circleTextureLocation = gl.getUniformLocation(circlesProgram, "u_texture");

    var dimsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dimsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, [0, 0, 0], gl.STATIC_DRAW);

    var textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, [0, 0, 0], gl.STATIC_DRAW);

    var instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, [0, 0, 0], gl.STATIC_DRAW);
    // Create a buffer.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var positions = [
        -.5, -.5,
        -.5, .5,
        .5, -.5,
        .5, -.5,
        -.5, .5,
        .5, .5
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for texture coords
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Put texcoords in the buffer
    var texcoords = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    // creates a texture info { width: w, height: h, texture: tex }
    // The texture will start with 1x1 pixels and be updated
    // when the image has loaded
    function loadImageAndCreateTextureInfo(url) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        var textureInfo = {
            width: 1,   // we don't know the size until it loads
            height: 1,
            texture: tex,
        };
        var img = new Image();
        img.addEventListener('load', function() {
            textureInfo.width = img.width;
            textureInfo.height = img.height;

            gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
        });
        img.src = url;

        return textureInfo;
    };

    texture = loadImageAndCreateTextureInfo('./img/spritesheet.png');

    setUpCamera = function(pov) {
        var ortho = m4.orthographic(0, canvasSpace.width, canvasSpace.height, 0, -1, 1);
        gl.useProgram(squaresProgram);
        gl.uniformMatrix4fv(squareCameraMatrixLocation, false, ortho);
        gl.uniform2f(squareCanvasDimsLocation, canvasSpace.width / 2 - pov.x, canvasSpace.height / 2 - pov.y);
        gl.useProgram(circlesProgram);
        gl.uniformMatrix4fv(circleCameraMatrixLocation, false, ortho);
        gl.uniform2f(circleCanvasDimsLocation, canvasSpace.width / 2 - pov.x, canvasSpace.height / 2 - pov.y);
    };

    drawSquares = function(instances, dims, textures) {

        gl.useProgram(squaresProgram);

        var instanceCount = instances.length / 3;
        instances = new Float32Array(instances);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances, gl.DYNAMIC_DRAW, 0, instances.length);
        gl.enableVertexAttribArray(squareInstanceLocation);
        gl.vertexAttribPointer(squareInstanceLocation, 3, gl.FLOAT, false, 12, 0);
        ext.vertexAttribDivisorANGLE(squareInstanceLocation, 1); 

        dims = new Float32Array(dims);
        gl.bindBuffer(gl.ARRAY_BUFFER, dimsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dims, gl.DYNAMIC_DRAW, 0, dims.length);
        gl.enableVertexAttribArray(squareDimsLocation);
        gl.vertexAttribPointer(squareDimsLocation, 2, gl.FLOAT, false, 8, 0);
        ext.vertexAttribDivisorANGLE(squareDimsLocation, 1); 

        textures = new Float32Array(textures);
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textures, gl.DYNAMIC_DRAW, 0, textures.length);
        gl.enableVertexAttribArray(squareTexturesLocation);
        gl.vertexAttribPointer(squareTexturesLocation, 4, gl.FLOAT, false, 16, 0);
        ext.vertexAttribDivisorANGLE(squareTexturesLocation, 1); 

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(squarePositionLocation);
        gl.vertexAttribPointer(squarePositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.enableVertexAttribArray(squareTexcoordLocation);
        gl.vertexAttribPointer(squareTexcoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1i(squareTextureLocation, 0);

        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, instanceCount);

    };

    drawCircles = function(instances, textures) {

        gl.useProgram(circlesProgram);

        var instanceCount = instances.length / 4;
        instances = new Float32Array(instances);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances, gl.DYNAMIC_DRAW, 0, instances.length);
        gl.enableVertexAttribArray(circleInstanceLocation);
        gl.vertexAttribPointer(circleInstanceLocation, 4, gl.FLOAT, false, 16, 0);
        ext.vertexAttribDivisorANGLE(circleInstanceLocation, 1); 

        textures = new Float32Array(textures);
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textures, gl.DYNAMIC_DRAW, 0, textures.length);
        gl.enableVertexAttribArray(circleTexturesLocation);
        gl.vertexAttribPointer(circleTexturesLocation, 4, gl.FLOAT, false, 16, 0);
        ext.vertexAttribDivisorANGLE(circleTexturesLocation, 1); 

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(circlePositionLocation);
        gl.vertexAttribPointer(circlePositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.enableVertexAttribArray(circleTexcoordLocation);
        gl.vertexAttribPointer(circleTexcoordLocation, 2, gl.FLOAT, false, 0, 0);


        gl.uniform1i(circleTextureLocation, 0);

        
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, instanceCount);

    };
};


module.exports = {
    drawCircles: function() {
        drawCircles.apply(null, arguments);
    },
    drawSquares: function() {
        drawSquares.apply(null, arguments);
    },
    setUpCamera: function(pov) {
        setUpCamera(pov);
    },
    isLoaded: function() {
        return isLoaded;
    },
    clear: function() {
        gl.viewport(0, 0, canvasSpace.width, canvasSpace.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
    },
    matrix: matrixStack,
    getTexture: function() {
        return texture;
    },
    canvasDimensions: {
        x: canvasSpace.width,
        y: canvasSpace.height
    }
};

},{"./get.js":9,"./matrixStack.js":20}],32:[function(require,module,exports){
var events = require('./events.js');
var level = {};
level.game = require('./level.js');
level.test = require('./test-level.js');
var Entities = require('./getEntities.js');
var circles = [];
var squares = [];
var points = [];
var xs = [];

var get = require('./get.js');

var world = [];
var newItems = [];
var universalDecorators = [];
var levelMetadata = {};

var api = {
    getObjByName: function(name) {
        return world.reduce(function(acc, item) { if (item.getObjName() === name) return item; }, null);
    },
    setLevelMetadata: function(newData) {
        for (var val in newData) {
            levelMetadata[val] = newData[val];
        }
        events.emit('updateLevelName');
    },
    getLevelMetadata: function() {
        return levelMetadata;
    },
    decorateAllItems: function(decorator) {
        world.forEach(function(item) { decorator(item); });
        universalDecorators.push(decorator);
    },
    unloadWorld: function() {
        world.forEach(function(item) {
            item.unload();
        });
        api.setLevelMetadata({
            id: null,
            name: null
        });
    },
    loadLevel: function(levelId, callback) {
        api.unloadWorld();
        get('./levels/' + levelId, function(data) {
            api.loadItems(JSON.parse(data.data));
            api.step();
            api.setLevelMetadata({
                name: data.name,
                id: data.id
            });
            if (callback) callback();
        });
        api.sortItems();
    },
    loadItems: function(items) {
        
        if (!Array.isArray(items)) {
            items = [items];
        }

        items = items.map(function(item) {
            var entity = item;
            if (!entity.type) entity = Entities[item.entity](item);
            entity.load();
            universalDecorators.forEach(function(decorator) {
                decorator(entity);
            });
            return entity;
        });
        newItems = newItems.concat(items);
        if (items.length > 1) return items;
        return items[0];
    },
    getItems: function() {
        return world.slice();
    },
    getItemById: function(id) {
        return world.filter(function(item) {
            if (item.id === id) return true;
        })[0];
    },
    getItemsByType: function(type) {
        return world.filter(function(item) {
            if (item.type === type) return true;
        });
    },
    deleteItem: function(id) {
        world = world.filter(function(item) { if (item.id !== id) return true; });
        events.emit('entityCount');
    },
    getXs: function() {
        return xs;
    },
    updateNewItems: function() {
        world = world.concat(newItems);
        api.sortItems();
        if (newItems.length) events.emit('entityCount');
        newItems = [];
    },
    step: function() {
        api.updateNewItems();
        xs = [];
        ys = [];
        newItems = [];
        circles = [];
        squares = [];
        points = [];
        world.forEach(function(item) { 
            if (item.geometry === 'circle' && item.visible) circles.push(item);
            if (item.geometry === 'square' && item.visible) squares.push(item);
            if (item.geometry === 'point' && item.visible) points.push(item);
            item.collisionData = {};
            item.step.call(item); 
            if (item.geometry && item.solid && !item.inContainer()) xs = xs.concat(item.AABB.xs);
        });
        api.sortItems();
        xs.sort(function(a, b) {
            return (a.val - b.val);
        });
    },
    sortItems: function() {
        world.sort(function(a, b) {
            return a.onTop;
        });
    },
    getGeometry: function(geometry) {
        if (geometry === 'circle') return circles;
        if (geometry === 'square') return squares;
        if (geometry === 'point') return points;
    },
    getAllItemsSortedByGeometry: function() {
        return [squares, circles, points];
    },
    getEntityTypes: function() {
        var entities = [];
        for (var entity in Entities) {
            entities.push(entity);
        };
        return entities;
    }
};

module.exports = api;

},{"./events.js":8,"./get.js":9,"./getEntities.js":10,"./level.js":14,"./test-level.js":26}],33:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIlBsYXllci5qcyIsIlpvbWJpZS5qcyIsImFyZWEuanMiLCJiYXNlRW50aXR5LmpzIiwiYnVsbGV0LmpzIiwiY2hhcmFjdGVyLmpzIiwiZG9vci5qcyIsImV2ZW50cy5qcyIsImdldC5qcyIsImdldEVudGl0aWVzLmpzIiwiZ2V0SWQuanMiLCJnbExhYi5qcyIsImd1bi5qcyIsImxldmVsLmpzIiwibWFrZUdlb21ldHJ5LmpzIiwibWFrZUludmVudG9yeS5qcyIsIm1ha2VTb2xpZC5qcyIsIm1ha2VTdGFydE9wdGlvbnMuanMiLCJtYWtlVmlzaWJsZS5qcyIsIm1hdHJpeFN0YWNrLmpzIiwicHJvamVjdGlsZS5qcyIsInJlbmRlcmVyLmpzIiwic3Bhd25lci5qcyIsInNwcml0ZXMuanMiLCJzcXVhcmUuanMiLCJ0ZXN0LWxldmVsLmpzIiwidGVzdC1vYmouanMiLCJ0ZXh0dXJlRGF0YS5qcyIsIndhbGwuanMiLCJ3ZWFwb24uanMiLCJ3ZWJnbC5qcyIsIndvcmxkLmpzIiwiLi4vLi4vLi4vLi4vLi4vdXNyL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBDaGFyYWN0ZXIgPSByZXF1aXJlKCcuL2NoYXJhY3Rlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgIHZhciBwbGF5ZXIgPSBDaGFyYWN0ZXIoe1xuICAgICAgICBwb3M6IG9wdGlvbnMucG9zLFxuICAgICAgICB0eXBlOiAncGxheWVyJyxcbiAgICAgICAgbW9kZTogJ3N0YW5kaW5nJyxcbiAgICAgICAgbW9kZXM6IHtcbiAgICAgICAgICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmVtaXQoJ2RpZScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YW5kaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9zZS55ID0gMDtcbiAgICAgICAgICAgICAgICBwbGF5ZXIudmVsb2NpdHkgPSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2Fsa2luZzogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG9vdGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnBvc2UueSA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHBsYXllci5jdXJyZW50V2VhcG9ucy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICAgICAgICAgICAgICB2YXIgY29vbERvd24gPSBwbGF5ZXIuY3VycmVudFdlYXBvbnNbcGxheWVyLndlaWxkaW5nXS5jb29sRG93bjtcbiAgICAgICAgICAgICAgICB2YXIgdGljayA9IGNvb2xEb3duIC0gMTtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuYWRkRWZmZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGxheWVyLmN1cnJlbnRNb2RlICE9PSAnc2hvb3RpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRpY2srKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpY2sgPiBjb29sRG93bikgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllci5jdXJyZW50V2VhcG9uc1twbGF5ZXIud2VpbGRpbmddLnVzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29sbGlkZTogZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIuYmFzZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3dlYXBvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmICghY29sbGlkZXIuaW5Db250YWluZXIoKSkgcGxheWVyLnRha2VJdGVtcyhjb2xsaWRlcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3pvbWJpZSc6XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5lbWl0KCdnYW1lT3ZlcicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZ2FtZW92ZXJycnJycicpO1xuICAgICAgICAgICAgICAgICAgICAvL3BsYXllci5oZWFsdGggLT0gMC40O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhcmVhJzogXG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9KTtcbiAgICBwbGF5ZXIubmV4dFdlYXBvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwbGF5ZXIud2VpbGRpbmcrKztcbiAgICAgICAgaWYgKHdlaWxkaW5nID09PSBwbGF5ZXIuY3VycmVudFdlYXBvbnMubGVuZ3RoKSB3ZWlsZGluZyA9IDA7XG4gICAgfTtcbiAgICBwbGF5ZXIud2VpbGRpbmcgPSAwO1xuICAgIHBsYXllci5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBsYXllci5jdXJyZW50V2VhcG9ucyA9IHBsYXllci5nZXRJbnZlbnRvcnlCeUJhc2UoJ3dlYXBvbicpO1xuICAgICAgICBwbGF5ZXIuY3VycmVudFdlYXBvbnMuZm9yRWFjaChmdW5jdGlvbih3ZWFwb24sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAod2VhcG9uLnNlbGVjdFdlYXBvbikgcGxheWVyLndlaWxkaW5nID0gaW5kZXg7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuXG4gICAgcmV0dXJuIHBsYXllcjtcbn07XG4iLCJ2YXIgQ2hhcmFjdGVyID0gcmVxdWlyZSgnLi9jaGFyYWN0ZXIuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICB2YXIgY3VycmVudEF0dHJhY3RvciA9IGZhbHNlO1xuICAgIHZhciBzcGVlZCA9IDEgKyBNYXRoLnJhbmRvbSgpICogMztcblxuICAgIHZhciB6b21iaWUgPSBDaGFyYWN0ZXIoe1xuICAgICAgICB0eXBlOiAnem9tYmllJyxcbiAgICAgICAgbW9kZTogJ3dhbmRlcmluZycsXG4gICAgICAgIHBvczogb3B0aW9ucy5wb3MsXG4gICAgICAgIG1vZGVzOiB7XG4gICAgICAgICAgICByZXdhbmRlcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgem9tYmllLmFkZE1vZGUoJ3dhbmRlcmluZycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdhbmRlcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnd2FuZGVyaW5nJyk7XG4gICAgICAgICAgICAgICAgLy9pZiAoTWF0aC5yYW5kb20oKSA8IDAuMDUpIHpvbWJpZS5hdWRpbyA9ICdncm93bCc7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVMZW5ndGggPSAxICsgcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDMgKiAxMDAwKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tU3BlZWQgPSBNYXRoLnJhbmRvbSgpICogMjtcbiAgICAgICAgICAgICAgICB6b21iaWUucG9zLnJvdCA9IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMjtcbiAgICAgICAgICAgICAgICB6b21iaWUucG9zZS55ID0gMTtcblxuICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoem9tYmllLmN1cnJlbnRNb2RlICE9PSAnd2FuZGVyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFRpbWUgKyB0aW1lTGVuZ3RoIDwgbm93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgncmV3YW5kZXJpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgem9tYmllLnB1c2goe3g6IE1hdGguY29zKHpvbWJpZS5wb3Mucm90KSAqIHJhbmRvbVNwZWVkLCB5OiBNYXRoLnNpbih6b21iaWUucG9zLnJvdCkgKiByYW5kb21TcGVlZH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZWFyY2hpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoYXNpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IHpvbWJpZS5sb29rQXRPYmooY3VycmVudEF0dHJhY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh6b21iaWUuY3VycmVudE1vZGUgIT09ICdjaGFzaW5nJyB8fCAhY3VycmVudEF0dHJhY3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHpvbWJpZS5wdXNoKHt4OiBNYXRoLmNvcyh0aGV0YSkgKiBzcGVlZCAvIDIsIHk6IE1hdGguc2luKHRoZXRhKSAqIHNwZWVkIC8gMn0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBydW5uaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiaXRpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YWdnZXJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgem9tYmllLnVubG9hZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb2xsaWRlOiBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYnVsbGV0JzpcbiAgICAgICAgICAgICAgICBjYXNlICdtZWVsZWUnOlxuICAgICAgICAgICAgICAgICAgICB6b21iaWUuaGVhbHRoIC09IGNvbGxpZGVyLnBvd2VyIC8gMTAwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgem9tYmllLnN0ZXAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJlbnRBdHRyYWN0b3IgPSB3b3JsZC5nZXRJdGVtc0J5VHlwZSgncGxheWVyJylbMF07XG4gICAgICAgIGlmIChjdXJyZW50QXR0cmFjdG9yKSB7XG4gICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnY2hhc2luZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgem9tYmllLmFkZE1vZGUoJ3dhbmRlcmluZycpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gem9tYmllO1xufTtcbiIsInZhciBnZXRJZCA9IHJlcXVpcmUoJy4vZ2V0SWQuanMnKS5nZXRJZDtcbnZhciBzcXVhcmUgPSByZXF1aXJlKCcuL3NxdWFyZS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBvYmpFdmVudHMgPSBbXTtcbiAgICB2YXIgYXJlYSA9IHNxdWFyZShvcHRpb25zKTtcbiAgICBhcmVhLm9uVG9wID0gdHJ1ZTtcbiAgICBhcmVhLnR5cGUgPSAnYXJlYSc7XG4gICAgYXJlYS5wbGF5ZXJNZXNzYWdlID0gJyc7XG4gICAgYXJlYS5hZGRPYmpFdmVudCA9IGZ1bmN0aW9uKHRyaWdnZXIsIHZlcmIsIG5vdW4pIHtcbiAgICAgICAgdmFyIGlkID0gZ2V0SWQoKTtcbiAgICAgICAgb2JqRXZlbnRzLnB1c2goe2lkOiBpZCwgdHJpZ2dlcjogdHJpZ2dlciwgdmVyYjogdmVyYiwgbm91bjogbm91bn0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcbiAgICBhcmVhLmRlbGV0ZU9iakV2ZW50ID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgb2JqRXZlbnRzID0gb2JqRXZlbnRzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IHJldHVybiAoaXRlbS5pZCAhPT0gaWQpOyB9KTtcbiAgICB9O1xuICAgIGFyZWEuZ2V0T2JqRXZlbnQgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICBpZiAoaWQpIHJldHVybiBvYmpFdmVudHMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKGl0ZW0uaWQgPSBpZCkgcmV0dXJuIHRydWU7IH0pWzBdO1xuICAgICAgICByZXR1cm4gb2JqRXZlbnRzO1xuICAgIH07XG4gICAgYXJlYS5jb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgb2JqRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0udHJpZ2dlciA9PT0gY29sbGlkZXIudHlwZSB8fCBpdGVtLnRyaWdnZXIgPT09IGNvbGxpZGVyLmJhc2UpIHtcbiAgICAgICAgICAgICAgICB3b3JsZC5nZXRPYmpCeU5hbWUoaXRlbS5ub3VuKS52ZXJic1tpdGVtLnZlcmJdKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXJlYTtcbn07XG4iLCJ2YXIgZ2V0SWQgPSByZXF1aXJlKCcuL2dldElkLmpzJykuZ2V0SWQ7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHVzaEV2ZW50cyA9IFtdO1xuICAgIHZhciBtb3ZlRXZlbnRzID0gW107XG4gICAgdmFyIGxvYWRFdmVudHMgPSBbXTtcbiAgICB2YXIgdW5sb2FkRXZlbnRzID0gW107XG4gICAgdmFyIHN0ZXBFdmVudHMgPSBbXTtcbiAgICB2YXIgbG9hZGVkID0gZmFsc2U7XG4gICAgdmFyIG9iak5hbWUgPSBmYWxzZTtcbiAgICB2YXIgbW92ZWQgPSBmYWxzZTtcbiAgICB2YXIgbmV3RWZmZWN0cyA9IFtdO1xuICAgIHZhciBlZmZlY3RzID0gW107XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgICAgaW5Db250YWluZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICghIW9iai5vd25lcik7XG4gICAgICAgIH0sXG4gICAgICAgIHNldE9iak5hbWU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIG9iak5hbWUgPSBuYW1lO1xuICAgICAgICB9LFxuICAgICAgICBnZXRPYmpOYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmpOYW1lO1xuICAgICAgICB9LFxuICAgICAgICBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24oZSkgeyBlKCk7IH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRFdmVudHMgPSBhcmdzLmNvbmNhdChsb2FkRXZlbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFsb2FkZWQpIHtcbiAgICAgICAgICAgICAgICBsb2FkRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZSkgeyBlKCk7IH0pO1xuICAgICAgICAgICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHJldHVybiB1bmxvYWRFdmVudHMgPSBhcmdzLmNvbmNhdCh1bmxvYWRFdmVudHMpO1xuICAgICAgICAgICAgdW5sb2FkRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZSkgeyBlKCk7IH0pO1xuICAgICAgICAgICAgd29ybGQuZGVsZXRlSXRlbShvYmouaWQpO1xuICAgICAgICAgICAgaWYgKG9iai5vd25lcikgb2JqLm93bmVyLmRyb3BJdGVtKG9iaik7XG4gICAgICAgIH0sXG4gICAgICAgIHN0ZXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPiAwKSByZXR1cm4gc3RlcEV2ZW50cyA9IGFyZ3MuY29uY2F0KHN0ZXBFdmVudHMpO1xuICAgICAgICAgICAgc3RlcEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHsgZSgpOyB9KTtcbiAgICAgICAgICAgIGVmZmVjdHMgPSBlZmZlY3RzLmNvbmNhdChuZXdFZmZlY3RzKTtcbiAgICAgICAgICAgIG5ld0VmZmVjdHMgPSBbXTtcbiAgICAgICAgICAgIGVmZmVjdHMgPSBlZmZlY3RzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmNhbGwob2JqKTsgfSk7XG4gICAgICAgICAgICBpZiAobW92ZWQpIG9iai5wcm9jZXNzTW92ZW1lbnRFdmVudHMoKTtcbiAgICAgICAgICAgIGlmIChvYmoucG9zLnJvdCA+IE1hdGguUEkgKiAyKSBvYmoucG9zLnJvdCAtPSBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIGlmIChvYmoucG9zLnJvdCA8IDApIG9iai5wb3Mucm90ICs9IE1hdGguUEkgKiAyO1xuXG4gICAgICAgIH0sXG4gICAgICAgIHByb2Nlc3NNb3ZlbWVudEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBvYmoudmVsb2NpdHkgPSBNYXRoLnNxcnQob2JqLnBvcy52ZWMueCAqIG9iai5wb3MudmVjLnggKyBvYmoucG9zLnZlYy55ICogb2JqLnBvcy52ZWMueSk7XG4gICAgICAgICAgICBpZiAob2JqLnZlbG9jaXR5ID4gMzApIHtcbiAgICAgICAgICAgICAgICAvL2RlYnVnZ2VyO1xuICAgICAgICAgICAgICAgIG9iai5wb3MudmVjLnggPSBvYmoucG9zLnZlYy54IC8gKG9iai52ZWxvY2l0eSAvIDMwKTtcbiAgICAgICAgICAgICAgICBvYmoucG9zLnZlYy55ID0gb2JqLnBvcy52ZWMueSAvIChvYmoudmVsb2NpdHkgLyAzMCk7XG4gICAgICAgICAgICAgICAgb2JqLnZlbG9jaXR5ID0gMzA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmoucG9zLnggKz0gb2JqLnBvcy52ZWMueDtcbiAgICAgICAgICAgIG9iai5wb3MueSArPSBvYmoucG9zLnZlYy55O1xuICAgICAgICAgICAgaWYgKG9iai5vd25lcikge1xuICAgICAgICAgICAgICAgIG9iai5tb3ZlKG9iai5vd25lci5wb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqLnBvcy52ZWMueCA9IDA7XG4gICAgICAgICAgICBvYmoucG9zLnZlYy55ID0gMDtcbiAgICAgICAgICAgIG1vdmVFdmVudHMuZm9yRWFjaChmdW5jdGlvbihmbikgeyBmbigpOyB9KTtcbiAgICAgICAgICAgIG1vdmVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGlkOiBnZXRJZCgpLFxuICAgICAgICBwb3M6IHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgcm90OiAwLFxuICAgICAgICAgICAgdmVjOiB7XG4gICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICB5OiAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vdmU6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICAgICAgaWYgKHBvcy5ldikge1xuICAgICAgICAgICAgICAgIG1vdmVFdmVudHMucHVzaChwb3MuZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBvcy54KSBvYmoucG9zLnggPSBwb3MueDtcbiAgICAgICAgICAgIGlmIChwb3MueSkgb2JqLnBvcy55ID0gcG9zLnk7XG4gICAgICAgICAgICBpZiAocG9zLnJvdCkgb2JqLnBvcy5yb3QgPSBwb3Mucm90O1xuICAgICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBwdXNoOiBmdW5jdGlvbih2ZWMpIHtcbiAgICAgICAgICAgIGlmICh2ZWMuZXYpIHtcbiAgICAgICAgICAgICAgICBtb3ZlRXZlbnRzLnB1c2godmVjLmV2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2ZWMueCkgb2JqLnBvcy52ZWMueCArPSB2ZWMueDtcbiAgICAgICAgICAgIGlmICh2ZWMueSkgb2JqLnBvcy52ZWMueSArPSB2ZWMueTtcbiAgICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkRWZmZWN0OiBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgbmV3RWZmZWN0cy5wdXNoKGZuKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHJldHVybiBvYmo7XG59O1xuXG4iLCJ2YXIgcHJvamVjdGlsZSA9IHJlcXVpcmUoJy4vcHJvamVjdGlsZS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG5cbnZhciBCdWxsZXQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICB2YXIgYnVsbGV0ID0gcHJvamVjdGlsZSgpO1xuXG4gICAgYnVsbGV0LmZpcmUgPSBmdW5jdGlvbihwb3MpIHtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gMDtcbiAgICAgICAgdmFyIHRoZXRhID0gcG9zLnJvdDtcbiAgICAgICAgYnVsbGV0LmluZXJ0aWEgPSB0cnVlO1xuICAgICAgICBidWxsZXQucG9zLnJvdCA9IHBvcy5yb3Q7XG4gICAgICAgIGJ1bGxldC5vblRvcCA9IHRydWU7XG4gICAgICAgIGJ1bGxldC52ZWxvY2l0eSA9IDI1O1xuICAgICAgICBtYWtlU29saWQoYnVsbGV0KTtcbiAgICAgICAgYnVsbGV0LnN0ZXAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoYnVsbGV0LmRpZSB8fCBkaXN0YW5jZSA+IGJ1bGxldC5yYW5nZSkgYnVsbGV0LnVubG9hZCgpO1xuICAgICAgICAgICAgZGlzdGFuY2UrKztcbiAgICAgICAgICAgIGJ1bGxldC5wdXNoKHt4OiBNYXRoLmNvcyh0aGV0YSkgKiBidWxsZXQudmVsb2NpdHksIHk6IE1hdGguc2luKHRoZXRhKSAqIGJ1bGxldC52ZWxvY2l0eX0pO1xuICAgICAgICB9KTtcbiAgICAgICAgYnVsbGV0LnJhZGl1cyA9IDE7XG4gICAgICAgIGJ1bGxldC5jb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpe1xuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnem9tYmllJzpcbiAgICAgICAgICAgICAgICAgICAgYnVsbGV0LnVubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIuYmFzZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NxdWFyZSc6XG4gICAgICAgICAgICAgICAgICAgIGJ1bGxldC51bmxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnVsbGV0Lm1vdmUoe3g6IHBvcy54ICsgTWF0aC5jb3ModGhldGEpICogNzUsIHk6IHBvcy55ICsgTWF0aC5zaW4odGhldGEpICogNzV9KTtcbiAgICB9O1xuXG4gICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgYnVsbGV0W2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgfVxuXG4gICAgYnVsbGV0LnR5cGUgPSAnYnVsbGV0JztcbiAgICByZXR1cm4gYnVsbGV0O1xufTtcblxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBCdWxsZXQ7XG4iLCJ2YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VWaXNpYmxlID0gcmVxdWlyZSgnLi9tYWtlVmlzaWJsZS5qcycpO1xudmFyIG1ha2VJbnZlbnRvcnkgPSByZXF1aXJlKCcuL21ha2VJbnZlbnRvcnkuanMnKTtcbnZhciBtYWtlU29saWQgPSByZXF1aXJlKCcuL21ha2VTb2xpZC5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBjaGFyYWN0ZXIgPSBiYXNlRW50aXR5KCk7XG4gICAgdmFyIGFuaVRpY2sgPSAwO1xuICAgIG1ha2VJbnZlbnRvcnkoY2hhcmFjdGVyKTtcbiAgICBtYWtlR2VvbWV0cnkoY2hhcmFjdGVyLCAnY2lyY2xlJyk7XG4gICAgbWFrZVNvbGlkKGNoYXJhY3Rlcik7XG4gICAgbWFrZVZpc2libGUoY2hhcmFjdGVyKTtcbiAgICBjaGFyYWN0ZXIucmFkaXVzID0gNTA7XG4gICAgY2hhcmFjdGVyLnNvbGlkID0gdHJ1ZTtcbiAgICBjaGFyYWN0ZXIub25Ub3AgPSB0cnVlO1xuICAgIGNoYXJhY3Rlci5nZW9tZXRyeSA9ICdjaXJjbGUnO1xuICAgIGNoYXJhY3Rlci5sb29rQXRWZWMgPSBmdW5jdGlvbih2ZWMpIHtcbiAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMih2ZWMueSwgdmVjLngpO1xuICAgICAgICBjaGFyYWN0ZXIucG9zLnJvdCA9IHRoZXRhICsgTWF0aC5QSTtcbiAgICAgICAgcmV0dXJuIHRoZXRhO1xuICAgIH07XG4gICAgY2hhcmFjdGVyLmxvb2tBdE9iaiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKG9iai5wb3MueSAtIGNoYXJhY3Rlci5wb3MueSwgb2JqLnBvcy54IC0gY2hhcmFjdGVyLnBvcy54KTtcbiAgICAgICAgY2hhcmFjdGVyLnBvcy5yb3QgPSB0aGV0YTtcbiAgICAgICAgcmV0dXJuIHRoZXRhO1xuICAgIH07XG4gICAgY2hhcmFjdGVyLmJhc2UgPSAnY2hhcmFjdGVyJztcbiAgICBjaGFyYWN0ZXIuaGVhbHRoID0gMTtcbiAgICBjaGFyYWN0ZXIuc3RlcChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGNoYXJhY3Rlci5oZWFsdGggPD0gMCkgY2hhcmFjdGVyLmFkZE1vZGUoJ2RpZScpO1xuICAgICAgICBhbmlUaWNrKys7XG4gICAgICAgIGlmICghY2hhcmFjdGVyLnZlbG9jaXR5KSB7XG4gICAgICAgICAgICBjaGFyYWN0ZXIucG9zZS54ID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChhbmlUaWNrID4gMTYgLSBjaGFyYWN0ZXIudmVsb2NpdHkpIHtcbiAgICAgICAgICAgICAgICBhbmlUaWNrID0gMDtcbiAgICAgICAgICAgICAgICBpZiAoY2hhcmFjdGVyLnBvc2UueCA8IGNoYXJhY3Rlci50ZXh0dXJlRGF0YS5wb3Nlcy5zbGlkZXNbY2hhcmFjdGVyLnBvc2UueV0gLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3Rlci5wb3NlLngrKztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXIucG9zZS54ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuaVRpY2srKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNoYXJhY3Rlci5tb2RlcyA9IG9wdGlvbnMubW9kZXM7XG4gICAgY2hhcmFjdGVyLmNvbGxpZGUgPSBvcHRpb25zLmNvbGxpZGU7XG4gICAgY2hhcmFjdGVyLnR5cGUgPSBvcHRpb25zLnR5cGU7XG4gICAgY2hhcmFjdGVyLmFkZE1vZGUgPSBmdW5jdGlvbihtb2RlKSB7XG4gICAgICAgIGlmIChjaGFyYWN0ZXIuY3VycmVudE1vZGUgPT09IG1vZGUpIHJldHVybjtcbiAgICAgICAgY2hhcmFjdGVyLmN1cnJlbnRNb2RlID0gbW9kZTtcbiAgICAgICAgY2hhcmFjdGVyLm1vZGVzW21vZGVdKCk7XG4gICAgfTtcbiAgICBjaGFyYWN0ZXIucG9zZSA9IHt4OiAwLCB5OiAwfTtcbiAgICBjaGFyYWN0ZXIubG9hZChmdW5jdGlvbigpIHsgY2hhcmFjdGVyLmFkZE1vZGUob3B0aW9ucy5tb2RlKTsgfSk7XG4gICAgY2hhcmFjdGVyLm1vdmUob3B0aW9ucy5wb3MpO1xuICAgIHJldHVybiBjaGFyYWN0ZXI7XG59O1xuXG4iLCJ2YXIgd2FsbCA9IHJlcXVpcmUoJy4vd2FsbC5qcycpO1xudmFyIG1ha2VTdGFydE9wdGlvbnMgPSByZXF1aXJlKCcuL21ha2VTdGFydE9wdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGRvb3IgPSB3YWxsKG9wdGlvbnMpO1xuICAgIG1ha2VTdGFydE9wdGlvbnMoZG9vcik7XG4gICAgZG9vci5zdGFydE9wdGlvbnMoe3NwZWVkOiBvcHRpb25zLnNwZWVkfSk7XG4gICAgZG9vci50eXBlID0gJ2Rvb3InO1xuICAgIGRvb3Iub3BlblBvcyA9IG9wdGlvbnMub3BlblBvcyB8fCBvcHRpb25zLnBvcztcbiAgICBkb29yLmNsb3NlUG9zID0gb3B0aW9ucy5jbG9zZVBvcyB8fCBvcHRpb25zLnBvcztcbiAgICBkb29yLm9wZW5lZCA9IG9wdGlvbnMub3BlbmVkIHx8IHRydWU7XG5cbiAgICB2YXIgcHJvZ3Jlc3MgPSAoZG9vci5vcGVuZWQpID8gMSA6IDA7XG4gICAgdmFyIHN0YXJ0VGltZTtcbiAgICB2YXIgdXBkYXRlUG9zID0gZnVuY3Rpb24odG9nZ2xlKSB7XG4gICAgICAgIGlmICh0b2dnbGUpIHByb2dyZXNzID0gKGRvb3Iub3BlbmVkKSA/IDEgOiAwO1xuICAgICAgICBkb29yLm1vdmUoe1xuICAgICAgICAgICAgeDogZG9vci5vcGVuUG9zLnggKyAoZG9vci5jbG9zZVBvcy54IC0gZG9vci5vcGVuUG9zLngpICogcHJvZ3Jlc3MsXG4gICAgICAgICAgICB5OiBkb29yLm9wZW5Qb3MueSArIChkb29yLmNsb3NlUG9zLnkgLSBkb29yLm9wZW5Qb3MueSkgKiBwcm9ncmVzcyxcbiAgICAgICAgICAgIHJvdDogZG9vci5vcGVuUG9zLnJvdCArIChkb29yLmNsb3NlUG9zLnJvdCAtIGRvb3Iub3BlblBvcy5yb3QpICogcHJvZ3Jlc3NcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGRvb3IudXBkYXRlUG9zID0gdXBkYXRlUG9zO1xuXG4gICAgdXBkYXRlUG9zKCk7XG5cbiAgICBpZiAoIWRvb3IudmVyYnMpIGRvb3IudmVyYnMgPSB7fTtcbiAgICBkb29yLnZlcmJzLm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGRvb3Iub3BlbmVkKSB7XG4gICAgICAgICAgICBkb29yLm9wZW5lZCA9IGZhbHNlO1xuICAgICAgICAgICAgZG9vci5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MgLT0gb3B0aW9ucy5zcGVlZDtcbiAgICAgICAgICAgICAgICBpZiAocHJvZ3Jlc3MgPCAwKSBwcm9ncmVzcyA9IDA7XG4gICAgICAgICAgICAgICAgdXBkYXRlUG9zKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChwcm9ncmVzcyAmJiAhZG9vci5vcGVuZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb29yLm9wZW5lZCA9IHRydWU7XG4gICAgICAgICAgICBkb29yLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzcyArPSBvcHRpb25zLnNwZWVkO1xuICAgICAgICAgICAgICAgIGlmIChwcm9ncmVzcyA+IDEpIHByb2dyZXNzID0gMTtcbiAgICAgICAgICAgICAgICB1cGRhdGVQb3MoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHByb2dyZXNzIC0gMSAmJiBkb29yLm9wZW5lZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZG9vcjtcbn07XG5cbiIsInZhciBldmVudHMgPSB7fTtcblxudmFyIGFwaSA9IHtcbiAgICBlbWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGZvciAodmFyIGlkIGluIGV2ZW50cykge1xuICAgICAgICAgICAgaWYgKGV2ZW50c1tpZF0uZSA9PT0gZSkgZXZlbnRzW2lkXS5mKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihlLCBmLCBpZCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdyZWdpc3RlcmluZyBldmVudCAnICsgZSwgZiwgaWQpO1xuICAgICAgICBldmVudHNbaWRdID0ge1xuICAgICAgICAgICAgZjogZixcbiAgICAgICAgICAgIGU6IGVcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHVucmVnaXN0ZXI6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGRlbGV0ZSBldmVudHNbaWRdO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuXG52YXIgYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGFwaS5lbWl0KCdhbmltYXRlJyk7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbn07XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIGFuaW1hdGUoKTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIGh0dHAub3BlbignR0VUJywgdXJsLCB0cnVlKTtcblxuICAgIC8vU2VuZCB0aGUgcHJvcGVyIGhlYWRlciBpbmZvcm1hdGlvbiBhbG9uZyB3aXRoIHRoZSByZXF1ZXN0XG4gICAgaHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XG5cbiAgICBodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YTtcbiAgICAgICAgaWYoKGh0dHAucmVhZHlTdGF0ZSA9PT0gNCkgJiYgaHR0cC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgaWYgKC9eW1xcXSw6e31cXHNdKiQvLnRlc3QoaHR0cC5yZXNwb25zZVRleHQucmVwbGFjZSgvXFxcXFtcIlxcXFxcXC9iZm5ydHVdL2csICdAJykucmVwbGFjZSgvXCJbXlwiXFxcXFxcblxccl0qXCJ8dHJ1ZXxmYWxzZXxudWxsfC0/XFxkKyg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/L2csICddJykucmVwbGFjZSgvKD86Xnw6fCwpKD86XFxzKlxcWykrL2csICcnKSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShodHRwLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBodHRwLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGh0dHAuc2VuZCgpO1xuXG59O1xuXG4iLCJ2YXIgRW50aXRpZXMgPSB7fTtcblxuRW50aXRpZXNbJ3BsYXllciddID0gcmVxdWlyZSgnLi9QbGF5ZXIuanMnKTtcbkVudGl0aWVzWyd0ZXN0J10gPSByZXF1aXJlKCcuL3Rlc3Qtb2JqLmpzJyk7XG5FbnRpdGllc1snZ3VuJ10gPSByZXF1aXJlKCcuL2d1bi5qcycpO1xuRW50aXRpZXNbJ3RpbGUnXSA9IHJlcXVpcmUoJy4vc3F1YXJlLmpzJyk7XG5FbnRpdGllc1snem9tYmllU3Bhd25lciddID0gcmVxdWlyZSgnLi9zcGF3bmVyLmpzJyk7XG5FbnRpdGllc1snem9tYmllJ10gPSByZXF1aXJlKCcuL1pvbWJpZS5qcycpO1xuRW50aXRpZXNbJ3dhbGwnXSA9IHJlcXVpcmUoJy4vd2FsbC5qcycpO1xuRW50aXRpZXNbJ2Rvb3InXSA9IHJlcXVpcmUoJy4vZG9vci5qcycpO1xuRW50aXRpZXNbJ2FyZWEnXSA9IHJlcXVpcmUoJy4vYXJlYS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0aWVzO1xuIiwidmFyIGxhc3RJZCA9IDA7XG5cbnZhciBhcGkgPSB7XG4gICAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2EnICsgbGFzdElkKys7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbndpbmRvdy53b3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcbndpbmRvdy5yZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXIuanMnKTtcblxud29ybGQubG9hZEl0ZW1zKEpTT04ucGFyc2UoICdbJytcbiAgICAgICAgICAgICd7XCJlbnRpdHlcIjpcInpvbWJpZVwiLFwicG9zXCI6e1wieFwiOjE1MDAsXCJ5XCI6MTUwMCxcInJvdFwiOjAuMDI4MzMzNjY1NDUyNTg4fSxcInJhZGl1c1wiOjUwfSwnK1xuICAgICAgICAgICAgJ3tcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjIxMDAsXCJ5XCI6MjEwMCxcInJvdFwiOjEuMDI4MzMzNjY1NDUyNTg4fSxcIndpZHRoXCI6MjUwLFwiaGVpZ2h0XCI6MTUwfSwnK1xuICAgICAgICAgICAgJ3tcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjEzMDAsXCJ5XCI6MjEwMCxcInJvdFwiOjEuMDI4MzMzNjY1NDUyNTg4fSxcIndpZHRoXCI6MjUwLFwiaGVpZ2h0XCI6MzUwfSwnK1xuICAgICAgICAgICAgJ3tcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjE3MDAsXCJ5XCI6MjEwMCxcInJvdFwiOjEuMDI4MzMzNjY1NDUyNTg4fSxcIndpZHRoXCI6MjUwLFwiaGVpZ2h0XCI6MjUwfSwnK1xuICAgICAgICAgICAgJ3tcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjIxMDAsXCJ5XCI6MTY2MCxcInJvdFwiOjEuMDI4MzMzNjY1NDUyNTg4fSxcIndpZHRoXCI6NTUwLFwiaGVpZ2h0XCI6MTUwfSwnK1xuICAgICAgICAgICAgJ3tcImVudGl0eVwiOlwiem9tYmllXCIsXCJwb3NcIjp7XCJ4XCI6MjE3MCxcInlcIjoyMTcwLFwicm90XCI6MC4wMjgzMzM2NjU0NTI1ODh9LFwicmFkaXVzXCI6NTB9LCcrXG4gICAgICAgICAgICAne1wiZW50aXR5XCI6XCJ6b21iaWVcIixcInBvc1wiOntcInhcIjoxNTAwLFwieVwiOjE1MDAsXCJyb3RcIjowLjAyODMzMzY2NTQ1MjU4OH0sXCJyYWRpdXNcIjo1MH0sJytcbiAgICAgICAgICAgICd7XCJlbnRpdHlcIjpcInpvbWJpZVwiLFwicG9zXCI6e1wieFwiOjI0MDEsXCJ5XCI6MjQwMSxcInJvdFwiOjAuNzQ5NjMyODUwOTg4NjE5fSxcInJhZGl1c1wiOjI1MH1dJyApKTtcbiAgICAgICAgICAgIFxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgIHdvcmxkLnN0ZXAoKTtcbiAgICByZW5kZXJlci5jb25uZWN0Q2FtZXJhKHdvcmxkLmdldEl0ZW1zKClbMF0pO1xuXG4gICAgZXZlbnRzLnJlZ2lzdGVyKCdhbmltYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHdvcmxkLmdldEl0ZW1zKCkuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLm1vdmUoe3JvdDogaXRlbS5wb3Mucm90ICsgLjA1fSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZW5kZXJlci5zdGVwKCk7XG4gICAgfSwgJ21haW5FdmVudExvb3AnKTtcbn0pO1xuXG4iLCJ2YXIgd2VhcG9uID0gcmVxdWlyZSgnLi93ZWFwb24uanMnKTtcbi8vdmFyIHdvcmxkID0gcmVxdWlyZSgnLi93b3JsZC5qcycpO1xudmFyIEJ1bGxldCA9IHJlcXVpcmUoJy4vYnVsbGV0LmpzJyk7XG52YXIgbWFrZUludmVudG9yeSA9IHJlcXVpcmUoJy4vbWFrZUludmVudG9yeS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgZ3VuID0gd2VhcG9uKCk7XG4gICAgdmFyIGJ1bGxldDtcbiAgICBpZiAob3B0aW9ucy5wb3MpIGd1bi5tb3ZlKG9wdGlvbnMucG9zKTtcbiAgICBndW4udXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBidWxsZXQgPSBndW4uZ2V0SW52ZW50b3J5KClbMF07XG4gICAgICAgIGlmICghYnVsbGV0KSB7XG4gICAgICAgICAgICBidWxsZXQgPSBCdWxsZXQoe3ZlbG9jaXR5OiAxMCwgcG93ZXI6IDEwLCByYW5nZTogNTAwfSk7XG4gICAgICAgICAgICBndW4udGFrZUl0ZW1zKGJ1bGxldCk7XG4gICAgICAgICAgICB3b3JsZC5sb2FkSXRlbXMoYnVsbGV0KTtcbiAgICAgICAgfVxuICAgICAgICBndW4uZHJvcEl0ZW0oYnVsbGV0KTtcbiAgICAgICAgYnVsbGV0LmZpcmUoZ3VuLm93bmVyLnBvcyk7XG4gICAgfTtcblxuICAgIGd1bi50eXBlID0gJ2d1bic7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuc3RhcnRBbW1vOyBpKyspIHtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3VuO1xufTtcblxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xue1wiZW50aXR5XCI6IFwidGlsZVwiLFxuICAgIFwicG9zXCI6IHtcbiAgICAgICAgXCJ4XCI6OTkzMCxcbiAgICAgICAgXCJ5XCI6MTAxNTYsXG4gICAgICAgIFwicm90XCI6MC43OFxuICAgIH0sXG4gICAgXCJ3aWR0aFwiOlwiNTAwMFwiLFxuICAgIFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LFxue1wiZW50aXR5XCI6XCJwbGF5ZXJcIixcbiAgICBcInBvc1wiOiB7XCJ4XCI6MTAwMjMuMDI4ODY4OTk2MDg1LFwieVwiOjk5ODAuNzczMTY0Nzc1MjEzLFwicm90XCI6MH0sXCJyYWRpdXNcIjo1MH0sXG57XCJlbnRpdHlcIjpcImd1blwiLFxuICAgIFwicG9zXCI6IHtcInhcIjoxMDAyMy4wMjg4Njg5OTYwODUsXCJ5XCI6OTk4MC43NzMxNjQ3NzUyMTMsXCJyb3RcIjowfX0sXG57XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDQ0OCxcInlcIjoxMDc3MyxcInJvdFwiOjAuNzh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCIxMjAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjk1OTksXCJ5XCI6OTc5OSxcInJvdFwiOjAuNzh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCIxMjAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjgxMzMsXCJ5XCI6ODQ0NSxcInJvdFwiOjAuNzh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjEwNjgxLFwieVwiOjk3NzcsXCJyb3RcIjoyLjM0fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiMTIwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDkyNCxcInlcIjo4NTE0LFwicm90XCI6MS41OH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjgwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDAwMyxcInlcIjo4NjA4LFwicm90XCI6My4xNH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjE2MDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTE2NDIsXCJ5XCI6ODQxMyxcInJvdFwiOjIuMzR9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjExNjk1LFwieVwiOjExODc3LFwicm90XCI6MC43OH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjUwMDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6ODE4MyxcInlcIjoxMTkyMSxcInJvdFwiOjIuMzR9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjEwMjY3LFwieVwiOjg3OTAsXCJyb3RcIjozLjE0fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiMTIwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDM1MSxcInlcIjo3ODYxLFwicm90XCI6MS41OH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjgwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMTAyNCxcInlcIjo5MDU1LFwicm90XCI6MC4zfSxcIndpZHRoXCI6XCI0MDBcIixcImhlaWdodFwiOlwiMjUwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjExODk4LFwieVwiOjk0OTAsXCJyb3RcIjowLjZ9LFwid2lkdGhcIjpcIjkwMFwiLFwiaGVpZ2h0XCI6XCIxMDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTE2MTksXCJ5XCI6OTg5NSxcInJvdFwiOjAuNn0sXCJ3aWR0aFwiOlwiOTAwXCIsXCJoZWlnaHRcIjpcIjEwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjo5NTAwLFwieVwiOjExNzg2LFwicm90XCI6MH0sXCJ3aWR0aFwiOlwiODAwXCIsXCJoZWlnaHRcIjpcIjgwMFwifSxcbntcImVudGl0eVwiOlwiem9tYmllU3Bhd25lclwiLFwicG9zXCI6e1wieFwiOjc3NjksXCJ5XCI6OTQxMSxcInJvdFwiOjB9LFwicmFkaXVzXCI6MTAsIFwic3RhcnRcIjogdHJ1ZSwgXCJpbnRlcnZhbFwiOiAyMDAwMCwgXCJzcGF3bkNvdW50XCI6IDE1fSxcbntcImVudGl0eVwiOlwiem9tYmllU3Bhd25lclwiLFwicG9zXCI6e1wieFwiOjEyMzc5LFwieVwiOjk0NDksXCJyb3RcIjowfSxcInJhZGl1c1wiOjEwLCBcInN0YXJ0XCI6IGZhbHNlLCBcImludGVydmFsXCI6IDQ1MDAwLCBcInNwYXduQ291bnRcIjogMzV9LFxue1wiZW50aXR5XCI6XCJ6b21iaWVTcGF3bmVyXCIsXCJwb3NcIjp7XCJ4XCI6ODc2MCxcInlcIjoxMTk4MyxcInJvdFwiOjB9LFwicmFkaXVzXCI6MTAsIFwic3RhcnRcIjogdHJ1ZSwgXCJpbnRlcnZhbFwiOiAyMDAwMCwgXCJzcGF3bkNvdW50XCI6IDV9XG5cbl07XG5cblxuIiwidmFyIHBlcnBQb2ludCA9IGZ1bmN0aW9uKHZlcnRzLCBwKSB7XG4gICAgdmFyIG91dHB1dCA9IHZlcnRzLm1hcChmdW5jdGlvbih2MCwgaW5kZXgsIGFycmF5KSB7XG4gICAgICAgIHZhciB2MSA9IGFycmF5W2luZGV4ICsgMV07XG4gICAgICAgIGlmIChpbmRleCArIDEgPT09IGFycmF5Lmxlbmd0aCkgdjEgPSBhcnJheVswXTtcbiAgICAgICAgdmFyIGsgPSAoKHYxLnkgLSB2MC55KSAqIChwLnggLSB2MC54KSAtICh2MS54IC0gdjAueCkgKiAocC55IC0gdjAueSkpIC8gKE1hdGgucG93KHYxLnkgLSB2MC55LCAyKSArIE1hdGgucG93KHYxLnggLSB2MC54LCAyKSk7XG4gICAgICAgIHZhciBwZXJwUG9pbnQgPSB7eDogcC54IC0gayAqICh2MS55IC0gdjAueSksIHk6IHAueSArIGsgKiAodjEueCAtIHYwLngpfTtcbiAgICAgICAgdmFyIGRpcyA9IE1hdGguc3FydChNYXRoLnBvdyhwLnggLSBwZXJwUG9pbnQueCwgMikgKyBNYXRoLnBvdyhwLnkgLSBwZXJwUG9pbnQueSwgMikpO1xuICAgICAgICByZXR1cm4ge2RpczogZGlzLCBwZXJwUG9pbnQ6IHBlcnBQb2ludH07XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocGFzdCwgY3VycmVudCkgeyBcbiAgICAgICAgaWYgKCFwYXN0LmRpcykgcmV0dXJuIGN1cnJlbnQ7XG4gICAgICAgIGlmIChjdXJyZW50LmRpcyA8IHBhc3QuZGlzKSByZXR1cm4gY3VycmVudDtcbiAgICAgICAgcmV0dXJuIHBhc3Q7XG4gICAgfSkucGVycFBvaW50O1xufTtcblxuXG52YXIgcG9pbnRJblBvbHlnb24gPSBmdW5jdGlvbihzcXVhcmUsIGNpcmNsZSkge1xuICAgIHZhciBjID0gZmFsc2U7XG4gICAgdmFyIGksIGosIHgsIHksIHA7XG4gICAgdmFyIHZlcnRpY2VzID0gc3F1YXJlLnZlcnRzO1xuICAgIHZhciBwb2ludCA9IGNpcmNsZS5wb3M7XG5cbiAgICBqID0gdmVydGljZXMubGVuZ3RoIC0gMTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB2ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgIGlmICggKCh2ZXJ0aWNlc1tpXS55ID4gcG9pbnQueSkgIT09ICh2ZXJ0aWNlc1tqXS55ID4gcG9pbnQueSkpICYmXG4gICAgICAgIChwb2ludC54IDwgKHZlcnRpY2VzW2pdLnggLSB2ZXJ0aWNlc1tpXS54KSAqIChwb2ludC55IC0gdmVydGljZXNbaV0ueSkgLyAodmVydGljZXNbal0ueSAtIHZlcnRpY2VzW2ldLnkpICsgdmVydGljZXNbaV0ueCkgKSB7XG4gICAgICAgICAgICBjID0gIWM7XG4gICAgICAgIH1cblxuICAgICAgICBqID0gaTtcbiAgICB9XG5cbiAgICBpZiAoYykge1xuICAgICAgICBpZiAoc3F1YXJlLnNvbGlkICYmIGNpcmNsZS5zb2xpZCkge1xuICAgICAgICAgICAgcCA9IHBlcnBQb2ludCh2ZXJ0aWNlcywgcG9pbnQpO1xuICAgICAgICAgICAgLy94ID0gcC54IC0gY2lyY2xlLnBvcy54O1xuICAgICAgICAgICAgLy95IC49IHAueSAtIGNpcmNsZS5wb3MueTtcbiAgICAgICAgICAgIC8vY2lyY2xlLmFkZEVmZmVjdChmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICAgICAgY2lyY2xlLm1vdmUoe3g6IHAueCwgeTogcC55fSk7IFxuICAgICAgICAgICAgLy99KTtcbiAgICAgICAgICAgIGNpcmNsZS5jb2xsaWRlKHNxdWFyZSk7XG4gICAgICAgICAgICBzcXVhcmUuY29sbGlkZShjaXJjbGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn07XG5cbnZhciBsb25nUHVzaCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgdGhlbiA9IERhdGUubm93KCk7XG4gICAgdmFyIHggPSBNYXRoLmNvcyhiLnBvcy5yb3QpICogYi52ZWxvY2l0eTtcbiAgICB2YXIgeSA9IE1hdGguc2luKGIucG9zLnJvdCkgKiBiLnZlbG9jaXR5O1xuICAgIGEuYWRkRWZmZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWxhcHNlZFRpbWUgPSAoRGF0ZS5ub3coKSAtIHRoZW4pIC8gMTAwMDtcbiAgICAgICAgdmFyIHNjYWxlciA9IE1hdGgucG93KGVsYXBzZWRUaW1lIC0gMSwgMik7XG4gICAgICAgIGlmIChlbGFwc2VkVGltZSA+IDEpIHJldHVybiBmYWxzZTtcbiAgICAgICAgYS5wdXNoKHt4OiB4ICogc2NhbGVyLCB5OiB5ICogc2NhbGVyfSk7XG5cbiAgICB9KTtcbn07XG5cbnZhciBjaXJjbGVEZXRlY3QgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHgsIHksIGRpcywgcmFkaXVzLCBkZWx0YSwgdGhldGEsIGFEZWx0YSwgYkRlbHRhO1xuICAgIHggPSBhLnBvcy54IC0gYi5wb3MueDtcbiAgICB5ID0gYS5wb3MueSAtIGIucG9zLnk7XG4gICAgZGlzID0gTWF0aC5zcXJ0KE1hdGgucG93KHgsIDIpICsgTWF0aC5wb3coeSwgMikpO1xuICAgIHJhZGl1cyA9IHBhcnNlSW50KGEucmFkaXVzKSArIHBhcnNlSW50KGIucmFkaXVzKTtcblxuICAgIGlmIChkaXMgPCByYWRpdXMpIHtcbiAgICAgICAgaWYgKGEuc29saWQgJiYgYi5zb2xpZCkge1xuICAgICAgICAgICAgZGVsdGEgPSAocmFkaXVzIC0gZGlzKTtcbiAgICAgICAgICAgIHRoZXRhID0gTWF0aC5hdGFuMih5LCB4KTtcbiAgICAgICAgICAgIGEuYWRkRWZmZWN0KGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgICAgICBhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiAoTWF0aC5jb3ModGhldGEpICogZGVsdGEpLCBcbiAgICAgICAgICAgICAgICAgICAgeTogKE1hdGguc2luKHRoZXRhKSAqIGRlbHRhKVxuICAgICAgICAgICAgICAgIH0pOyBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGIuYWRkRWZmZWN0KGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgICAgICBiLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiAoTWF0aC5jb3ModGhldGEpICogLWRlbHRhKSwgIFxuICAgICAgICAgICAgICAgICAgICB5OiAoTWF0aC5zaW4odGhldGEpICogLWRlbHRhKVxuICAgICAgICAgICAgICAgIH0pOyBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChiLmluZXJ0aWEpIGxvbmdQdXNoKGEsIGIpO1xuICAgICAgICAgICAgaWYgKGEuaW5lcnRpYSkgbG9uZ1B1c2goYiwgYSk7XG4gICAgICAgICAgICBhLmNvbGxpZGUoYik7XG4gICAgICAgICAgICBiLmNvbGxpZGUoYSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufTtcblxudmFyIHNldEFBQkIgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgQUFCQiA9IHtcbiAgICAgICAgeHM6IFt7dHlwZTogJ2InLCB2YWw6IEluZmluaXR5LCBvYmo6IG9ian0sIHt0eXBlOiAnZScsIHZhbDogLUluZmluaXR5LCBvYmo6IG9ian1dLFxuICAgICAgICB5czogW3t0eXBlOiAnYicsIHZhbDogSW5maW5pdHksIG9iajogb2JqfSwge3R5cGU6ICdlJywgdmFsOiAtSW5maW5pdHksIG9iajogb2JqfV1cbiAgICB9O1xuXG4gICAgaWYgKG9iai5nZW9tZXRyeSA9PT0gJ2NpcmNsZScpIHtcbiAgICAgICAgQUFCQi54c1swXS52YWwgPSBvYmoucG9zLnggLSBvYmoucmFkaXVzO1xuICAgICAgICBBQUJCLnhzWzFdLnZhbCA9IG9iai5wb3MueCArIG9iai5yYWRpdXM7XG4gICAgICAgIEFBQkIueXNbMF0udmFsID0gb2JqLnBvcy55IC0gb2JqLnJhZGl1cztcbiAgICAgICAgQUFCQi55c1sxXS52YWwgPSBvYmoucG9zLnkgKyBvYmoucmFkaXVzO1xuICAgICAgICBvYmouQUFCQiA9IEFBQkI7XG4gICAgICAgIHJldHVybjtcbiAgICB9O1xuICAgIGlmIChvYmouZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSB7XG4gICAgICAgIG9iai5BQUJCID0gb2JqLnZlcnRzLnJlZHVjZShmdW5jdGlvbihhY2MsIHZlcnQpIHtcbiAgICAgICAgICAgIGlmICh2ZXJ0LnggPCBhY2MueHNbMF0udmFsKSBhY2MueHNbMF0udmFsID0gdmVydC54O1xuICAgICAgICAgICAgaWYgKHZlcnQueCA+IGFjYy54c1sxXS52YWwpIGFjYy54c1sxXS52YWwgPSB2ZXJ0Lng7XG4gICAgICAgICAgICBpZiAodmVydC55IDwgYWNjLnlzWzBdLnZhbCkgYWNjLnlzWzBdLnZhbCA9IHZlcnQueTtcbiAgICAgICAgICAgIGlmICh2ZXJ0LnkgPiBhY2MueXNbMV0udmFsKSBhY2MueXNbMV0udmFsID0gdmVydC55O1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSwgQUFCQik7XG4gICAgfVxufTtcblxudmFyIHNldFZlcnRzID0gZnVuY3Rpb24ob2JqKSB7XG5cbiAgICBvYmoucG9zLnggPSBwYXJzZUludChvYmoucG9zLngpO1xuICAgIG9iai5wb3MueSA9IHBhcnNlSW50KG9iai5wb3MueSk7XG5cbiAgICB2YXIgdmVydHMgPSBbXG4gICAgICAgIHt4OiBvYmoucG9zLnggLSBvYmoud2lkdGggLyAyLCB5OiBvYmoucG9zLnkgLSBvYmouaGVpZ2h0IC8gMn0sIFxuICAgICAgICB7eDogb2JqLnBvcy54ICsgb2JqLndpZHRoIC8gMiwgeTogb2JqLnBvcy55IC0gb2JqLmhlaWdodCAvIDJ9LCBcbiAgICAgICAge3g6IG9iai5wb3MueCArIG9iai53aWR0aCAvIDIsIHk6IG9iai5wb3MueSArIG9iai5oZWlnaHQgLyAyfSwgXG4gICAgICAgIHt4OiBvYmoucG9zLnggLSBvYmoud2lkdGggLyAyLCB5OiBvYmoucG9zLnkgKyBvYmouaGVpZ2h0IC8gMn0sIFxuICAgIF07XG5cbiAgICB2YXIgcm90ID0gb2JqLnBvcy5yb3Q7XG4gICAgdmFyIG94ID0gb2JqLnBvcy54O1xuICAgIHZhciBveSA9IG9iai5wb3MueTtcblxuICAgIG9iai52ZXJ0cyA9IHZlcnRzLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciB2eCA9IGl0ZW0ueDtcbiAgICAgICAgdmFyIHZ5ID0gaXRlbS55O1xuICAgICAgICBpdGVtLnggPSBNYXRoLmNvcyhyb3QpICogKHZ4IC0gb3gpIC0gTWF0aC5zaW4ocm90KSAqICh2eSAtIG95KSArIG94O1xuICAgICAgICBpdGVtLnkgPSBNYXRoLnNpbihyb3QpICogKHZ4IC0gb3gpICsgTWF0aC5jb3Mocm90KSAqICh2eSAtIG95KSArIG95O1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9KTtcblxuICAgIHNldEFBQkIob2JqKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCB0eXBlKSB7XG4gICAgb2JqLmdlb21ldHJ5ID0gdHlwZTtcbiAgICBpZiAodHlwZSA9PT0gJ2NpcmNsZScpIHtcbiAgICAgICAgb2JqLmRldGVjdENvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnY2lyY2xlJykgcmV0dXJuIGNpcmNsZURldGVjdChvYmosIGNvbGxpZGVyKTtcbiAgICAgICAgICAgIGlmIChjb2xsaWRlci5nZW9tZXRyeSA9PT0gJ3NxdWFyZScpIHJldHVybiBwb2ludEluUG9seWdvbihjb2xsaWRlciwgb2JqKTtcbiAgICAgICAgfTtcbiAgICAgICAgb2JqLm1vdmUoe2V2OiBzZXRBQUJCLmJpbmQobnVsbCwgb2JqKX0pO1xuICAgICAgICBzZXRBQUJCKG9iaik7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnc3F1YXJlJykge1xuICAgICAgICBvYmouZGV0ZWN0Q29sbGlkZSA9IGZ1bmN0aW9uKGNvbGxpZGVyKSB7XG4gICAgICAgICAgICBpZiAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdjaXJjbGUnKSByZXR1cm4gcG9pbnRJblBvbHlnb24ob2JqLCBjb2xsaWRlcik7XG4gICAgICAgIH07XG4gICAgICAgIG9iai53aWR0aCA9IDEwMDtcbiAgICAgICAgb2JqLmhlaWdodCA9IDEwMDtcbiAgICAgICAgb2JqLnNldERpbWVuc2lvbnMgPSBmdW5jdGlvbihkaW0pIHtcbiAgICAgICAgICAgIGlmIChkaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoZGltLndpZHRoKSBvYmoud2lkdGggPSBkaW0ud2lkdGg7XG4gICAgICAgICAgICAgICAgaWYgKGRpbS5oZWlnaHQpIG9iai5oZWlnaHQgPSBkaW0uaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHNldFZlcnRzKG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb2JqLm1vdmUoe2V2OiBzZXRWZXJ0cy5iaW5kKG51bGwsIG9iail9KTtcbiAgICAgICAgc2V0VmVydHMob2JqKTtcbiAgICB9XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaikge1xuXG4gICAgdmFyIGludmVudG9yeSA9IFtdO1xuICAgIG9iai50YWtlSXRlbXMgPSBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICBpZiAoIWl0ZW1zLmxlbmd0aCkgaXRlbXMgPSBbaXRlbXNdO1xuICAgICAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50T2JqID0gb2JqLmdldEludmVudG9yeUJ5VHlwZShpdGVtLnR5cGUpWzBdO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRPYmogJiYgY3VycmVudE9iai5jb25zb2xpZGF0ZUludmVudG9yeSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmoudGFrZUl0ZW1zKGl0ZW0uZ2V0SW52ZW50b3J5KCkpO1xuICAgICAgICAgICAgICAgIGl0ZW0udW5sb2FkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGludmVudG9yeS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIGl0ZW0ub3duZXIgPSBvYmo7XG4gICAgICAgICAgICAgICAgaXRlbS5sb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgb2JqLmRyb3BJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBpdGVtLm93bmVyID0gZmFsc2U7XG4gICAgICAgIGludmVudG9yeSA9IGludmVudG9yeS5maWx0ZXIoZnVuY3Rpb24obWF5YmVJdGVtKSB7IGlmIChtYXliZUl0ZW0uaWQgIT09IGl0ZW0uaWQpIHJldHVybiB0cnVlOyB9KTtcbiAgICB9O1xuICAgIG9iai5nZXRJbnZlbnRvcnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGludmVudG9yeS5zbGljZSgpO1xuICAgIH07XG4gICAgb2JqLmdldEludmVudG9yeUJ5VHlwZSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGludmVudG9yeS5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyBpZiAoaXRlbS50eXBlID09PSB0eXBlKSByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgfTtcbiAgICBvYmouZ2V0SW52ZW50b3J5QnlCYXNlID0gZnVuY3Rpb24oYmFzZSkge1xuICAgICAgICByZXR1cm4gaW52ZW50b3J5LmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IGlmIChpdGVtLmJhc2UgPT09IGJhc2UpIHJldHVybiB0cnVlOyB9KTtcbiAgICB9O1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIG9iai5zb2xpZCA9IHRydWU7XG59O1xuIiwiXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHN0YXJ0T3B0aW9ucyA9IHt9O1xuICAgIG9iai5zdGFydE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucykgcmV0dXJuIHN0YXJ0T3B0aW9ucztcbiAgICAgICAgZm9yICh2YXIgb3B0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHN0YXJ0T3B0aW9uc1tvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICB9XG4gICAgfTtcbn07XG4iLCJ2YXIgdGV4dHVyZURhdGEgPSByZXF1aXJlKCcuL3RleHR1cmVEYXRhLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZVZpc2libGUgKG9iaikge1xuICAgIG9iai5sb2FkKGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgb2JqLnRleHR1cmVEYXRhID0gdGV4dHVyZURhdGFbb2JqLmJhc2VdW29iai50eXBlXTsgXG4gICAgICAgIG9iai52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgb2JqLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChvYmouaW5Db250YWluZXIoKSkge1xuICAgICAgICAgICAgICAgIG9iai52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9iai52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG4iLCJmdW5jdGlvbiBNYXRyaXhTdGFjaygpIHtcbiAgICAgIHRoaXMuc3RhY2sgPSBbXTtcblxuICAgICAgLy9zaW5jZSB0aGUgc3RhY2sgaXMgZW1wdHkgdGhpcyB3aWxsIHB1dCBhbiBpbml0aWFsIG1hdHJpeCBpbiBpdFxuICAgICAgICAgIHRoaXMucmVzdG9yZSgpO1xufVxuXG4vLyBQb3BzIHRoZSB0b3Agb2YgdGhlIHN0YWNrIHJlc3RvcmluZyB0aGUgcHJldmlvdXNseSBzYXZlZCBtYXRyaXhcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5yZXN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGFjay5wb3AoKTtcbiAgICAvLyBOZXZlciBsZXQgdGhlIHN0YWNrIGJlIHRvdGFsbHkgZW1wdHlcbiAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPCAxKSB7XG4gICAgICAgIHRoaXMuc3RhY2tbMF0gPSBtNC5pZGVudGl0eSgpO1xuICAgIH1cbn07XG5cbi8vIFB1c2hlcyBhIGNvcHkgb2YgdGhlIGN1cnJlbnQgbWF0cml4IG9uIHRoZSBzdGFja1xuTWF0cml4U3RhY2sucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YWNrLnB1c2godGhpcy5nZXRDdXJyZW50TWF0cml4KCkpO1xufTtcblxuLy8gR2V0cyBhIGNvcHkgb2YgdGhlIGN1cnJlbnQgbWF0cml4ICh0b3Agb2YgdGhlIHN0YWNrKVxuTWF0cml4U3RhY2sucHJvdG90eXBlLmdldEN1cnJlbnRNYXRyaXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLnNsaWNlKCk7XG59O1xuXG4vLyBMZXRzIHVzIHNldCB0aGUgY3VycmVudCBtYXRyaXhcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5zZXRDdXJyZW50TWF0cml4ID0gZnVuY3Rpb24obSkge1xuICAgIHJldHVybiB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0gPSBtO1xufTtcblxuLy8gVHJhbnNsYXRlcyB0aGUgY3VycmVudCBtYXRyaXhcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgaWYgKHogPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB6ID0gMDtcbiAgICB9XG4gICAgdmFyIG0gPSB0aGlzLmdldEN1cnJlbnRNYXRyaXgoKTtcbiAgICB0aGlzLnNldEN1cnJlbnRNYXRyaXgobTQudHJhbnNsYXRlKG0sIHgsIHksIHopKTtcbn07XG5cbi8vIFJvdGF0ZXMgdGhlIGN1cnJlbnQgbWF0cml4IGFyb3VuZCBaXG5NYXRyaXhTdGFjay5wcm90b3R5cGUucm90YXRlWiA9IGZ1bmN0aW9uKGFuZ2xlSW5SYWRpYW5zKSB7XG4gICAgdmFyIG0gPSB0aGlzLmdldEN1cnJlbnRNYXRyaXgoKTtcbiAgICB0aGlzLnNldEN1cnJlbnRNYXRyaXgobTQuelJvdGF0ZShtLCBhbmdsZUluUmFkaWFucykpO1xufTtcblxuLy8gU2NhbGVzIHRoZSBjdXJyZW50IG1hdHJpeFxuTWF0cml4U3RhY2sucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgIGlmICh6ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgeiA9IDE7XG4gICAgfVxuICAgIHZhciBtID0gdGhpcy5nZXRDdXJyZW50TWF0cml4KCk7XG4gICAgdGhpcy5zZXRDdXJyZW50TWF0cml4KG00LnNjYWxlKG0sIHgsIHksIHopKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXhTdGFjaztcbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgbWFrZVZpc2libGUgPSByZXF1aXJlKCcuL21ha2VWaXNpYmxlLmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJvamVjdGlsZSA9IGJhc2VFbnRpdHkoKTtcbiAgICBtYWtlVmlzaWJsZShwcm9qZWN0aWxlKTtcbiAgICBtYWtlR2VvbWV0cnkocHJvamVjdGlsZSwgJ2NpcmNsZScpO1xuICAgIHByb2plY3RpbGUuYmFzZSA9ICdwcm9qZWN0aWxlJztcblxuICAgIHJldHVybiBwcm9qZWN0aWxlO1xufTtcblxuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIGdsID0gcmVxdWlyZSgnLi93ZWJnbC5qcycpO1xudmFyIFdvcmxkID0gcmVxdWlyZSgnLi93b3JsZC5qcycpO1xuLy92YXIgYXVkaW8gPSByZXF1aXJlKCcuL2F1ZGlvLmpzJyk7XG52YXIgY3VycmVudExldmVsO1xudmFyIHBvdjtcbnZhciBjYW52YXNEaW0gPSBnbC5jYW52YXNEaW1lbnNpb25zO1xuV29ybGQuY2FudmFzRGltID0gY2FudmFzRGltO1xuXG5cbnZhciBzdGVwID0gZnVuY3Rpb24oKSB7XG5cbiAgICBnbC5jbGVhcigpO1xuICAgIGdsLnNldFVwQ2FtZXJhKHBvdik7XG4gICAgdmFyIHRleHR1cmUgPSBnbC5nZXRUZXh0dXJlKCk7XG4gICAgdmFyIGluc3RhbmNlcyA9IFtdO1xuICAgIHZhciB0ZXh0dXJlcyA9IFtdO1xuICAgIHZhciBkaW1zID0gW107XG4gICAgV29ybGQuZ2V0R2VvbWV0cnkoJ3NxdWFyZScpLmZvckVhY2goZnVuY3Rpb24oaXRlbSwgaW5kZXgsIGFycmF5KSB7XG4gICAgICAgIGluc3RhbmNlcyA9IGluc3RhbmNlcy5jb25jYXQoW2l0ZW0ucG9zLngsIGl0ZW0ucG9zLnksIGl0ZW0ucG9zLnJvdF0pO1xuICAgICAgICB0ZXh0dXJlcyA9IHRleHR1cmVzLmNvbmNhdChbXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS54IC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUud2lkdGggOiAxKSwgXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS55IC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUuaGVpZ2h0IDogMSksIFxuICAgICAgICAgICAgICAgIGl0ZW0udGV4dHVyZURhdGEuZnJhbWUudyAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLndpZHRoIDogMSksIFxuICAgICAgICAgICAgICAgIGl0ZW0udGV4dHVyZURhdGEuZnJhbWUuaCAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLmhlaWdodCA6IDEpXG4gICAgICAgIF0pO1xuICAgICAgICBkaW1zID0gZGltcy5jb25jYXQoW2l0ZW0ud2lkdGgsIGl0ZW0uaGVpZ2h0XSk7XG4gICAgfSk7XG4gICAgZ2wuZHJhd1NxdWFyZXMoaW5zdGFuY2VzLCBkaW1zLCB0ZXh0dXJlcyk7XG4gICAgaW5zdGFuY2VzID0gW107XG4gICAgdGV4dHVyZXMgPSBbXTtcbiAgICBXb3JsZC5nZXRHZW9tZXRyeSgnY2lyY2xlJykuZm9yRWFjaChmdW5jdGlvbihpdGVtLCBpbmRleCwgYXJyYXkpIHtcbiAgICAgICAgaW5zdGFuY2VzID0gaW5zdGFuY2VzLmNvbmNhdChbaXRlbS5wb3MueCwgaXRlbS5wb3MueSwgaXRlbS5wb3Mucm90LCBpdGVtLnJhZGl1c10pO1xuICAgICAgICB0ZXh0dXJlcyA9IHRleHR1cmVzLmNvbmNhdChbXG4gICAgICAgICAgICAgICAgKGl0ZW0udGV4dHVyZURhdGEuZnJhbWUueCArICgoKGl0ZW0ucG9zZSkgPyBpdGVtLnBvc2UueCA6IDApIC8gKChpdGVtLnRleHR1cmVEYXRhLnBvc2VzKSA/IGl0ZW0udGV4dHVyZURhdGEucG9zZXMueCA6IDEpKSAqIGl0ZW0udGV4dHVyZURhdGEuZnJhbWUudykgLyAoKHRleHR1cmUpID8gdGV4dHVyZS53aWR0aCA6IDEpLCBcbiAgICAgICAgICAgICAgICAoaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS55ICsgKCgoaXRlbS5wb3NlKSA/IGl0ZW0ucG9zZS55IDogMCkgLyAoKGl0ZW0udGV4dHVyZURhdGEucG9zZXMpID8gaXRlbS50ZXh0dXJlRGF0YS5wb3Nlcy55IDogMSkpICogaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS5oKSAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLmhlaWdodCA6IDEpLCBcbiAgICAgICAgICAgICAgICAoaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS53IC8gKChpdGVtLnRleHR1cmVEYXRhLnBvc2VzKSA/IGl0ZW0udGV4dHVyZURhdGEucG9zZXMueCA6IDEpKSAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLndpZHRoIDogMSksIFxuICAgICAgICAgICAgICAgIChpdGVtLnRleHR1cmVEYXRhLmZyYW1lLmggLyAoKGl0ZW0udGV4dHVyZURhdGEucG9zZXMpID8gaXRlbS50ZXh0dXJlRGF0YS5wb3Nlcy55IDogMSkpIC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUuaGVpZ2h0IDogMSlcbiAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgZ2wuZHJhd0NpcmNsZXMoaW5zdGFuY2VzLCB0ZXh0dXJlcyk7XG5cbn07XG5cbnZhciBhcGkgPSB7XG4gICAgc3RlcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChwb3YgJiYgZ2wuaXNMb2FkZWQoKSkgc3RlcCgpO1xuICAgIH0sXG4gICAgY29ubmVjdENhbWVyYTogZnVuY3Rpb24oY2FtZXJhKSB7XG4gICAgICAgIHBvdiA9IGNhbWVyYS5wb3M7XG4gICAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgem9tYmllID0gcmVxdWlyZSgnLi9ab21iaWUuanMnKTtcbnZhciBtYWtlU3RhcnRPcHRpb25zID0gcmVxdWlyZSgnLi9tYWtlU3RhcnRPcHRpb25zLmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcbi8vdmFyIHdvcmxkID0gcmVxdWlyZSgnLi93b3JsZC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgc3Bhd25lciA9IGJhc2VFbnRpdHkoKTtcbiAgICBtYWtlU3RhcnRPcHRpb25zKHNwYXduZXIpO1xuICAgIG1ha2VHZW9tZXRyeShzcGF3bmVyLCAnY2lyY2xlJyk7XG4gICAgdmFyIHRpbWVyID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgc3Bhd25pbmcgPSBvcHRpb25zLnN0YXJ0O1xuICAgIHZhciBzcGF3bkNvdW50ID0gb3B0aW9ucy5zcGF3bkNvdW50O1xuICAgIHZhciBsYXN0U3Bhd24gPSBEYXRlLm5vdygpO1xuICAgIHNwYXduZXIuc3RhcnRPcHRpb25zKHtcbiAgICAgICAgc3RhcnQ6IG9wdGlvbnMuc3RhcnQsXG4gICAgICAgIHNwYXduQ291bnQ6IG9wdGlvbnMuc3Bhd25Db3VudCxcbiAgICAgICAgaW50ZXJ2YWw6IG9wdGlvbnMuaW50ZXJ2YWxcbiAgICB9KTtcbiAgICBcbiAgICBzcGF3bmVyLmJhc2UgPSAnc3Bhd25lcic7XG4gICAgc3Bhd25lci50eXBlID0gJ3pvbWJpZVNwYXduZXInO1xuICAgIHNwYXduZXIubW92ZShvcHRpb25zLnBvcyk7XG4gICAgc3Bhd25lci5zdGVwKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKHNwYXduaW5nKSB7XG4gICAgICAgICAgICBpZiAoc3Bhd25Db3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHNwYXduQ291bnQgPSBvcHRpb25zLnNwYXduQ291bnQ7XG4gICAgICAgICAgICAgICAgc3Bhd25pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aW1lciA9IG5vdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3cgLSBsYXN0U3Bhd24gPiA1MDApIHtcbiAgICAgICAgICAgICAgICBsYXN0U3Bhd24gPSBub3c7XG4gICAgICAgICAgICAgICAgd29ybGQubG9hZEl0ZW1zKHpvbWJpZSh7cG9zOiBzcGF3bmVyLnBvc30pKTtcbiAgICAgICAgICAgICAgICBzcGF3bkNvdW50LS07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChub3cgLSB0aW1lciA+IG9wdGlvbnMuaW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICBzcGF3bmluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBzcGF3bmVyO1xufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XCJmcmFtZXNcIjp7XCJidWxsZXRcIjp7XCJmcmFtZVwiOntcInhcIjo0NTMsXCJ5XCI6OTIyLFwid1wiOjIwMSxcImhcIjo0Nn0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoyMDEsXCJoXCI6NDZ9LFwic291cmNlU2l6ZVwiOntcIndcIjoyMDEsXCJoXCI6NDZ9fSxcIm1hY2hpbmVndW5cIjp7XCJmcmFtZVwiOntcInhcIjowLFwieVwiOjkyMixcIndcIjoxNTAsXCJoXCI6MTUwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MCxcImhcIjoxNTB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAsXCJoXCI6MTUwfX0sXCJwaXN0b2xcIjp7XCJmcmFtZVwiOntcInhcIjoxNTEsXCJ5XCI6OTIyLFwid1wiOjE1MCxcImhcIjoxNTB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MCxcImhcIjoxNTB9fSxcInBsYXllclwiOntcImZyYW1lXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAwLFwiaFwiOjI4MH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAwLFwiaFwiOjI4MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MDAsXCJoXCI6MjgwfX0sXCJzaG90Z3VuXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MzAyLFwieVwiOjkyMixcIndcIjoxNTAsXCJoXCI6MTUwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MCxcImhcIjoxNTB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAsXCJoXCI6MTUwfX0sXCJ3YWxsXCI6e1wiZnJhbWVcIjp7XCJ4XCI6NDUzLFwieVwiOjk2OSxcIndcIjoxMDAsXCJoXCI6MTAwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjEwMCxcImhcIjoxMDB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxMDAsXCJoXCI6MTAwfX0sXCJ6b21iaWUxXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MCxcInlcIjoxNzYwLFwid1wiOjE1MDAsXCJoXCI6NTYwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6NTYwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwMCxcImhcIjo1NjB9fSxcInpvbWJpZTJcIjp7XCJmcmFtZVwiOntcInhcIjowLFwieVwiOjI4MSxcIndcIjoxNTAwLFwiaFwiOjY0MH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAwLFwiaFwiOjY0MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MDAsXCJoXCI6NjQwfX0sXCJ6b21iaWUzXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MCxcInlcIjoxNjM0LFwid1wiOjE1MDAsXCJoXCI6Njg2fSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6Njg2fSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwMCxcImhcIjo2ODZ9fX0sXCJtZXRhXCI6e1wiYXBwXCI6XCJodHRwczovL3d3dy5sZXNoeWxhYnMuY29tL2FwcHMvc3N0b29sL1wiLFwidmVyc2lvblwiOlwiTGVzaHkgU3ByaXRlU2hlZXQgVG9vbCB2MC44LjRcIixcImltYWdlXCI6XCJzcHJpdGVzaGVldC5wbmdcIixcInNpemVcIjp7XCJ3XCI6MTUwMCxcImhcIjoyMzIwfSxcInNjYWxlXCI6MX19O1xuIiwidmFyIGJhc2VFbnRpdHkgPSByZXF1aXJlKCcuL2Jhc2VFbnRpdHkuanMnKTtcbnZhciBtYWtlVmlzaWJsZSA9IHJlcXVpcmUoJy4vbWFrZVZpc2libGUuanMnKTtcbnZhciBtYWtlR2VvbWV0cnkgPSByZXF1aXJlKCcuL21ha2VHZW9tZXRyeS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgc3F1YXJlID0gYmFzZUVudGl0eSgpO1xuICAgIG1ha2VHZW9tZXRyeShzcXVhcmUsICdzcXVhcmUnKTtcbiAgICBtYWtlVmlzaWJsZShzcXVhcmUpO1xuICAgIHNxdWFyZS5zZXREaW1lbnNpb25zKHt3aWR0aDogb3B0aW9ucy53aWR0aCwgaGVpZ2h0OiBvcHRpb25zLmhlaWdodH0pO1xuICAgIHNxdWFyZS5tb3ZlKG9wdGlvbnMucG9zKTtcbiAgICBzcXVhcmUuYmFzZSA9ICdzcXVhcmUnO1xuICAgIHNxdWFyZS50eXBlID0gJ3RpbGUnO1xuICAgIHNxdWFyZS5jb2xsaWRlID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIHJldHVybiBzcXVhcmU7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cbiAgICB7ZW50aXR5OiAndGVzdCcsIHBvczoge3g6IC00MDAsIHk6IC00MDUsIHJvdDogMH19LFxuICAgIHtlbnRpdHk6ICd0ZXN0JywgcG9zOiB7eDogLTQwMCwgeTogLTQwNSwgcm90OiAwfX1cbiAgICAvL3tlbnRpdHk6ICd3YWxsJywgcG9zOiB7eDogLTQ1MCwgeTogLTQ1MCwgcm90OiAwfSwgZGltOiB7dzogMzAwLCBoOiAzMDB9fSxcbiAgICAvL3tlbnRpdHk6ICdzcXVhcmUnLCBwb3M6IHt4OiAtMTI1MCwgeTogLTEyNTAsIHJvdDogNDV9LCBkaW06IHt3OiAyNTAwLCBoOiAyNTAwfX1cblxuICAgIC8qe2VudGl0eTogJ1RpbGUnLCBwb3M6IHt4OiAyNTAwLCB5OiAyNTAwfSwgd2lkdGg6IDUwMDAsIGhlaWdodDogNTAwMCwgcGF0aDogJy4vaW1nL2JhY2tncm91bmQuanBnJ30sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogMCwgeTogMzkwMCwgcm90OiAwfSwgd2lkdGg6IDEwMCwgaGVpZ2h0OiAyNjAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiAwLCB5OiAxMTAwLCByb3Q6IDB9LCB3aWR0aDogMTAwLCBoZWlnaHQ6IDIyMDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDI1MDAsIHk6IDAsIHJvdDogMH0sIHdpZHRoOiA1MDAwLCBoZWlnaHQ6IDEwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogMjUwMCwgeTogNTAwMCwgcm90OiAwfSwgd2lkdGg6IDUwMDAsIGhlaWdodDogMTAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiA1MDAwLCB5OiAyNTAwLCByb3Q6IDB9LCB3aWR0aDogMTAwLCBoZWlnaHQ6IDUwMDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy9jYXIxLnBuZycsIHBvczoge3g6IDMwMCwgeTogMzAwLCByb3Q6IDJ9LCB3aWR0aDogMjAwLCBoZWlnaHQ6IDMwMH0sXG4gICAge2VudGl0eTogJ1pvbWJpZScsIGltZzogMiwgcG9zOiB7eDogMTkwMCwgeTogMTcwMCwgcm90OiAwfX1cbiovXG5dO1xuXG5cbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcbnZhciBtYWtlU29saWQgPSByZXF1aXJlKCcuL21ha2VTb2xpZC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgb2JqID0gYmFzZUVudGl0eSgpO1xuICAgIG9iai5yYWRpdXMgPSAxMDtcbiAgICBtYWtlR2VvbWV0cnkob2JqLCAnY2lyY2xlJyk7XG4gICAgbWFrZVNvbGlkKG9iaik7XG4gICAgb2JqLmJhc2UgPSAnb2JqJztcbiAgICBvYmoudHlwZSA9ICd0ZXN0JztcbiAgICBvYmoubW92ZShvcHRpb25zLnBvcyk7XG4gICAgb2JqLmNvbGxpZGUgPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbiIsInZhciBzcHJpdGVzID0gcmVxdWlyZSgnLi9zcHJpdGVzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNoYXJhY3Rlcjoge1xuICAgICAgICB6b21iaWU6IHsgXG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMuem9tYmllMi5mcmFtZSxcbiAgICAgICAgICAgIHBvc2VzOiB7XG4gICAgICAgICAgICAgICAgeDogNixcbiAgICAgICAgICAgICAgICB5OiA0LFxuICAgICAgICAgICAgICAgIHNsaWRlczogWzYsIDUsIDIsIDNdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHpvbWJpZTI6IHsgXG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMuem9tYmllMi5mcmFtZSxcbiAgICAgICAgICAgIHBvc2VzOiB7XG4gICAgICAgICAgICAgICAgeDogNixcbiAgICAgICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgICAgIHNsaWRlczogWzYsIDVdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHpvbWJpZTM6IHsgXG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMuem9tYmllMy5mcmFtZSxcbiAgICAgICAgICAgIHBvc2VzOiB7XG4gICAgICAgICAgICAgICAgeDogNixcbiAgICAgICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgICAgIHNsaWRlczogWzYsIDVdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHBsYXllcjogeyBcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy5wbGF5ZXIuZnJhbWUsXG4gICAgICAgICAgICBwb3Nlczoge1xuICAgICAgICAgICAgICAgIHg6IDYsXG4gICAgICAgICAgICAgICAgeTogMixcbiAgICAgICAgICAgICAgICBzbGlkZXM6IFs2LCA1XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBwcm9qZWN0aWxlOiB7XG4gICAgICAgIGJ1bGxldDoge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLmJ1bGxldC5mcmFtZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzcXVhcmU6IHtcbiAgICAgICAgdGlsZToge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLndhbGwuZnJhbWVcbiAgICAgICAgfSxcbiAgICAgICAgd2FsbDoge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLndhbGwuZnJhbWVcbiAgICAgICAgfSxcbiAgICAgICAgZG9vcjoge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLndhbGwuZnJhbWVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgd2VhcG9uOiB7XG4gICAgICAgIGd1bjoge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLnBpc3RvbC5mcmFtZVxuICAgICAgICB9XG4gICAgfVxufTtcbiIsInZhciBzcXVhcmUgPSByZXF1aXJlKCcuL3NxdWFyZS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG52YXIgbWFrZVZpc2libGUgPSByZXF1aXJlKCcuL21ha2VWaXNpYmxlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciAgd2FsbCA9IHNxdWFyZShvcHRpb25zKTtcbiAgICBtYWtlVmlzaWJsZSh3YWxsKTtcbiAgICB3YWxsLm9uVG9wID0gdHJ1ZTtcbiAgICBtYWtlU29saWQod2FsbCk7XG4gICAgd2FsbC50eXBlID0gJ3dhbGwnO1xuXG4gICAgcmV0dXJuIHdhbGw7XG59O1xuIiwidmFyIG1ha2VWaXNpYmxlID0gcmVxdWlyZSgnLi9tYWtlVmlzaWJsZS5qcycpO1xudmFyIG1ha2VJbnZlbnRvcnkgPSByZXF1aXJlKCcuL21ha2VJbnZlbnRvcnkuanMnKTtcbnZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgbWFrZVNvbGlkID0gcmVxdWlyZSgnLi9tYWtlU29saWQuanMnKTtcbnZhciBtYWtlR2VvbWV0cnkgPSByZXF1aXJlKCcuL21ha2VHZW9tZXRyeS5qcycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdlYXBvbiA9IGJhc2VFbnRpdHkoKTtcbiAgICBtYWtlR2VvbWV0cnkod2VhcG9uLCAnY2lyY2xlJyk7XG4gICAgbWFrZVNvbGlkKHdlYXBvbik7XG4gICAgbWFrZVZpc2libGUod2VhcG9uKTtcbiAgICBtYWtlSW52ZW50b3J5KHdlYXBvbik7XG4gICAgd2VhcG9uLmJhc2UgPSAnd2VhcG9uJztcbiAgICB3ZWFwb24ucmFkaXVzID0gJzEwJztcbiAgICB3ZWFwb24uY29vbERvd24gPSA1O1xuICAgIHdlYXBvbi5jb25zb2xpZGF0ZUludmVudG9yeSA9IHRydWU7XG4gICAgd2VhcG9uLmNvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICBzd2l0Y2ggKGNvbGxpZGVyLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3BsYXllcic6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICByZXR1cm4gd2VhcG9uO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIG1hdHJpeFN0YWNrID0gcmVxdWlyZSgnLi9tYXRyaXhTdGFjay5qcycpO1xudmFyIGdldCA9IHJlcXVpcmUoJy4vZ2V0LmpzJyk7XG5tYXRyaXhTdGFjayA9IG5ldyBtYXRyaXhTdGFjaygpO1xuXG52YXIgZ2wsIGRyYXdTcXVhcmVzLCBkcmF3Q2lyY2xlcywgc2V0VXBDYW1lcmEsIHRleHR1cmUsIGNpcmNsZVZlcnRTaGFkZXIsIHNxdWFyZVZlcnRTaGFkZXIsIGNpcmNsZUZyYWdTaGFkZXIsIHNxdWFyZUZyYWdTaGFkZXIsIGlzTG9hZGVkO1xudmFyIGNhbnZhc1NwYWNlID0ge307XG52YXIgYXNzZXRzID0gMDtcbmNhbnZhc1NwYWNlLndpZHRoID0gMzAwMDtcbmNhbnZhc1NwYWNlLmhlaWdodCA9IDE1MDA7XG5cbnZhciBsb2FkZWRBc3NldCA9IGZ1bmN0aW9uKCkge1xuICAgIGFzc2V0cysrO1xuICAgIGlmIChhc3NldHMgPT09IDUpIGxvYWRlZCgpO1xufTtcblxuZ2V0KCcuLi9nbHNsL2NpcmNsZS52ZXJ0JywgZnVuY3Rpb24oZGF0YSkge1xuICAgIGNpcmNsZVZlcnRTaGFkZXIgPSBkYXRhO1xuICAgIGxvYWRlZEFzc2V0KCk7XG59KTtcblxuZ2V0KCcuLi9nbHNsL3NxdWFyZS52ZXJ0JywgZnVuY3Rpb24oZGF0YSkge1xuICAgIHNxdWFyZVZlcnRTaGFkZXIgPSBkYXRhO1xuICAgIGxvYWRlZEFzc2V0KCk7XG59KTtcblxuZ2V0KCcuLi9nbHNsL2NpcmNsZS5mcmFnJywgZnVuY3Rpb24oZGF0YSkge1xuICAgIGNpcmNsZUZyYWdTaGFkZXIgPSBkYXRhO1xuICAgIGxvYWRlZEFzc2V0KCk7XG59KTtcblxuZ2V0KCcuLi9nbHNsL3NxdWFyZS5mcmFnJywgZnVuY3Rpb24oZGF0YSkge1xuICAgIHNxdWFyZUZyYWdTaGFkZXIgPSBkYXRhO1xuICAgIGxvYWRlZEFzc2V0KCk7XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICBsb2FkZWRBc3NldCgpO1xufSk7XG5cbnZhciBsb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpc0xvYWRlZCA9IHRydWU7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbiAgICBjYW52YXMuc2V0QXR0cmlidXRlKCd3aWR0aCcsIGNhbnZhc1NwYWNlLndpZHRoKTtcbiAgICBjYW52YXMuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBjYW52YXNTcGFjZS5oZWlnaHQpO1xuICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJyk7XG4gICAgdmFyIGV4dCA9IGdsLmdldEV4dGVuc2lvbihcIkFOR0xFX2luc3RhbmNlZF9hcnJheXNcIik7IC8vIFZlbmRvciBwcmVmaXhlcyBtYXkgYXBwbHkhXG5cblxuXG4gICAgLy8gR2V0IEEgV2ViR0wgY29udGV4dFxuICAgIC8qKiBAdHlwZSB7SFRNTENhbnZhc0VsZW1lbnR9ICovXG5cblxuICAgIC8vIHNldHVwIEdMU0wgcHJvZ3JhbVxuICAgIHZhciBjaXJjbGVzUHJvZ3JhbSA9IHdlYmdsVXRpbHMuY3JlYXRlUHJvZ3JhbUZyb21Tb3VyY2VzKGdsLCBbY2lyY2xlVmVydFNoYWRlciwgY2lyY2xlRnJhZ1NoYWRlcl0pO1xuICAgIHZhciBzcXVhcmVzUHJvZ3JhbSA9IHdlYmdsVXRpbHMuY3JlYXRlUHJvZ3JhbUZyb21Tb3VyY2VzKGdsLCBbc3F1YXJlVmVydFNoYWRlciwgc3F1YXJlRnJhZ1NoYWRlcl0pO1xuXG4gICAgLy8gbG9vayB1cCB3aGVyZSB0aGUgdmVydGV4IGRhdGEgbmVlZHMgdG8gZ28uXG4gICAgdmFyIGNpcmNsZVBvc2l0aW9uTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihjaXJjbGVzUHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpO1xuICAgIHZhciBjaXJjbGVUZXhjb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oY2lyY2xlc1Byb2dyYW0sIFwiYV90ZXhjb29yZFwiKTtcbiAgICB2YXIgY2lyY2xlSW5zdGFuY2VMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKGNpcmNsZXNQcm9ncmFtLCBcImFfaW5zdGFuY2VcIik7XG4gICAgdmFyIGNpcmNsZVRleHR1cmVzTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihjaXJjbGVzUHJvZ3JhbSwgXCJhX3Bvc2VcIik7XG4gICAgdmFyIHNxdWFyZVBvc2l0aW9uTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpO1xuICAgIHZhciBzcXVhcmVUZXhjb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwiYV90ZXhjb29yZFwiKTtcbiAgICB2YXIgc3F1YXJlSW5zdGFuY2VMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcImFfaW5zdGFuY2VcIik7XG4gICAgdmFyIHNxdWFyZVRleHR1cmVzTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJhX3Bvc2VcIik7XG4gICAgdmFyIHNxdWFyZURpbXNMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcImFfZGltXCIpO1xuXG4gICAgLy8gbG9va3VwIHVuaWZvcm1zXG4gICAgdmFyIGNpcmNsZUNhbWVyYU1hdHJpeExvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKGNpcmNsZXNQcm9ncmFtLCBcInVfY2FtZXJhTWF0cml4XCIpO1xuICAgIHZhciBjaXJjbGVDYW52YXNEaW1zTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oY2lyY2xlc1Byb2dyYW0sIFwidV9jYW52YXNEaW1zXCIpO1xuICAgIHZhciBzcXVhcmVDYW1lcmFNYXRyaXhMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJ1X2NhbWVyYU1hdHJpeFwiKTtcbiAgICB2YXIgc3F1YXJlQ2FudmFzRGltc0xvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcInVfY2FudmFzRGltc1wiKTtcbiAgICB2YXIgc3F1YXJlVGV4dHVyZUxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcInVfdGV4dHVyZVwiKTtcbiAgICB2YXIgY2lyY2xlVGV4dHVyZUxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKGNpcmNsZXNQcm9ncmFtLCBcInVfdGV4dHVyZVwiKTtcblxuICAgIHZhciBkaW1zQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGRpbXNCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBbMCwgMCwgMF0sIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgIHZhciB0ZXh0dXJlQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleHR1cmVCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBbMCwgMCwgMF0sIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgIHZhciBpbnN0YW5jZUJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBpbnN0YW5jZUJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIFswLCAwLCAwXSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIC8vIENyZWF0ZSBhIGJ1ZmZlci5cbiAgICB2YXIgcG9zaXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcG9zaXRpb25CdWZmZXIpO1xuXG4gICAgdmFyIHBvc2l0aW9ucyA9IFtcbiAgICAgICAgLS41LCAtLjUsXG4gICAgICAgIC0uNSwgLjUsXG4gICAgICAgIC41LCAtLjUsXG4gICAgICAgIC41LCAtLjUsXG4gICAgICAgIC0uNSwgLjUsXG4gICAgICAgIC41LCAuNVxuICAgIF07XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zKSwgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgLy8gQ3JlYXRlIGEgYnVmZmVyIGZvciB0ZXh0dXJlIGNvb3Jkc1xuICAgIHZhciB0ZXhjb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0ZXhjb29yZEJ1ZmZlcik7XG5cbiAgICAvLyBQdXQgdGV4Y29vcmRzIGluIHRoZSBidWZmZXJcbiAgICB2YXIgdGV4Y29vcmRzID0gW1xuICAgICAgICAwLCAwLFxuICAgICAgICAwLCAxLFxuICAgICAgICAxLCAwLFxuICAgICAgICAxLCAwLFxuICAgICAgICAwLCAxLFxuICAgICAgICAxLCAxXG4gICAgXTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0ZXhjb29yZHMpLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAvLyBjcmVhdGVzIGEgdGV4dHVyZSBpbmZvIHsgd2lkdGg6IHcsIGhlaWdodDogaCwgdGV4dHVyZTogdGV4IH1cbiAgICAvLyBUaGUgdGV4dHVyZSB3aWxsIHN0YXJ0IHdpdGggMXgxIHBpeGVscyBhbmQgYmUgdXBkYXRlZFxuICAgIC8vIHdoZW4gdGhlIGltYWdlIGhhcyBsb2FkZWRcbiAgICBmdW5jdGlvbiBsb2FkSW1hZ2VBbmRDcmVhdGVUZXh0dXJlSW5mbyh1cmwpIHtcbiAgICAgICAgdmFyIHRleCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcbiAgICAgICAgLy8gRmlsbCB0aGUgdGV4dHVyZSB3aXRoIGEgMXgxIGJsdWUgcGl4ZWwuXG4gICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgMSwgMSwgMCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSxcbiAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShbMCwgMCwgMjU1LCAyNTVdKSk7XG5cbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuUkVQRUFUKTtcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuUkVQRUFUKTtcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1RfTUlQTUFQX05FQVJFU1QpO1xuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG5cbiAgICAgICAgdmFyIHRleHR1cmVJbmZvID0ge1xuICAgICAgICAgICAgd2lkdGg6IDEsICAgLy8gd2UgZG9uJ3Qga25vdyB0aGUgc2l6ZSB1bnRpbCBpdCBsb2Fkc1xuICAgICAgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgICAgICAgdGV4dHVyZTogdGV4LFxuICAgICAgICB9O1xuICAgICAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0ZXh0dXJlSW5mby53aWR0aCA9IGltZy53aWR0aDtcbiAgICAgICAgICAgIHRleHR1cmVJbmZvLmhlaWdodCA9IGltZy5oZWlnaHQ7XG5cbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmVJbmZvLnRleHR1cmUpO1xuICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWcpO1xuICAgICAgICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbWcuc3JjID0gdXJsO1xuXG4gICAgICAgIHJldHVybiB0ZXh0dXJlSW5mbztcbiAgICB9O1xuXG4gICAgdGV4dHVyZSA9IGxvYWRJbWFnZUFuZENyZWF0ZVRleHR1cmVJbmZvKCcuL2ltZy9zcHJpdGVzaGVldC5wbmcnKTtcblxuICAgIHNldFVwQ2FtZXJhID0gZnVuY3Rpb24ocG92KSB7XG4gICAgICAgIHZhciBvcnRobyA9IG00Lm9ydGhvZ3JhcGhpYygwLCBjYW52YXNTcGFjZS53aWR0aCwgY2FudmFzU3BhY2UuaGVpZ2h0LCAwLCAtMSwgMSk7XG4gICAgICAgIGdsLnVzZVByb2dyYW0oc3F1YXJlc1Byb2dyYW0pO1xuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHNxdWFyZUNhbWVyYU1hdHJpeExvY2F0aW9uLCBmYWxzZSwgb3J0aG8pO1xuICAgICAgICBnbC51bmlmb3JtMmYoc3F1YXJlQ2FudmFzRGltc0xvY2F0aW9uLCBjYW52YXNTcGFjZS53aWR0aCAvIDIgLSBwb3YueCwgY2FudmFzU3BhY2UuaGVpZ2h0IC8gMiAtIHBvdi55KTtcbiAgICAgICAgZ2wudXNlUHJvZ3JhbShjaXJjbGVzUHJvZ3JhbSk7XG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYoY2lyY2xlQ2FtZXJhTWF0cml4TG9jYXRpb24sIGZhbHNlLCBvcnRobyk7XG4gICAgICAgIGdsLnVuaWZvcm0yZihjaXJjbGVDYW52YXNEaW1zTG9jYXRpb24sIGNhbnZhc1NwYWNlLndpZHRoIC8gMiAtIHBvdi54LCBjYW52YXNTcGFjZS5oZWlnaHQgLyAyIC0gcG92LnkpO1xuICAgIH07XG5cbiAgICBkcmF3U3F1YXJlcyA9IGZ1bmN0aW9uKGluc3RhbmNlcywgZGltcywgdGV4dHVyZXMpIHtcblxuICAgICAgICBnbC51c2VQcm9ncmFtKHNxdWFyZXNQcm9ncmFtKTtcblxuICAgICAgICB2YXIgaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlcy5sZW5ndGggLyAzO1xuICAgICAgICBpbnN0YW5jZXMgPSBuZXcgRmxvYXQzMkFycmF5KGluc3RhbmNlcyk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBpbnN0YW5jZUJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBpbnN0YW5jZXMsIGdsLkRZTkFNSUNfRFJBVywgMCwgaW5zdGFuY2VzLmxlbmd0aCk7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNxdWFyZUluc3RhbmNlTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNxdWFyZUluc3RhbmNlTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgMTIsIDApO1xuICAgICAgICBleHQudmVydGV4QXR0cmliRGl2aXNvckFOR0xFKHNxdWFyZUluc3RhbmNlTG9jYXRpb24sIDEpOyBcblxuICAgICAgICBkaW1zID0gbmV3IEZsb2F0MzJBcnJheShkaW1zKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGRpbXNCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGltcywgZ2wuRFlOQU1JQ19EUkFXLCAwLCBkaW1zLmxlbmd0aCk7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNxdWFyZURpbXNMb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc3F1YXJlRGltc0xvY2F0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDgsIDApO1xuICAgICAgICBleHQudmVydGV4QXR0cmliRGl2aXNvckFOR0xFKHNxdWFyZURpbXNMb2NhdGlvbiwgMSk7IFxuXG4gICAgICAgIHRleHR1cmVzID0gbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlcyk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0ZXh0dXJlQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHRleHR1cmVzLCBnbC5EWU5BTUlDX0RSQVcsIDAsIHRleHR1cmVzLmxlbmd0aCk7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNxdWFyZVRleHR1cmVzTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNxdWFyZVRleHR1cmVzTG9jYXRpb24sIDQsIGdsLkZMT0FULCBmYWxzZSwgMTYsIDApO1xuICAgICAgICBleHQudmVydGV4QXR0cmliRGl2aXNvckFOR0xFKHNxdWFyZVRleHR1cmVzTG9jYXRpb24sIDEpOyBcblxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcG9zaXRpb25CdWZmZXIpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzcXVhcmVQb3NpdGlvbkxvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzcXVhcmVQb3NpdGlvbkxvY2F0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4Y29vcmRCdWZmZXIpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzcXVhcmVUZXhjb29yZExvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzcXVhcmVUZXhjb29yZExvY2F0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgICAgIGdsLnVuaWZvcm0xaShzcXVhcmVUZXh0dXJlTG9jYXRpb24sIDApO1xuXG4gICAgICAgIGV4dC5kcmF3QXJyYXlzSW5zdGFuY2VkQU5HTEUoZ2wuVFJJQU5HTEVTLCAwLCA2LCBpbnN0YW5jZUNvdW50KTtcblxuICAgIH07XG5cbiAgICBkcmF3Q2lyY2xlcyA9IGZ1bmN0aW9uKGluc3RhbmNlcywgdGV4dHVyZXMpIHtcblxuICAgICAgICBnbC51c2VQcm9ncmFtKGNpcmNsZXNQcm9ncmFtKTtcblxuICAgICAgICB2YXIgaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlcy5sZW5ndGggLyA0O1xuICAgICAgICBpbnN0YW5jZXMgPSBuZXcgRmxvYXQzMkFycmF5KGluc3RhbmNlcyk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBpbnN0YW5jZUJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBpbnN0YW5jZXMsIGdsLkRZTkFNSUNfRFJBVywgMCwgaW5zdGFuY2VzLmxlbmd0aCk7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGNpcmNsZUluc3RhbmNlTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGNpcmNsZUluc3RhbmNlTG9jYXRpb24sIDQsIGdsLkZMT0FULCBmYWxzZSwgMTYsIDApO1xuICAgICAgICBleHQudmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGNpcmNsZUluc3RhbmNlTG9jYXRpb24sIDEpOyBcblxuICAgICAgICB0ZXh0dXJlcyA9IG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZXMpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4dHVyZUJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0ZXh0dXJlcywgZ2wuRFlOQU1JQ19EUkFXLCAwLCB0ZXh0dXJlcy5sZW5ndGgpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShjaXJjbGVUZXh0dXJlc0xvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihjaXJjbGVUZXh0dXJlc0xvY2F0aW9uLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDE2LCAwKTtcbiAgICAgICAgZXh0LnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShjaXJjbGVUZXh0dXJlc0xvY2F0aW9uLCAxKTsgXG5cbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBvc2l0aW9uQnVmZmVyKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoY2lyY2xlUG9zaXRpb25Mb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoY2lyY2xlUG9zaXRpb25Mb2NhdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleGNvb3JkQnVmZmVyKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoY2lyY2xlVGV4Y29vcmRMb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoY2lyY2xlVGV4Y29vcmRMb2NhdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuXG4gICAgICAgIGdsLnVuaWZvcm0xaShjaXJjbGVUZXh0dXJlTG9jYXRpb24sIDApO1xuXG4gICAgICAgIFxuICAgICAgICBleHQuZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKGdsLlRSSUFOR0xFUywgMCwgNiwgaW5zdGFuY2VDb3VudCk7XG5cbiAgICB9O1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkcmF3Q2lyY2xlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRyYXdDaXJjbGVzLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfSxcbiAgICBkcmF3U3F1YXJlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRyYXdTcXVhcmVzLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfSxcbiAgICBzZXRVcENhbWVyYTogZnVuY3Rpb24ocG92KSB7XG4gICAgICAgIHNldFVwQ2FtZXJhKHBvdik7XG4gICAgfSxcbiAgICBpc0xvYWRlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpc0xvYWRlZDtcbiAgICB9LFxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZ2wudmlld3BvcnQoMCwgMCwgY2FudmFzU3BhY2Uud2lkdGgsIGNhbnZhc1NwYWNlLmhlaWdodCk7XG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH0sXG4gICAgbWF0cml4OiBtYXRyaXhTdGFjayxcbiAgICBnZXRUZXh0dXJlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRleHR1cmU7XG4gICAgfSxcbiAgICBjYW52YXNEaW1lbnNpb25zOiB7XG4gICAgICAgIHg6IGNhbnZhc1NwYWNlLndpZHRoLFxuICAgICAgICB5OiBjYW52YXNTcGFjZS5oZWlnaHRcbiAgICB9XG59O1xuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgbGV2ZWwgPSB7fTtcbmxldmVsLmdhbWUgPSByZXF1aXJlKCcuL2xldmVsLmpzJyk7XG5sZXZlbC50ZXN0ID0gcmVxdWlyZSgnLi90ZXN0LWxldmVsLmpzJyk7XG52YXIgRW50aXRpZXMgPSByZXF1aXJlKCcuL2dldEVudGl0aWVzLmpzJyk7XG52YXIgY2lyY2xlcyA9IFtdO1xudmFyIHNxdWFyZXMgPSBbXTtcbnZhciBwb2ludHMgPSBbXTtcbnZhciB4cyA9IFtdO1xuXG52YXIgZ2V0ID0gcmVxdWlyZSgnLi9nZXQuanMnKTtcblxudmFyIHdvcmxkID0gW107XG52YXIgbmV3SXRlbXMgPSBbXTtcbnZhciB1bml2ZXJzYWxEZWNvcmF0b3JzID0gW107XG52YXIgbGV2ZWxNZXRhZGF0YSA9IHt9O1xuXG52YXIgYXBpID0ge1xuICAgIGdldE9iakJ5TmFtZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gd29ybGQucmVkdWNlKGZ1bmN0aW9uKGFjYywgaXRlbSkgeyBpZiAoaXRlbS5nZXRPYmpOYW1lKCkgPT09IG5hbWUpIHJldHVybiBpdGVtOyB9LCBudWxsKTtcbiAgICB9LFxuICAgIHNldExldmVsTWV0YWRhdGE6IGZ1bmN0aW9uKG5ld0RhdGEpIHtcbiAgICAgICAgZm9yICh2YXIgdmFsIGluIG5ld0RhdGEpIHtcbiAgICAgICAgICAgIGxldmVsTWV0YWRhdGFbdmFsXSA9IG5ld0RhdGFbdmFsXTtcbiAgICAgICAgfVxuICAgICAgICBldmVudHMuZW1pdCgndXBkYXRlTGV2ZWxOYW1lJyk7XG4gICAgfSxcbiAgICBnZXRMZXZlbE1ldGFkYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGxldmVsTWV0YWRhdGE7XG4gICAgfSxcbiAgICBkZWNvcmF0ZUFsbEl0ZW1zOiBmdW5jdGlvbihkZWNvcmF0b3IpIHtcbiAgICAgICAgd29ybGQuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7IGRlY29yYXRvcihpdGVtKTsgfSk7XG4gICAgICAgIHVuaXZlcnNhbERlY29yYXRvcnMucHVzaChkZWNvcmF0b3IpO1xuICAgIH0sXG4gICAgdW5sb2FkV29ybGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3b3JsZC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0udW5sb2FkKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBhcGkuc2V0TGV2ZWxNZXRhZGF0YSh7XG4gICAgICAgICAgICBpZDogbnVsbCxcbiAgICAgICAgICAgIG5hbWU6IG51bGxcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBsb2FkTGV2ZWw6IGZ1bmN0aW9uKGxldmVsSWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFwaS51bmxvYWRXb3JsZCgpO1xuICAgICAgICBnZXQoJy4vbGV2ZWxzLycgKyBsZXZlbElkLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBhcGkubG9hZEl0ZW1zKEpTT04ucGFyc2UoZGF0YS5kYXRhKSk7XG4gICAgICAgICAgICBhcGkuc3RlcCgpO1xuICAgICAgICAgICAgYXBpLnNldExldmVsTWV0YWRhdGEoe1xuICAgICAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgICAgICAgICAgICBpZDogZGF0YS5pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBhcGkuc29ydEl0ZW1zKCk7XG4gICAgfSxcbiAgICBsb2FkSXRlbXM6IGZ1bmN0aW9uKGl0ZW1zKSB7XG4gICAgICAgIFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaXRlbXMpKSB7XG4gICAgICAgICAgICBpdGVtcyA9IFtpdGVtc107XG4gICAgICAgIH1cblxuICAgICAgICBpdGVtcyA9IGl0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB2YXIgZW50aXR5ID0gaXRlbTtcbiAgICAgICAgICAgIGlmICghZW50aXR5LnR5cGUpIGVudGl0eSA9IEVudGl0aWVzW2l0ZW0uZW50aXR5XShpdGVtKTtcbiAgICAgICAgICAgIGVudGl0eS5sb2FkKCk7XG4gICAgICAgICAgICB1bml2ZXJzYWxEZWNvcmF0b3JzLmZvckVhY2goZnVuY3Rpb24oZGVjb3JhdG9yKSB7XG4gICAgICAgICAgICAgICAgZGVjb3JhdG9yKGVudGl0eSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBlbnRpdHk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdJdGVtcyA9IG5ld0l0ZW1zLmNvbmNhdChpdGVtcyk7XG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAxKSByZXR1cm4gaXRlbXM7XG4gICAgICAgIHJldHVybiBpdGVtc1swXTtcbiAgICB9LFxuICAgIGdldEl0ZW1zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkLnNsaWNlKCk7XG4gICAgfSxcbiAgICBnZXRJdGVtQnlJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5pZCA9PT0gaWQpIHJldHVybiB0cnVlO1xuICAgICAgICB9KVswXTtcbiAgICB9LFxuICAgIGdldEl0ZW1zQnlUeXBlOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHJldHVybiB3b3JsZC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gdHlwZSkgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgd29ybGQgPSB3b3JsZC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyBpZiAoaXRlbS5pZCAhPT0gaWQpIHJldHVybiB0cnVlOyB9KTtcbiAgICAgICAgZXZlbnRzLmVtaXQoJ2VudGl0eUNvdW50Jyk7XG4gICAgfSxcbiAgICBnZXRYczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB4cztcbiAgICB9LFxuICAgIHVwZGF0ZU5ld0l0ZW1zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgd29ybGQgPSB3b3JsZC5jb25jYXQobmV3SXRlbXMpO1xuICAgICAgICBhcGkuc29ydEl0ZW1zKCk7XG4gICAgICAgIGlmIChuZXdJdGVtcy5sZW5ndGgpIGV2ZW50cy5lbWl0KCdlbnRpdHlDb3VudCcpO1xuICAgICAgICBuZXdJdGVtcyA9IFtdO1xuICAgIH0sXG4gICAgc3RlcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFwaS51cGRhdGVOZXdJdGVtcygpO1xuICAgICAgICB4cyA9IFtdO1xuICAgICAgICB5cyA9IFtdO1xuICAgICAgICBuZXdJdGVtcyA9IFtdO1xuICAgICAgICBjaXJjbGVzID0gW107XG4gICAgICAgIHNxdWFyZXMgPSBbXTtcbiAgICAgICAgcG9pbnRzID0gW107XG4gICAgICAgIHdvcmxkLmZvckVhY2goZnVuY3Rpb24oaXRlbSkgeyBcbiAgICAgICAgICAgIGlmIChpdGVtLmdlb21ldHJ5ID09PSAnY2lyY2xlJyAmJiBpdGVtLnZpc2libGUpIGNpcmNsZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIGlmIChpdGVtLmdlb21ldHJ5ID09PSAnc3F1YXJlJyAmJiBpdGVtLnZpc2libGUpIHNxdWFyZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIGlmIChpdGVtLmdlb21ldHJ5ID09PSAncG9pbnQnICYmIGl0ZW0udmlzaWJsZSkgcG9pbnRzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICBpdGVtLmNvbGxpc2lvbkRhdGEgPSB7fTtcbiAgICAgICAgICAgIGl0ZW0uc3RlcC5jYWxsKGl0ZW0pOyBcbiAgICAgICAgICAgIGlmIChpdGVtLmdlb21ldHJ5ICYmIGl0ZW0uc29saWQgJiYgIWl0ZW0uaW5Db250YWluZXIoKSkgeHMgPSB4cy5jb25jYXQoaXRlbS5BQUJCLnhzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFwaS5zb3J0SXRlbXMoKTtcbiAgICAgICAgeHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gKGEudmFsIC0gYi52YWwpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNvcnRJdGVtczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdvcmxkLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEub25Ub3A7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0R2VvbWV0cnk6IGZ1bmN0aW9uKGdlb21ldHJ5KSB7XG4gICAgICAgIGlmIChnZW9tZXRyeSA9PT0gJ2NpcmNsZScpIHJldHVybiBjaXJjbGVzO1xuICAgICAgICBpZiAoZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSByZXR1cm4gc3F1YXJlcztcbiAgICAgICAgaWYgKGdlb21ldHJ5ID09PSAncG9pbnQnKSByZXR1cm4gcG9pbnRzO1xuICAgIH0sXG4gICAgZ2V0QWxsSXRlbXNTb3J0ZWRCeUdlb21ldHJ5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtzcXVhcmVzLCBjaXJjbGVzLCBwb2ludHNdO1xuICAgIH0sXG4gICAgZ2V0RW50aXR5VHlwZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW50aXRpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgZW50aXR5IGluIEVudGl0aWVzKSB7XG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBlbnRpdGllcztcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiJdfQ==
