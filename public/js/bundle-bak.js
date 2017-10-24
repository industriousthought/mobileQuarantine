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

},{"./character.js":6,"./events.js":11}],2:[function(require,module,exports){
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
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                                       timeToCall);
                                       lastTime = currTime + timeToCall;
                                       return id;
        };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
}());

},{}],4:[function(require,module,exports){
var getId = require('./getId.js').getId;


module.exports = function() {
    var pushEvents = [];
    var moveEvents = [];
    var loadEvents = [];
    var unloadEvents = [];
    var stepEvents = [];
    var loaded = false;
    var moved = false;
    var newEffects = [];
    var effects = [];
    var obj = {
        inContainer: function() {
            return (!!obj.owner);
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
            if (obj.moved) moveEvents.forEach(function(fn) { fn(); });
            obj.moved = false;
            obj.pos.vec.x = 0;
            obj.pos.vec.y = 0;
            if (obj.pos.rot > Math.PI * 2) obj.pos.rot -= Math.PI * 2;
            if (obj.pos.rot < 0) obj.pos.rot += Math.PI * 2;

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
            obj.moved = true;
        },
        push: function(vec) {
            if (vec.ev) {
                moveEvents.push(vec.ev);
            }
            if (vec.x) obj.pos.vec.x += vec.x;
            if (vec.y) obj.pos.vec.y += vec.y;
            obj.moved = true;
        },
        addEffect: function(fn) {
            newEffects.push(fn);
        }
    };


    return obj;
};


},{"./getId.js":13}],5:[function(require,module,exports){
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

},{"./makeSolid.js":19,"./projectile.js":22}],6:[function(require,module,exports){
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


},{"./baseEntity.js":4,"./makeGeometry.js":17,"./makeInventory.js":18,"./makeSolid.js":19,"./makeVisible.js":20}],7:[function(require,module,exports){
var world = require('./world.js');
var prune = function(a, b) {
    return (
            ((a.AABB.ys[0].val > b.AABB.ys[0].val && a.AABB.ys[0].val < b.AABB.ys[1].val) ||
            (a.AABB.ys[1].val > b.AABB.ys[0].val && a.AABB.ys[1].val < b.AABB.ys[1].val) ||
            (b.AABB.ys[0].val > a.AABB.ys[0].val && b.AABB.ys[0].val < a.AABB.ys[1].val) ||
            (b.AABB.ys[1].val > a.AABB.ys[0].val && b.AABB.ys[1].val < a.AABB.ys[1].val)) && 
            (!(b.geometry === 'square' && a.geometry === 'square')) &&
            (b.id !== a.id)
           );
};

var collision = function() {
    var sweeping = [];
    var possibleXs = [];
    var moves = [];
    world.getXs().forEach(function(x) {
        if (x.type === 'b') {
            sweeping.forEach(function(swept) {
                possibleXs.push([x.obj, swept]);
            });
            sweeping.push(x.obj);
        }
        if (x.type === 'e') {
            sweeping = sweeping.filter(function(swept) {
                if (swept.id !== x.obj.id) return true;
            });
        }
    });

    possibleXs = possibleXs.filter(function(pair) {
        return prune(pair[0], pair[1]);
    });

    possibleXs.forEach(function(pair) {
        pair[0].detectCollide(pair[1]);
    });

};

api = {
    step: function() {
        collision();
    }
};

module.exports = api;

/*
 *
                    if ((collider.type === 'zombie' && collidee.type === 'human') || (collidee.type === 'zombie' && collider.type === 'human')) {
                        if (collider.type === 'zombie') {
                            zombie = collider;
                            human = collidee;
                        } else {
                            zombie = collidee;
                            human = collider;
                        }

                        oclude = world.filter(function(curr) {
                            if (curr.type === 'block') return true;
                            return false;
                        }).reduce(function(prev, curr) { 
                            if (prev) return true;
                            return curr.oclude(collider.pos, collidee.pos);
                        }, false);

                        if (zombie.target === human && oclude && dis > 1000) {
                            zombie.addMode('searching');
                        } else {
                        
                            ang2 = Math.abs(Math.atan2(human.pos.y - zombie.pos.y, human.pos.x - zombie.pos.x));

                            ang =  zombie.pos.rot - ang2;
                            if (!oclude && (Math.abs(ang) < Math.PI * 0.45 || dis < 500)) {
                                zombie.addMode('chasing');
                                zombie.target = human;
                            }
                        }
                    }

                if ((collider.geometry === 'block' && collidee.geometry === 'circle') || (collider.geometry === 'circle' && collidee.geometry === 'block')) {
                    if (collider.geometry === 'block') {
                        block = collider;
                        circle = collidee;
                    }
                    if (collidee.geometry === 'block') {
                        block = collidee;
                        circle = collider;
                    }

                    if (circle.type !== 'goal') {
                        point = block.testPoint(circle.pos);
                        if (point) {
                            if (circle.type === 'clickObj') circle.addObj(block);
                            if (circle.type === 'clickMenu') circle.addObj(block);
                            if (circle.type === 'bullet' && block.type === 'block') circle.die = true;
                            if (block.type === 'sensor' && circle.type === 'activation') block.collision.activation();
                            if (block.solid) {
                                circle.pos.x = point.x;
                                circle.pos.y = point.y;
                            }
                        }
                    }

                }
                    */



},{"./world.js":33}],8:[function(require,module,exports){
var getId = require('./getId.js').getId;
//var state = require('./state.js');
var events = require('./events.js');
var dom = require('./dom.js');
var player;
var leftJoystick = false;
var rightJoystick = false;
var ongoingTouches = [];
var touchPadWidth; 
dom.onload(function() { touchPadWidth = dom.getObjById('canvas').clientWidth; });

var api = {
    connectPlayer: function(p) {
        player = p;
    }
};

dom.attachEvent('newGame', 'click', events.emit.bind(null, 'newGame'));
dom.attachEvent('okayStats', 'click', events.emit.bind(null, 'mainMenu'));
dom.attachEvent('resumeGame', 'click', events.emit.bind(null, 'start'));
dom.attachEvent('pauseGame', 'click', events.emit.bind(null, 'pause'));
dom.attachEvent('pauseGame', 'touchstart', events.emit.bind(null, 'pause'));
dom.attachEvent('quitGame', 'click', events.emit.bind(null, 'gameOver'));
dom.attachEvent('nextWeapon', 'click', function() {
    if (player) player.nextWeapon();
});

var newTouch = function(touch) {
    if (touch.pageX < touchPadWidth / 2 && !leftJoystick) {
        leftJoystick = {
            touch: touch,
            origen: {
                x: touch.pageX,
                y: touch.pageY
            },
            delta: {
                x: 0,
                y: 0
            }
        };
    }
    if (touch.pageX >= touchPadWidth / 2 && !rightJoystick) {
        rightJoystick = {
            touch: touch,
            origen: {
                x: touch.pageX,
                y: touch.pageY
            },
            delta: {
                x: 0,
                y: 0
            }
        };
    }
};

var updateTouch = function(touch) {
    var joystick;
    if (leftJoystick && touch.identifier === leftJoystick.touch.identifier) {
        joystick = leftJoystick;
    }
    if (rightJoystick && touch.identifier === rightJoystick.touch.identifier) {
        joystick = rightJoystick;
    }
    if (!joystick) return;
    joystick.delta.y = joystick.origen.y - touch.pageY;
    joystick.delta.x = joystick.origen.x - touch.pageX;
};

var endTouch = function(touch) {
    var joystick;
    if (leftJoystick && touch.identifier === leftJoystick.touch.identifier) {
        leftJoystick = false;
    }
    if (rightJoystick && touch.identifier === rightJoystick.touch.identifier) {
        rightJoystick = false;
    }
};

dom.attachEvent('gameView', 'touchstart', function(evt) {
    evt.preventDefault();
    var touches = evt.changedTouches;
    for (var i = 0; i < touches.length; i++) {
        newTouch(touches[i]);
    }

});

dom.attachEvent('gameView', 'touchmove', function(evt) {
    evt.preventDefault();
    var touches = evt.changedTouches;
    for (var i = 0; i < touches.length; i++) {
        updateTouch(touches[i]);
    }

});

dom.attachEvent('gameView', 'touchend', function(evt) {
    evt.preventDefault();
    var touches = evt.changedTouches;
    for (var i = 0; i < touches.length; i++) {
        endTouch(touches[i]);
    }

});


events.register('animate', function() {
    var theta, x, y, pos;
    if (!player) return;
    if (leftJoystick ) {
        y = leftJoystick.delta.y;
        x = leftJoystick.delta.x;
        player.lookAtVec({x: x, y: y});
        player.push({x: -x / 50, y: -y / 50});
    }
    if (rightJoystick ) {
        y = rightJoystick.delta.y;
        x = rightJoystick.delta.x;
        player.lookAtVec({x: x, y: y});
        player.addMode('shooting');
    }
    if (!rightJoystick ) player.addMode('running');
    if (!leftJoystick && !rightJoystick ) player.addMode('standing');
    dom.updateWeaponIcons(player.currentWeapons);

}, getId());


module.exports = api;

},{"./dom.js":9,"./events.js":11,"./getId.js":13}],9:[function(require,module,exports){
var loaded = false;
var events = require('./events.js');
var getId = require('./getId.js').getId;
var effects = require('./effects.js');
var objs = {};
window.functions = {};
var loadEvents = [];
var oldWeapons = [];
var iconEvents = [];
var weaponIcons = [];


window.onload = function() { 
    [].slice.call(document.getElementsByClassName('domobj')).forEach(function(obj, index, array) { 
        objs[obj.id] = obj; 
        if (index === array.length - 1) {
            loadEvents.forEach(function(ev) { ev(); }); 
            loaded = true; 
        }
    });
};

var api = {
    onload: function(ev) {
        if (loaded) return ev();
        loadEvents.push(ev);
    },
    attachEvent: function(id, type, func) {
        var fid = getId();
        functions[fid] = {f: func, id: id};
        api.onload(function() { 
            objs[id].addEventListener(type, func); 
        });
        return fid;
    },
    detachEvent: function(fid) {
        objs[functions[fid].id].removeEventListener(functions[fid].f);
        delete functions[fid];
    },
    display: function(id) {
        [].slice.call(document.getElementsByClassName('slides')).forEach(function(obj) { effects.fadeOut(obj); });
        effects.fadeIn(objs[id]);
    },
    getObjById: function(id) {
        return objs[id];
    },
    updateWeaponIcons: function(weapons) {
        var changed;
        if (weapons) {
            weapons.forEach(function(weapon) {
                if (weapons.type !== oldWeapons.type) changed = true;
            });
            if (changed) {
                oldWeapons = weapons;
                weaponIcons.forEach(function(icon) {
                    weaponIcons[index].style.backgroundImage = '';
                });
                iconEvents.forEach(function(ev) {
                    ev.dom.removeEventListener(ev.func);
                });
                weapons.forEach(function(weapon, index) {
                    var click = function() {
                        weapon.selectWeapon = true;
                    };
                    weaponIcons[index].style.backgroundImage = weapon.icon;
                    iconEvents.push({dom: weaponIcons[index], func: click});
                    weaponIcons.addEventListener('click', click);
                });
            }
        }
    }
};

api.onload(function() {

});

for (var i = 0; i < 4; i++) {
    weaponIcons.push(document.createElement('li'));
    weaponIcons[i].className = 'weaponicon';
    (function() { 
        var j = i;
        api.onload(function() { 
            objs['weaponOptions'].appendChild(weaponIcons[j]); 
        });
    })();
}
module.exports = api;

},{"./effects.js":10,"./events.js":11,"./getId.js":13}],10:[function(require,module,exports){
module.exports = {
    fadeIn: function(obj) {
        obj.style.opacity = 1;
        obj.style.zIndex = 3;
    },
    fadeOut: function(obj) {
        obj.style.opacity = 0;
        obj.style.zIndex = 1;
    }
};

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
var Entities = {};

Entities['Player'] = require('./Player.js');
Entities['test'] = require('./test-obj.js');
Entities['gun'] = require('./gun.js');
Entities['square'] = require('./square.js');
Entities['spawner'] = require('./spawner.js');
Entities['zombie'] = require('./Zombie.js');
Entities['wall'] = require('./wall.js');
//Entities['door'] = require('./Door.js');
//Entities['sensor'] = require('./Sensor.js');

module.exports = Entities;

},{"./Player.js":1,"./Zombie.js":2,"./gun.js":14,"./spawner.js":24,"./square.js":26,"./test-obj.js":28,"./wall.js":30}],13:[function(require,module,exports){
var lastId = 0;

var api = {
    getId: function() {
        return lastId++;
    }
};

module.exports = api;

},{}],14:[function(require,module,exports){
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




},{"./bullet.js":5,"./makeInventory.js":18,"./weapon.js":31}],15:[function(require,module,exports){
module.exports = [

    {entity: 'Player', pos: {x: 1000, y: 1000, rot: 0}},
    //{entity: 'zombie', pos: {x: 300, y: 300, rot: 0}},
    //{entity: 'zombie', pos: {x: 300, y: 300, rot: 0}},
    {entity: 'gun', pos:{x: 1000, y: 1000, rot: 0}, ammoProps: {}, startAmmo: 100},
    {entity: 'spawner', pos:{x: 1000, y: 100, rot: 0}, start: true, interval: 10000, spawnCount: 4},
    //{entity: 'wall', pos: {x: 0, y: -1250, rot: 0}, dim: {w: 100, h: 2500}},
    {entity: 'wall', pos: {x: 1250, y: 700, rot: 0}, dim: {w: 2500, h: 100}}
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



},{}],16:[function(require,module,exports){
require('./animationShim.js');
window.logging = [];
var events = require('./events.js');
var dom = require('./dom.js');
var renderer = require('./renderer.js');
window.world = require('./world.js');
var collision = require('./collision.js');
var getId = require('./getId.js').getId;
var controller = require('./controller.js');

dom.onload(function() {

    var currentGameId = getId();
    var player;

    var states = {
        mainMenu: function() {
            world.loadLevel('game');
            dom.display('mainMenu');
        },
        startGame: function() {
            player = world.getItemsByType('player')[0];
            controller.connectPlayer(player);
            renderer.connectPlayer(player);
            states.playingGame();
        },
        playingGame: function() {
            dom.display('gameView');
            events.register('animate', function() {
                world.step();
                collision.step();
                renderer.step();
            }, currentGameId);
        },
        viewingStats: function() {
            states.pausedGame();
            dom.display('stats');
        },
        pausedGame: function() {
            dom.display('pauseMenu');
            events.unregister(currentGameId);
            currentGameId = getId();
        }
    };

    
    events.register('newGame', states.startGame, getId());
    events.register('start', states.playingGame, getId());

    events.register('pause', states.pausedGame, getId());

    events.register('gameOver', states.viewingStats, getId());
    events.register('mainMenu', states.mainMenu, getId());
    states.mainMenu();

});







},{"./animationShim.js":3,"./collision.js":7,"./controller.js":8,"./dom.js":9,"./events.js":11,"./getId.js":13,"./renderer.js":23,"./world.js":33}],17:[function(require,module,exports){
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
        obj.move({ev: setAABB.bind(null, obj)});
        setAABB(obj);
    }
    if (type === 'square') {
        obj.width = 0;
        obj.height = 0;
        obj.setDimensions = function(dim) {
            if (dim.w) obj.width = dim.w;
            if (dim.h) obj.height = dim.h;
            setVerts(obj);
        }
        obj.move({ev: setVerts.bind(null, obj)});
        setVerts(obj);
    }
};

},{}],18:[function(require,module,exports){

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


},{}],19:[function(require,module,exports){
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
        p = perpPoint(vertices, point);
        x = p.x - circle.pos.x;
        y = p.y - circle.pos.y;
        if (x > 30 || y > 30) {
            //debugger;
        }
        logging.push({p: p, x: x, y: y, vertices: vertices, point: {x: point.x, y: point.y, vec: {x: point.vec.x, y: point.vec.y}}});
        circle.addEffect(function() { 
            circle.push({x: x, y: y}); 
        });
        circle.collide(square);
        square.collide(circle);
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
};

module.exports = function(obj) {
    obj.solid = true;
    if (obj.geometry === 'circle') {
        obj.detectCollide = function(collider) {
            if (collider.geometry === 'circle') circleDetect(obj, collider);
            if (collider.geometry === 'square') pointInPolygon(collider, obj);
        };
    }
    if (obj.geometry === 'square') {
        obj.detectCollide = function(collider) {
            if (collider.geometry === 'square') return false;
            if (collider.geometry === 'circle') pointInPolygon(obj, collider);
        };
    }
};

},{}],20:[function(require,module,exports){
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

},{"./textureData.js":29}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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


},{"./baseEntity.js":4,"./makeGeometry.js":17,"./makeVisible.js":20}],23:[function(require,module,exports){
var events = require('events');
var gl = require('./webgl.js');
var World = require('./world.js');
//var audio = require('./audio.js');
var currentLevel;
var pov;
var screenDim = gl.screenDimensions;

var step = function() {

    gl.clear();
    var world = World.getItems();
    //if (pov) audio.updatePov(pov.pos);
    world.forEach(function(item) { 
        var width, height, sx, sy, i, sw, sh, pattern;
        if (item.audio) {
            audio[item.type][item.audio](item.pos);
            item.audio = null;
        }
        if (item.visible) {
            if (item.textureData.poses) {
                sw = item.textureData.frame.w / item.textureData.poses.x;
                sh = item.textureData.frame.h / item.textureData.poses.y;
                sx = item.textureData.frame.x + sw * item.pose.x;
                sy = item.textureData.frame.y + sh * item.pose.y;

            }  else {
                sx = item.textureData.frame.x
                sy = item.textureData.frame.y
                sw = item.textureData.frame.w;
                sh = item.textureData.frame.h;
            }
            if (item.geometry === 'square') { 
                width = item.width;
                height = item.height;
            }
            if (item.geometry === 'circle') { 
                width = sw;
                height = sh;
            }
            gl.matrix.restore(); 

            //gl.matrixStack.globalAlpha = item.opacity || 1;
            gl.matrix.translate( (item.pos.x + (screenDim.x / 2 - pov.x)), (item.pos.y + (screenDim.y / 2 - pov.y)));
            gl.matrix.rotateZ(item.pos.rot);
            gl.drawImg(sx, sy, sw, sh, - width / 2, - height / 2, width, height);

        }
    });

};

var api = {
    step: function() {
        if (pov) step();
    },
    connectPlayer: function(player) {
        pov = player.pos;
    }
};


module.exports = api;

},{"./webgl.js":32,"./world.js":33,"events":34}],24:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var zombie = require('./Zombie.js');
//var world = require('./world.js');

module.exports = function(options) {
    var spawner = baseEntity();
    var timer = Date.now();
    var spawning = options.start;
    var spawnCount = options.spawnCount;
    var lastSpawn = Date.now();
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


},{"./Zombie.js":2,"./baseEntity.js":4}],25:[function(require,module,exports){
module.exports = {"frames":{"bullet":{"frame":{"x":453,"y":922,"w":201,"h":46},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":201,"h":46},"sourceSize":{"w":201,"h":46}},"machinegun":{"frame":{"x":0,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"pistol":{"frame":{"x":151,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"player":{"frame":{"x":0,"y":0,"w":1500,"h":280},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":280},"sourceSize":{"w":1500,"h":280}},"shotgun":{"frame":{"x":302,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"wall":{"frame":{"x":453,"y":969,"w":100,"h":100},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":100,"h":100},"sourceSize":{"w":100,"h":100}},"zombie1":{"frame":{"x":0,"y":1760,"w":1500,"h":560},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":560},"sourceSize":{"w":1500,"h":560}},"zombie2":{"frame":{"x":0,"y":281,"w":1500,"h":640},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":640},"sourceSize":{"w":1500,"h":640}},"zombie3":{"frame":{"x":0,"y":1634,"w":1500,"h":686},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":686},"sourceSize":{"w":1500,"h":686}}},"meta":{"app":"https://www.leshylabs.com/apps/sstool/","version":"Leshy SpriteSheet Tool v0.8.4","image":"spritesheet.png","size":{"w":1500,"h":2320},"scale":1}};

},{}],26:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var makeVisible = require('./makeVisible.js');
var makeGeometry = require('./makeGeometry.js');

module.exports = function(options) {
    var square = baseEntity();
    makeVisible(square);
    makeGeometry(square, 'square');
    square.setDimensions(options.dim);
    square.move(options.pos);
    square.base = 'square';
    square.type = 'tile';
    square.collide = function() {};

    return square;
};

},{"./baseEntity.js":4,"./makeGeometry.js":17,"./makeVisible.js":20}],27:[function(require,module,exports){
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



},{}],28:[function(require,module,exports){
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


},{"./baseEntity.js":4,"./makeGeometry.js":17,"./makeSolid.js":19}],29:[function(require,module,exports){
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
        }
    },
    weapon: {
        gun: {
            frame: sprites.frames.pistol.frame
        }
    }
};

},{"./sprites.js":25}],30:[function(require,module,exports){
var square = require('./square.js');
var makeSolid = require('./makeSolid.js');

module.exports = function(options) {
    wall = square(options);
    wall.onTop = true;
    makeSolid(wall);
    wall.type = 'wall';

    return wall;
};

},{"./makeSolid.js":19,"./square.js":26}],31:[function(require,module,exports){
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

},{"./baseEntity.js":4,"./makeGeometry.js":17,"./makeInventory.js":18,"./makeSolid.js":19,"./makeVisible.js":20}],32:[function(require,module,exports){
"use strict";

var canvas = document.getElementById('canvas');
var screen = {};
screen.width = 2000;
screen.height = 2000 / canvas.clientWidth * canvas.clientHeight;

var matrixStack = require('./matrixStack.js');
matrixStack = new matrixStack();

// Get A WebGL context
/** @type {HTMLCanvasElement} */
canvas.setAttribute('width', screen.width);
canvas.setAttribute('height', screen.height);
var gl = canvas.getContext('webgl');
if (!gl) {
    return;
}

// setup GLSL program
var program = webglUtils.createProgramFromScripts(gl, ["drawImage-vertex-shader", "drawImage-fragment-shader"]);

// look up where the vertex data needs to go.
var positionLocation = gl.getAttribLocation(program, "a_position");
var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

// lookup uniforms
var matrixLocation = gl.getUniformLocation(program, "u_matrix");
var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");
var textureLocation = gl.getUniformLocation(program, "u_texture");

// Create a buffer.
var positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Put a unit quad in the buffer
var positions = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
]
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
    1, 1,
]
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

    // let's assume all images are not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

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
    });
    img.src = url;

    return textureInfo;
}

var texture = loadImageAndCreateTextureInfo('./img/spritesheet.png');


// Unlike images, textures do not have a width and height associated
// with them so we'll pass in the width and height of the texture
function drawImage(
        srcX, srcY, srcWidth, srcHeight,
        dstX, dstY, dstWidth, dstHeight
        ) {
    var srcRotation = 0;
    if (dstX === undefined) {
        dstX = srcX;
        srcX = 0;
    }
    if (dstY === undefined) {
        dstY = srcY;
        srcY = 0;
    }
    if (srcWidth === undefined) {
        srcWidth = texture.width;
    }
    if (srcHeight === undefined) {
        srcHeight = texture.height;
    }
    if (dstWidth === undefined) {
        dstWidth = srcWidth;
        srcWidth = texture.width;
    }
    if (dstHeight === undefined) {
        dstHeight = srcHeight;
        srcHeight = texture.height;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture.texture);

    // Tell WebGL to use our shader program pair
    gl.useProgram(program);

    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // this matirx will convert from pixels to clip space
    var matrix = m4.orthographic(0, screen.width, screen.height, 0, -1, 1);

    // this matrix moves the origin to the one represented by
    // the current matrix stack.
    matrix = m4.multiply(matrix, matrixStack.getCurrentMatrix());

    matrix = m4.translate(matrix, dstX, dstY, 0);

    // this matrix will scale our 1 unit quad
    // from 1 unit to texture.width, texture.height units
    matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // just like a 2d projection matrix except in texture space (0 to 1)
    // instead of clip space. This matrix puts us in pixel space.
    var texMatrix = m4.scaling(1 / texture.width, 1 / texture.height, 1);

    // We need to pick a place to rotate around
    // We'll move to the middle, rotate, then move back
    var texMatrix = m4.translate(texMatrix, (srcX + srcWidth * 0.5), (srcY + srcHeight * 0.5), 0);
    var texMatrix = m4.zRotate(texMatrix, srcRotation);
    var texMatrix = m4.translate(texMatrix, -(srcX + srcWidth * 0.5), -(srcY + srcHeight * 0.5), 0);

    // because were in pixel space
    // the scale and translation are now in pixels
    var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

    // Set the texture matrix.
    gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(textureLocation, 0);

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

module.exports = {
    drawImg: drawImage,
    clear: function() {
        gl.viewport(0, 0, screen.width, screen.height);

        gl.clear(gl.COLOR_BUFFER_BIT);
    },
    matrix: matrixStack,
    screenDimensions: {
        x: screen.width,
        y: screen.height
    }
};

},{"./matrixStack.js":21}],33:[function(require,module,exports){
var events = require('events');
var level = {};
level.game = require('./level.js');
level.test = require('./test-level.js');
var Entities = require('./getEntities.js');
var circles = [];
var squares = [];
var points = [];
var xs = [];

var get = function(url, callback) {
    var http = new XMLHttpRequest();

    http.open('GET', url, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        var data;
        if((http.readyState === 4) && http.status === 200) {
            data = JSON.parse(http.responseText);
            callback(data)
        }
    };
    http.send();

};

var world = [];
var newItems = [];

var api = {
    unloadWorld: function() {
        world.forEach(function(item) {
            item.unload();
        });
    },
    loadLevel: function(levelId) {
        api.unloadWorld();
        //get('./levels/' + level, api.loadItems);
        api.loadItems(level[levelId]);
        api.step();
    },
    loadItems: function(items) {
        
        if (!Array.isArray(items)) {
            items = [items];
        }

        items = items.map(function(item) {
            var entity = item;
            if (!entity.type) entity = Entities[item.entity](item);
            entity.load();
            return entity;
        });
        newItems = newItems.concat(items);
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
    },
    getXs: function() {
        return xs;
    },
    step: function() {
        world = world.concat(newItems);
        xs = [];
        ys = [];
        newItems = [];
        circles = [];
        squares = [];
        points = [];
        world.forEach(function(item) { 
            if (item.geometry === 'circle' && item.solid) circles.push(item);
            if (item.geometry === 'square' && item.solid) squares.push(item);
            if (item.geometry === 'point' && item.solid) points.push(item);
            item.collisionData = {};
            item.step.call(item); 
            if (item.geometry && item.solid && !item.inContainer()) xs = xs.concat(item.AABB.xs);
        });
        world.sort(function(a, b) {
            return a.onTop;
        });
        xs.sort(function(a, b) {
            return (a.val > b.val);
        });
    },
    getGeometry(geometry) {
        if (geometry === 'circle') return circles;
        if (geometry === 'square') return squares;
        if (geometry === 'point') return points;
    }
};

module.exports = api;

},{"./getEntities.js":12,"./level.js":15,"./test-level.js":27,"events":34}],34:[function(require,module,exports){
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

},{}]},{},[16])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIlBsYXllci5qcyIsIlpvbWJpZS5qcyIsImFuaW1hdGlvblNoaW0uanMiLCJiYXNlRW50aXR5LmpzIiwiYnVsbGV0LmpzIiwiY2hhcmFjdGVyLmpzIiwiY29sbGlzaW9uLmpzIiwiY29udHJvbGxlci5qcyIsImRvbS5qcyIsImVmZmVjdHMuanMiLCJldmVudHMuanMiLCJnZXRFbnRpdGllcy5qcyIsImdldElkLmpzIiwiZ3VuLmpzIiwibGV2ZWwuanMiLCJtYWluLmpzIiwibWFrZUdlb21ldHJ5LmpzIiwibWFrZUludmVudG9yeS5qcyIsIm1ha2VTb2xpZC5qcyIsIm1ha2VWaXNpYmxlLmpzIiwibWF0cml4U3RhY2suanMiLCJwcm9qZWN0aWxlLmpzIiwicmVuZGVyZXIuanMiLCJzcGF3bmVyLmpzIiwic3ByaXRlcy5qcyIsInNxdWFyZS5qcyIsInRlc3QtbGV2ZWwuanMiLCJ0ZXN0LW9iai5qcyIsInRleHR1cmVEYXRhLmpzIiwid2FsbC5qcyIsIndlYXBvbi5qcyIsIndlYmdsLmpzIiwid29ybGQuanMiLCIuLi8uLi8uLi8uLi91c3IvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBDaGFyYWN0ZXIgPSByZXF1aXJlKCcuL2NoYXJhY3Rlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgIHZhciBwbGF5ZXIgPSBDaGFyYWN0ZXIoe1xuICAgICAgICBwb3M6IG9wdGlvbnMucG9zLFxuICAgICAgICB0eXBlOiAncGxheWVyJyxcbiAgICAgICAgbW9kZTogJ3N0YW5kaW5nJyxcbiAgICAgICAgbW9kZXM6IHtcbiAgICAgICAgICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmVtaXQoJ2RpZScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YW5kaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9zZS55ID0gMDtcbiAgICAgICAgICAgICAgICBwbGF5ZXIudmVsb2NpdHkgPSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2Fsa2luZzogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG9vdGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnBvc2UueSA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHBsYXllci5jdXJyZW50V2VhcG9ucy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICAgICAgICAgICAgICB2YXIgY29vbERvd24gPSBwbGF5ZXIuY3VycmVudFdlYXBvbnNbcGxheWVyLndlaWxkaW5nXS5jb29sRG93bjtcbiAgICAgICAgICAgICAgICB2YXIgdGljayA9IGNvb2xEb3duIC0gMTtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuYWRkRWZmZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGxheWVyLmN1cnJlbnRNb2RlICE9PSAnc2hvb3RpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRpY2srKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpY2sgPiBjb29sRG93bikgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllci5jdXJyZW50V2VhcG9uc1twbGF5ZXIud2VpbGRpbmddLnVzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29sbGlkZTogZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIuYmFzZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3dlYXBvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmICghY29sbGlkZXIuaW5Db250YWluZXIoKSkgcGxheWVyLnRha2VJdGVtcyhjb2xsaWRlcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3pvbWJpZSc6XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5lbWl0KCdnYW1lT3ZlcicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZ2FtZW92ZXJycnJycicpO1xuICAgICAgICAgICAgICAgICAgICAvL3BsYXllci5oZWFsdGggLT0gMC40O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH0pO1xuICAgIHBsYXllci5uZXh0V2VhcG9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHBsYXllci53ZWlsZGluZysrO1xuICAgICAgICBpZiAod2VpbGRpbmcgPT09IHBsYXllci5jdXJyZW50V2VhcG9ucy5sZW5ndGgpIHdlaWxkaW5nID0gMDtcbiAgICB9O1xuICAgIHBsYXllci53ZWlsZGluZyA9IDA7XG4gICAgcGxheWVyLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmN1cnJlbnRXZWFwb25zID0gcGxheWVyLmdldEludmVudG9yeUJ5QmFzZSgnd2VhcG9uJyk7XG4gICAgICAgIHBsYXllci5jdXJyZW50V2VhcG9ucy5mb3JFYWNoKGZ1bmN0aW9uKHdlYXBvbiwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICh3ZWFwb24uc2VsZWN0V2VhcG9uKSBwbGF5ZXIud2VpbGRpbmcgPSBpbmRleDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG5cbiAgICByZXR1cm4gcGxheWVyO1xufTtcbiIsInZhciBDaGFyYWN0ZXIgPSByZXF1aXJlKCcuL2NoYXJhY3Rlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgIHZhciBjdXJyZW50QXR0cmFjdG9yID0gZmFsc2U7XG4gICAgdmFyIHNwZWVkID0gMSArIE1hdGgucmFuZG9tKCkgKiAzO1xuXG4gICAgdmFyIHpvbWJpZSA9IENoYXJhY3Rlcih7XG4gICAgICAgIHR5cGU6ICd6b21iaWUnLFxuICAgICAgICBtb2RlOiAnd2FuZGVyaW5nJyxcbiAgICAgICAgcG9zOiBvcHRpb25zLnBvcyxcbiAgICAgICAgbW9kZXM6IHtcbiAgICAgICAgICAgIHJld2FuZGVyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnd2FuZGVyaW5nJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2FuZGVyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd3YW5kZXJpbmcnKTtcbiAgICAgICAgICAgICAgICAvL2lmIChNYXRoLnJhbmRvbSgpIDwgMC4wNSkgem9tYmllLmF1ZGlvID0gJ2dyb3dsJztcbiAgICAgICAgICAgICAgICB2YXIgdGltZUxlbmd0aCA9IDEgKyBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMyAqIDEwMDApO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21TcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAyO1xuICAgICAgICAgICAgICAgIHpvbWJpZS5wb3Mucm90ID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgICAgIHpvbWJpZS5wb3NlLnkgPSAxO1xuXG4gICAgICAgICAgICAgICAgem9tYmllLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh6b21iaWUuY3VycmVudE1vZGUgIT09ICd3YW5kZXJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VGltZSArIHRpbWVMZW5ndGggPCBub3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRNb2RlKCdyZXdhbmRlcmluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB6b21iaWUucHVzaCh7eDogTWF0aC5jb3Moem9tYmllLnBvcy5yb3QpICogcmFuZG9tU3BlZWQsIHk6IE1hdGguc2luKHpvbWJpZS5wb3Mucm90KSAqIHJhbmRvbVNwZWVkfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlYXJjaGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hhc2luZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgem9tYmllLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gem9tYmllLmxvb2tBdE9iaihjdXJyZW50QXR0cmFjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHpvbWJpZS5jdXJyZW50TW9kZSAhPT0gJ2NoYXNpbmcnIHx8ICFjdXJyZW50QXR0cmFjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgem9tYmllLnB1c2goe3g6IE1hdGguY29zKHRoZXRhKSAqIHNwZWVkIC8gMiwgeTogTWF0aC5zaW4odGhldGEpICogc3BlZWQgLyAyfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJpdGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhZ2dlcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB6b21iaWUudW5sb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbGxpZGU6IGZ1bmN0aW9uKGNvbGxpZGVyKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbGxpZGVyLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdidWxsZXQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ21lZWxlZSc6XG4gICAgICAgICAgICAgICAgICAgIHpvbWJpZS5oZWFsdGggLT0gY29sbGlkZXIucG93ZXIgLyAxMDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB6b21iaWUuc3RlcChmdW5jdGlvbigpIHtcbiAgICAgICAgY3VycmVudEF0dHJhY3RvciA9IHdvcmxkLmdldEl0ZW1zQnlUeXBlKCdwbGF5ZXInKVswXTtcbiAgICAgICAgaWYgKGN1cnJlbnRBdHRyYWN0b3IpIHtcbiAgICAgICAgICAgIHpvbWJpZS5hZGRNb2RlKCdjaGFzaW5nJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnd2FuZGVyaW5nJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB6b21iaWU7XG59O1xuIiwiKGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgdmFyIHZlbmRvcnMgPSBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddO1xuICAgIGZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxBbmltYXRpb25GcmFtZSddIFxuICAgICAgICAgICAgfHwgd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgIH1cblxuICAgIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSlcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuICAgICAgICAgICAgdmFyIGlkID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7IH0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZVRvQ2FsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSlcbiAgICAgICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICAgICAgICAgIH07XG59KCkpO1xuIiwidmFyIGdldElkID0gcmVxdWlyZSgnLi9nZXRJZC5qcycpLmdldElkO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHB1c2hFdmVudHMgPSBbXTtcbiAgICB2YXIgbW92ZUV2ZW50cyA9IFtdO1xuICAgIHZhciBsb2FkRXZlbnRzID0gW107XG4gICAgdmFyIHVubG9hZEV2ZW50cyA9IFtdO1xuICAgIHZhciBzdGVwRXZlbnRzID0gW107XG4gICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xuICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuICAgIHZhciBuZXdFZmZlY3RzID0gW107XG4gICAgdmFyIGVmZmVjdHMgPSBbXTtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgICBpbkNvbnRhaW5lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKCEhb2JqLm93bmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmIChsb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHsgZSgpOyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2FkRXZlbnRzID0gYXJncy5jb25jYXQobG9hZEV2ZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgbG9hZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHsgZSgpOyB9KTtcbiAgICAgICAgICAgICAgICBsb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB1bmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPiAwKSByZXR1cm4gdW5sb2FkRXZlbnRzID0gYXJncy5jb25jYXQodW5sb2FkRXZlbnRzKTtcbiAgICAgICAgICAgIHVubG9hZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHsgZSgpOyB9KTtcbiAgICAgICAgICAgIHdvcmxkLmRlbGV0ZUl0ZW0ob2JqLmlkKTtcbiAgICAgICAgICAgIGlmIChvYmoub3duZXIpIG9iai5vd25lci5kcm9wSXRlbShvYmopO1xuICAgICAgICB9LFxuICAgICAgICBzdGVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gMCkgcmV0dXJuIHN0ZXBFdmVudHMgPSBhcmdzLmNvbmNhdChzdGVwRXZlbnRzKTtcbiAgICAgICAgICAgIHN0ZXBFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlKSB7IGUoKTsgfSk7XG4gICAgICAgICAgICBlZmZlY3RzID0gZWZmZWN0cy5jb25jYXQobmV3RWZmZWN0cyk7XG4gICAgICAgICAgICBuZXdFZmZlY3RzID0gW107XG4gICAgICAgICAgICBlZmZlY3RzID0gZWZmZWN0cy5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5jYWxsKG9iaik7IH0pO1xuICAgICAgICAgICAgb2JqLnZlbG9jaXR5ID0gTWF0aC5zcXJ0KG9iai5wb3MudmVjLnggKiBvYmoucG9zLnZlYy54ICsgb2JqLnBvcy52ZWMueSAqIG9iai5wb3MudmVjLnkpO1xuICAgICAgICAgICAgaWYgKG9iai52ZWxvY2l0eSA+IDMwKSB7XG4gICAgICAgICAgICAgICAgLy9kZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgICBvYmoucG9zLnZlYy54ID0gb2JqLnBvcy52ZWMueCAvIChvYmoudmVsb2NpdHkgLyAzMCk7XG4gICAgICAgICAgICAgICAgb2JqLnBvcy52ZWMueSA9IG9iai5wb3MudmVjLnkgLyAob2JqLnZlbG9jaXR5IC8gMzApO1xuICAgICAgICAgICAgICAgIG9iai52ZWxvY2l0eSA9IDMwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqLnBvcy54ICs9IG9iai5wb3MudmVjLng7XG4gICAgICAgICAgICBvYmoucG9zLnkgKz0gb2JqLnBvcy52ZWMueTtcbiAgICAgICAgICAgIGlmIChvYmoub3duZXIpIHtcbiAgICAgICAgICAgICAgICBvYmoubW92ZShvYmoub3duZXIucG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvYmoubW92ZWQpIG1vdmVFdmVudHMuZm9yRWFjaChmdW5jdGlvbihmbikgeyBmbigpOyB9KTtcbiAgICAgICAgICAgIG9iai5tb3ZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgb2JqLnBvcy52ZWMueCA9IDA7XG4gICAgICAgICAgICBvYmoucG9zLnZlYy55ID0gMDtcbiAgICAgICAgICAgIGlmIChvYmoucG9zLnJvdCA+IE1hdGguUEkgKiAyKSBvYmoucG9zLnJvdCAtPSBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIGlmIChvYmoucG9zLnJvdCA8IDApIG9iai5wb3Mucm90ICs9IE1hdGguUEkgKiAyO1xuXG4gICAgICAgIH0sXG4gICAgICAgIGlkOiBnZXRJZCgpLFxuICAgICAgICBwb3M6IHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgcm90OiAwLFxuICAgICAgICAgICAgdmVjOiB7XG4gICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICB5OiAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vdmU6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICAgICAgaWYgKHBvcy5ldikge1xuICAgICAgICAgICAgICAgIG1vdmVFdmVudHMucHVzaChwb3MuZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBvcy54KSBvYmoucG9zLnggPSBwb3MueDtcbiAgICAgICAgICAgIGlmIChwb3MueSkgb2JqLnBvcy55ID0gcG9zLnk7XG4gICAgICAgICAgICBpZiAocG9zLnJvdCkgb2JqLnBvcy5yb3QgPSBwb3Mucm90O1xuICAgICAgICAgICAgb2JqLm1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgcHVzaDogZnVuY3Rpb24odmVjKSB7XG4gICAgICAgICAgICBpZiAodmVjLmV2KSB7XG4gICAgICAgICAgICAgICAgbW92ZUV2ZW50cy5wdXNoKHZlYy5ldik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmVjLngpIG9iai5wb3MudmVjLnggKz0gdmVjLng7XG4gICAgICAgICAgICBpZiAodmVjLnkpIG9iai5wb3MudmVjLnkgKz0gdmVjLnk7XG4gICAgICAgICAgICBvYmoubW92ZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBhZGRFZmZlY3Q6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICBuZXdFZmZlY3RzLnB1c2goZm4pO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbiIsInZhciBwcm9qZWN0aWxlID0gcmVxdWlyZSgnLi9wcm9qZWN0aWxlLmpzJyk7XG52YXIgbWFrZVNvbGlkID0gcmVxdWlyZSgnLi9tYWtlU29saWQuanMnKTtcblxudmFyIEJ1bGxldCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgIHZhciBidWxsZXQgPSBwcm9qZWN0aWxlKCk7XG5cbiAgICBidWxsZXQuZmlyZSA9IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSAwO1xuICAgICAgICB2YXIgdGhldGEgPSBwb3Mucm90O1xuICAgICAgICBidWxsZXQuaW5lcnRpYSA9IHRydWU7XG4gICAgICAgIGJ1bGxldC5wb3Mucm90ID0gcG9zLnJvdDtcbiAgICAgICAgYnVsbGV0Lm9uVG9wID0gdHJ1ZTtcbiAgICAgICAgYnVsbGV0LnZlbG9jaXR5ID0gMjU7XG4gICAgICAgIG1ha2VTb2xpZChidWxsZXQpO1xuICAgICAgICBidWxsZXQuc3RlcChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChidWxsZXQuZGllIHx8IGRpc3RhbmNlID4gYnVsbGV0LnJhbmdlKSBidWxsZXQudW5sb2FkKCk7XG4gICAgICAgICAgICBkaXN0YW5jZSsrO1xuICAgICAgICAgICAgYnVsbGV0LnB1c2goe3g6IE1hdGguY29zKHRoZXRhKSAqIGJ1bGxldC52ZWxvY2l0eSwgeTogTWF0aC5zaW4odGhldGEpICogYnVsbGV0LnZlbG9jaXR5fSk7XG4gICAgICAgIH0pO1xuICAgICAgICBidWxsZXQucmFkaXVzID0gMTtcbiAgICAgICAgYnVsbGV0LmNvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcil7XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbGxpZGVyLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICd6b21iaWUnOlxuICAgICAgICAgICAgICAgICAgICBidWxsZXQudW5sb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci5iYXNlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3F1YXJlJzpcbiAgICAgICAgICAgICAgICAgICAgYnVsbGV0LnVubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBidWxsZXQubW92ZSh7eDogcG9zLnggKyBNYXRoLmNvcyh0aGV0YSkgKiA3NSwgeTogcG9zLnkgKyBNYXRoLnNpbih0aGV0YSkgKiA3NX0pO1xuICAgIH07XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICBidWxsZXRba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICB9XG5cbiAgICBidWxsZXQudHlwZSA9ICdidWxsZXQnO1xuICAgIHJldHVybiBidWxsZXQ7XG59O1xuXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1bGxldDtcbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgbWFrZVZpc2libGUgPSByZXF1aXJlKCcuL21ha2VWaXNpYmxlLmpzJyk7XG52YXIgbWFrZUludmVudG9yeSA9IHJlcXVpcmUoJy4vbWFrZUludmVudG9yeS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGNoYXJhY3RlciA9IGJhc2VFbnRpdHkoKTtcbiAgICB2YXIgYW5pVGljayA9IDA7XG4gICAgbWFrZUludmVudG9yeShjaGFyYWN0ZXIpO1xuICAgIG1ha2VHZW9tZXRyeShjaGFyYWN0ZXIsICdjaXJjbGUnKTtcbiAgICBtYWtlU29saWQoY2hhcmFjdGVyKTtcbiAgICBtYWtlVmlzaWJsZShjaGFyYWN0ZXIpO1xuICAgIGNoYXJhY3Rlci5yYWRpdXMgPSA1MDtcbiAgICBjaGFyYWN0ZXIuc29saWQgPSB0cnVlO1xuICAgIGNoYXJhY3Rlci5vblRvcCA9IHRydWU7XG4gICAgY2hhcmFjdGVyLmdlb21ldHJ5ID0gJ2NpcmNsZSc7XG4gICAgY2hhcmFjdGVyLmxvb2tBdFZlYyA9IGZ1bmN0aW9uKHZlYykge1xuICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKHZlYy55LCB2ZWMueCk7XG4gICAgICAgIGNoYXJhY3Rlci5wb3Mucm90ID0gdGhldGEgKyBNYXRoLlBJO1xuICAgICAgICByZXR1cm4gdGhldGE7XG4gICAgfTtcbiAgICBjaGFyYWN0ZXIubG9va0F0T2JqID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIob2JqLnBvcy55IC0gY2hhcmFjdGVyLnBvcy55LCBvYmoucG9zLnggLSBjaGFyYWN0ZXIucG9zLngpO1xuICAgICAgICBjaGFyYWN0ZXIucG9zLnJvdCA9IHRoZXRhO1xuICAgICAgICByZXR1cm4gdGhldGE7XG4gICAgfTtcbiAgICBjaGFyYWN0ZXIuYmFzZSA9ICdjaGFyYWN0ZXInO1xuICAgIGNoYXJhY3Rlci5oZWFsdGggPSAxO1xuICAgIGNoYXJhY3Rlci5zdGVwKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoY2hhcmFjdGVyLmhlYWx0aCA8PSAwKSBjaGFyYWN0ZXIuYWRkTW9kZSgnZGllJyk7XG4gICAgICAgIGFuaVRpY2srKztcbiAgICAgICAgaWYgKCFjaGFyYWN0ZXIudmVsb2NpdHkpIHtcbiAgICAgICAgICAgIGNoYXJhY3Rlci5wb3NlLnggPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGFuaVRpY2sgPiAxNiAtIGNoYXJhY3Rlci52ZWxvY2l0eSkge1xuICAgICAgICAgICAgICAgIGFuaVRpY2sgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChjaGFyYWN0ZXIucG9zZS54IDwgY2hhcmFjdGVyLnRleHR1cmVEYXRhLnBvc2VzLnNsaWRlc1tjaGFyYWN0ZXIucG9zZS55XSAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyLnBvc2UueCsrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3Rlci5wb3NlLnggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5pVGljaysrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgY2hhcmFjdGVyLm1vZGVzID0gb3B0aW9ucy5tb2RlcztcbiAgICBjaGFyYWN0ZXIuY29sbGlkZSA9IG9wdGlvbnMuY29sbGlkZTtcbiAgICBjaGFyYWN0ZXIudHlwZSA9IG9wdGlvbnMudHlwZTtcbiAgICBjaGFyYWN0ZXIuYWRkTW9kZSA9IGZ1bmN0aW9uKG1vZGUpIHtcbiAgICAgICAgaWYgKGNoYXJhY3Rlci5jdXJyZW50TW9kZSA9PT0gbW9kZSkgcmV0dXJuO1xuICAgICAgICBjaGFyYWN0ZXIuY3VycmVudE1vZGUgPSBtb2RlO1xuICAgICAgICBjaGFyYWN0ZXIubW9kZXNbbW9kZV0oKTtcbiAgICB9O1xuICAgIGNoYXJhY3Rlci5wb3NlID0ge3g6IDAsIHk6IDB9O1xuICAgIGNoYXJhY3Rlci5sb2FkKGZ1bmN0aW9uKCkgeyBjaGFyYWN0ZXIuYWRkTW9kZShvcHRpb25zLm1vZGUpOyB9KTtcbiAgICBjaGFyYWN0ZXIubW92ZShvcHRpb25zLnBvcyk7XG4gICAgcmV0dXJuIGNoYXJhY3Rlcjtcbn07XG5cbiIsInZhciB3b3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcbnZhciBwcnVuZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICAgICAgKChhLkFBQkIueXNbMF0udmFsID4gYi5BQUJCLnlzWzBdLnZhbCAmJiBhLkFBQkIueXNbMF0udmFsIDwgYi5BQUJCLnlzWzFdLnZhbCkgfHxcbiAgICAgICAgICAgIChhLkFBQkIueXNbMV0udmFsID4gYi5BQUJCLnlzWzBdLnZhbCAmJiBhLkFBQkIueXNbMV0udmFsIDwgYi5BQUJCLnlzWzFdLnZhbCkgfHxcbiAgICAgICAgICAgIChiLkFBQkIueXNbMF0udmFsID4gYS5BQUJCLnlzWzBdLnZhbCAmJiBiLkFBQkIueXNbMF0udmFsIDwgYS5BQUJCLnlzWzFdLnZhbCkgfHxcbiAgICAgICAgICAgIChiLkFBQkIueXNbMV0udmFsID4gYS5BQUJCLnlzWzBdLnZhbCAmJiBiLkFBQkIueXNbMV0udmFsIDwgYS5BQUJCLnlzWzFdLnZhbCkpICYmIFxuICAgICAgICAgICAgKCEoYi5nZW9tZXRyeSA9PT0gJ3NxdWFyZScgJiYgYS5nZW9tZXRyeSA9PT0gJ3NxdWFyZScpKSAmJlxuICAgICAgICAgICAgKGIuaWQgIT09IGEuaWQpXG4gICAgICAgICAgICk7XG59O1xuXG52YXIgY29sbGlzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN3ZWVwaW5nID0gW107XG4gICAgdmFyIHBvc3NpYmxlWHMgPSBbXTtcbiAgICB2YXIgbW92ZXMgPSBbXTtcbiAgICB3b3JsZC5nZXRYcygpLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICBpZiAoeC50eXBlID09PSAnYicpIHtcbiAgICAgICAgICAgIHN3ZWVwaW5nLmZvckVhY2goZnVuY3Rpb24oc3dlcHQpIHtcbiAgICAgICAgICAgICAgICBwb3NzaWJsZVhzLnB1c2goW3gub2JqLCBzd2VwdF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzd2VlcGluZy5wdXNoKHgub2JqKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeC50eXBlID09PSAnZScpIHtcbiAgICAgICAgICAgIHN3ZWVwaW5nID0gc3dlZXBpbmcuZmlsdGVyKGZ1bmN0aW9uKHN3ZXB0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHN3ZXB0LmlkICE9PSB4Lm9iai5pZCkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcG9zc2libGVYcyA9IHBvc3NpYmxlWHMuZmlsdGVyKGZ1bmN0aW9uKHBhaXIpIHtcbiAgICAgICAgcmV0dXJuIHBydW5lKHBhaXJbMF0sIHBhaXJbMV0pO1xuICAgIH0pO1xuXG4gICAgcG9zc2libGVYcy5mb3JFYWNoKGZ1bmN0aW9uKHBhaXIpIHtcbiAgICAgICAgcGFpclswXS5kZXRlY3RDb2xsaWRlKHBhaXJbMV0pO1xuICAgIH0pO1xuXG59O1xuXG5hcGkgPSB7XG4gICAgc3RlcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbGxpc2lvbigpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuXG4vKlxuICpcbiAgICAgICAgICAgICAgICAgICAgaWYgKChjb2xsaWRlci50eXBlID09PSAnem9tYmllJyAmJiBjb2xsaWRlZS50eXBlID09PSAnaHVtYW4nKSB8fCAoY29sbGlkZWUudHlwZSA9PT0gJ3pvbWJpZScgJiYgY29sbGlkZXIudHlwZSA9PT0gJ2h1bWFuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xsaWRlci50eXBlID09PSAnem9tYmllJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvbWJpZSA9IGNvbGxpZGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh1bWFuID0gY29sbGlkZWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvbWJpZSA9IGNvbGxpZGVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh1bWFuID0gY29sbGlkZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9jbHVkZSA9IHdvcmxkLmZpbHRlcihmdW5jdGlvbihjdXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnIudHlwZSA9PT0gJ2Jsb2NrJykgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXYpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyLm9jbHVkZShjb2xsaWRlci5wb3MsIGNvbGxpZGVlLnBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6b21iaWUudGFyZ2V0ID09PSBodW1hbiAmJiBvY2x1ZGUgJiYgZGlzID4gMTAwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRNb2RlKCdzZWFyY2hpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmcyID0gTWF0aC5hYnMoTWF0aC5hdGFuMihodW1hbi5wb3MueSAtIHpvbWJpZS5wb3MueSwgaHVtYW4ucG9zLnggLSB6b21iaWUucG9zLngpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZyA9ICB6b21iaWUucG9zLnJvdCAtIGFuZzI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvY2x1ZGUgJiYgKE1hdGguYWJzKGFuZykgPCBNYXRoLlBJICogMC40NSB8fCBkaXMgPCA1MDApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRNb2RlKCdjaGFzaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvbWJpZS50YXJnZXQgPSBodW1hbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICgoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdibG9jaycgJiYgY29sbGlkZWUuZ2VvbWV0cnkgPT09ICdjaXJjbGUnKSB8fCAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdjaXJjbGUnICYmIGNvbGxpZGVlLmdlb21ldHJ5ID09PSAnYmxvY2snKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdibG9jaycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrID0gY29sbGlkZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaXJjbGUgPSBjb2xsaWRlZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGlkZWUuZ2VvbWV0cnkgPT09ICdibG9jaycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrID0gY29sbGlkZWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaXJjbGUgPSBjb2xsaWRlcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaXJjbGUudHlwZSAhPT0gJ2dvYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludCA9IGJsb2NrLnRlc3RQb2ludChjaXJjbGUucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaXJjbGUudHlwZSA9PT0gJ2NsaWNrT2JqJykgY2lyY2xlLmFkZE9iaihibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNpcmNsZS50eXBlID09PSAnY2xpY2tNZW51JykgY2lyY2xlLmFkZE9iaihibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNpcmNsZS50eXBlID09PSAnYnVsbGV0JyAmJiBibG9jay50eXBlID09PSAnYmxvY2snKSBjaXJjbGUuZGllID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gJ3NlbnNvcicgJiYgY2lyY2xlLnR5cGUgPT09ICdhY3RpdmF0aW9uJykgYmxvY2suY29sbGlzaW9uLmFjdGl2YXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2suc29saWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2lyY2xlLnBvcy54ID0gcG9pbnQueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2lyY2xlLnBvcy55ID0gcG9pbnQueTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKi9cblxuXG4iLCJ2YXIgZ2V0SWQgPSByZXF1aXJlKCcuL2dldElkLmpzJykuZ2V0SWQ7XG4vL3ZhciBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUuanMnKTtcbnZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4vZG9tLmpzJyk7XG52YXIgcGxheWVyO1xudmFyIGxlZnRKb3lzdGljayA9IGZhbHNlO1xudmFyIHJpZ2h0Sm95c3RpY2sgPSBmYWxzZTtcbnZhciBvbmdvaW5nVG91Y2hlcyA9IFtdO1xudmFyIHRvdWNoUGFkV2lkdGg7IFxuZG9tLm9ubG9hZChmdW5jdGlvbigpIHsgdG91Y2hQYWRXaWR0aCA9IGRvbS5nZXRPYmpCeUlkKCdjYW52YXMnKS5jbGllbnRXaWR0aDsgfSk7XG5cbnZhciBhcGkgPSB7XG4gICAgY29ubmVjdFBsYXllcjogZnVuY3Rpb24ocCkge1xuICAgICAgICBwbGF5ZXIgPSBwO1xuICAgIH1cbn07XG5cbmRvbS5hdHRhY2hFdmVudCgnbmV3R2FtZScsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ25ld0dhbWUnKSk7XG5kb20uYXR0YWNoRXZlbnQoJ29rYXlTdGF0cycsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ21haW5NZW51JykpO1xuZG9tLmF0dGFjaEV2ZW50KCdyZXN1bWVHYW1lJywgJ2NsaWNrJywgZXZlbnRzLmVtaXQuYmluZChudWxsLCAnc3RhcnQnKSk7XG5kb20uYXR0YWNoRXZlbnQoJ3BhdXNlR2FtZScsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ3BhdXNlJykpO1xuZG9tLmF0dGFjaEV2ZW50KCdwYXVzZUdhbWUnLCAndG91Y2hzdGFydCcsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ3BhdXNlJykpO1xuZG9tLmF0dGFjaEV2ZW50KCdxdWl0R2FtZScsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ2dhbWVPdmVyJykpO1xuZG9tLmF0dGFjaEV2ZW50KCduZXh0V2VhcG9uJywgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKHBsYXllcikgcGxheWVyLm5leHRXZWFwb24oKTtcbn0pO1xuXG52YXIgbmV3VG91Y2ggPSBmdW5jdGlvbih0b3VjaCkge1xuICAgIGlmICh0b3VjaC5wYWdlWCA8IHRvdWNoUGFkV2lkdGggLyAyICYmICFsZWZ0Sm95c3RpY2spIHtcbiAgICAgICAgbGVmdEpveXN0aWNrID0ge1xuICAgICAgICAgICAgdG91Y2g6IHRvdWNoLFxuICAgICAgICAgICAgb3JpZ2VuOiB7XG4gICAgICAgICAgICAgICAgeDogdG91Y2gucGFnZVgsXG4gICAgICAgICAgICAgICAgeTogdG91Y2gucGFnZVlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWx0YToge1xuICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgeTogMFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAodG91Y2gucGFnZVggPj0gdG91Y2hQYWRXaWR0aCAvIDIgJiYgIXJpZ2h0Sm95c3RpY2spIHtcbiAgICAgICAgcmlnaHRKb3lzdGljayA9IHtcbiAgICAgICAgICAgIHRvdWNoOiB0b3VjaCxcbiAgICAgICAgICAgIG9yaWdlbjoge1xuICAgICAgICAgICAgICAgIHg6IHRvdWNoLnBhZ2VYLFxuICAgICAgICAgICAgICAgIHk6IHRvdWNoLnBhZ2VZXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsdGE6IHtcbiAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG52YXIgdXBkYXRlVG91Y2ggPSBmdW5jdGlvbih0b3VjaCkge1xuICAgIHZhciBqb3lzdGljaztcbiAgICBpZiAobGVmdEpveXN0aWNrICYmIHRvdWNoLmlkZW50aWZpZXIgPT09IGxlZnRKb3lzdGljay50b3VjaC5pZGVudGlmaWVyKSB7XG4gICAgICAgIGpveXN0aWNrID0gbGVmdEpveXN0aWNrO1xuICAgIH1cbiAgICBpZiAocmlnaHRKb3lzdGljayAmJiB0b3VjaC5pZGVudGlmaWVyID09PSByaWdodEpveXN0aWNrLnRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgam95c3RpY2sgPSByaWdodEpveXN0aWNrO1xuICAgIH1cbiAgICBpZiAoIWpveXN0aWNrKSByZXR1cm47XG4gICAgam95c3RpY2suZGVsdGEueSA9IGpveXN0aWNrLm9yaWdlbi55IC0gdG91Y2gucGFnZVk7XG4gICAgam95c3RpY2suZGVsdGEueCA9IGpveXN0aWNrLm9yaWdlbi54IC0gdG91Y2gucGFnZVg7XG59O1xuXG52YXIgZW5kVG91Y2ggPSBmdW5jdGlvbih0b3VjaCkge1xuICAgIHZhciBqb3lzdGljaztcbiAgICBpZiAobGVmdEpveXN0aWNrICYmIHRvdWNoLmlkZW50aWZpZXIgPT09IGxlZnRKb3lzdGljay50b3VjaC5pZGVudGlmaWVyKSB7XG4gICAgICAgIGxlZnRKb3lzdGljayA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAocmlnaHRKb3lzdGljayAmJiB0b3VjaC5pZGVudGlmaWVyID09PSByaWdodEpveXN0aWNrLnRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgcmlnaHRKb3lzdGljayA9IGZhbHNlO1xuICAgIH1cbn07XG5cbmRvbS5hdHRhY2hFdmVudCgnZ2FtZVZpZXcnLCAndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGV2dCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0b3VjaGVzID0gZXZ0LmNoYW5nZWRUb3VjaGVzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBuZXdUb3VjaCh0b3VjaGVzW2ldKTtcbiAgICB9XG5cbn0pO1xuXG5kb20uYXR0YWNoRXZlbnQoJ2dhbWVWaWV3JywgJ3RvdWNobW92ZScsIGZ1bmN0aW9uKGV2dCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0b3VjaGVzID0gZXZ0LmNoYW5nZWRUb3VjaGVzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB1cGRhdGVUb3VjaCh0b3VjaGVzW2ldKTtcbiAgICB9XG5cbn0pO1xuXG5kb20uYXR0YWNoRXZlbnQoJ2dhbWVWaWV3JywgJ3RvdWNoZW5kJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHRvdWNoZXMgPSBldnQuY2hhbmdlZFRvdWNoZXM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVuZFRvdWNoKHRvdWNoZXNbaV0pO1xuICAgIH1cblxufSk7XG5cblxuZXZlbnRzLnJlZ2lzdGVyKCdhbmltYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoZXRhLCB4LCB5LCBwb3M7XG4gICAgaWYgKCFwbGF5ZXIpIHJldHVybjtcbiAgICBpZiAobGVmdEpveXN0aWNrICkge1xuICAgICAgICB5ID0gbGVmdEpveXN0aWNrLmRlbHRhLnk7XG4gICAgICAgIHggPSBsZWZ0Sm95c3RpY2suZGVsdGEueDtcbiAgICAgICAgcGxheWVyLmxvb2tBdFZlYyh7eDogeCwgeTogeX0pO1xuICAgICAgICBwbGF5ZXIucHVzaCh7eDogLXggLyA1MCwgeTogLXkgLyA1MH0pO1xuICAgIH1cbiAgICBpZiAocmlnaHRKb3lzdGljayApIHtcbiAgICAgICAgeSA9IHJpZ2h0Sm95c3RpY2suZGVsdGEueTtcbiAgICAgICAgeCA9IHJpZ2h0Sm95c3RpY2suZGVsdGEueDtcbiAgICAgICAgcGxheWVyLmxvb2tBdFZlYyh7eDogeCwgeTogeX0pO1xuICAgICAgICBwbGF5ZXIuYWRkTW9kZSgnc2hvb3RpbmcnKTtcbiAgICB9XG4gICAgaWYgKCFyaWdodEpveXN0aWNrICkgcGxheWVyLmFkZE1vZGUoJ3J1bm5pbmcnKTtcbiAgICBpZiAoIWxlZnRKb3lzdGljayAmJiAhcmlnaHRKb3lzdGljayApIHBsYXllci5hZGRNb2RlKCdzdGFuZGluZycpO1xuICAgIGRvbS51cGRhdGVXZWFwb25JY29ucyhwbGF5ZXIuY3VycmVudFdlYXBvbnMpO1xuXG59LCBnZXRJZCgpKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiIsInZhciBsb2FkZWQgPSBmYWxzZTtcbnZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIGdldElkID0gcmVxdWlyZSgnLi9nZXRJZC5qcycpLmdldElkO1xudmFyIGVmZmVjdHMgPSByZXF1aXJlKCcuL2VmZmVjdHMuanMnKTtcbnZhciBvYmpzID0ge307XG53aW5kb3cuZnVuY3Rpb25zID0ge307XG52YXIgbG9hZEV2ZW50cyA9IFtdO1xudmFyIG9sZFdlYXBvbnMgPSBbXTtcbnZhciBpY29uRXZlbnRzID0gW107XG52YXIgd2VhcG9uSWNvbnMgPSBbXTtcblxuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7IFxuICAgIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZG9tb2JqJykpLmZvckVhY2goZnVuY3Rpb24ob2JqLCBpbmRleCwgYXJyYXkpIHsgXG4gICAgICAgIG9ianNbb2JqLmlkXSA9IG9iajsgXG4gICAgICAgIGlmIChpbmRleCA9PT0gYXJyYXkubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgbG9hZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGV2KSB7IGV2KCk7IH0pOyBcbiAgICAgICAgICAgIGxvYWRlZCA9IHRydWU7IFxuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG52YXIgYXBpID0ge1xuICAgIG9ubG9hZDogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGxvYWRlZCkgcmV0dXJuIGV2KCk7XG4gICAgICAgIGxvYWRFdmVudHMucHVzaChldik7XG4gICAgfSxcbiAgICBhdHRhY2hFdmVudDogZnVuY3Rpb24oaWQsIHR5cGUsIGZ1bmMpIHtcbiAgICAgICAgdmFyIGZpZCA9IGdldElkKCk7XG4gICAgICAgIGZ1bmN0aW9uc1tmaWRdID0ge2Y6IGZ1bmMsIGlkOiBpZH07XG4gICAgICAgIGFwaS5vbmxvYWQoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgb2Jqc1tpZF0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmdW5jKTsgXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmlkO1xuICAgIH0sXG4gICAgZGV0YWNoRXZlbnQ6IGZ1bmN0aW9uKGZpZCkge1xuICAgICAgICBvYmpzW2Z1bmN0aW9uc1tmaWRdLmlkXS5yZW1vdmVFdmVudExpc3RlbmVyKGZ1bmN0aW9uc1tmaWRdLmYpO1xuICAgICAgICBkZWxldGUgZnVuY3Rpb25zW2ZpZF07XG4gICAgfSxcbiAgICBkaXNwbGF5OiBmdW5jdGlvbihpZCkge1xuICAgICAgICBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NsaWRlcycpKS5mb3JFYWNoKGZ1bmN0aW9uKG9iaikgeyBlZmZlY3RzLmZhZGVPdXQob2JqKTsgfSk7XG4gICAgICAgIGVmZmVjdHMuZmFkZUluKG9ianNbaWRdKTtcbiAgICB9LFxuICAgIGdldE9iakJ5SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBvYmpzW2lkXTtcbiAgICB9LFxuICAgIHVwZGF0ZVdlYXBvbkljb25zOiBmdW5jdGlvbih3ZWFwb25zKSB7XG4gICAgICAgIHZhciBjaGFuZ2VkO1xuICAgICAgICBpZiAod2VhcG9ucykge1xuICAgICAgICAgICAgd2VhcG9ucy5mb3JFYWNoKGZ1bmN0aW9uKHdlYXBvbikge1xuICAgICAgICAgICAgICAgIGlmICh3ZWFwb25zLnR5cGUgIT09IG9sZFdlYXBvbnMudHlwZSkgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgb2xkV2VhcG9ucyA9IHdlYXBvbnM7XG4gICAgICAgICAgICAgICAgd2VhcG9uSWNvbnMuZm9yRWFjaChmdW5jdGlvbihpY29uKSB7XG4gICAgICAgICAgICAgICAgICAgIHdlYXBvbkljb25zW2luZGV4XS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpY29uRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgZXYuZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXYuZnVuYyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgd2VhcG9ucy5mb3JFYWNoKGZ1bmN0aW9uKHdlYXBvbiwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWFwb24uc2VsZWN0V2VhcG9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgd2VhcG9uSWNvbnNbaW5kZXhdLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHdlYXBvbi5pY29uO1xuICAgICAgICAgICAgICAgICAgICBpY29uRXZlbnRzLnB1c2goe2RvbTogd2VhcG9uSWNvbnNbaW5kZXhdLCBmdW5jOiBjbGlja30pO1xuICAgICAgICAgICAgICAgICAgICB3ZWFwb25JY29ucy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmFwaS5vbmxvYWQoZnVuY3Rpb24oKSB7XG5cbn0pO1xuXG5mb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgIHdlYXBvbkljb25zLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKSk7XG4gICAgd2VhcG9uSWNvbnNbaV0uY2xhc3NOYW1lID0gJ3dlYXBvbmljb24nO1xuICAgIChmdW5jdGlvbigpIHsgXG4gICAgICAgIHZhciBqID0gaTtcbiAgICAgICAgYXBpLm9ubG9hZChmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICBvYmpzWyd3ZWFwb25PcHRpb25zJ10uYXBwZW5kQ2hpbGQod2VhcG9uSWNvbnNbal0pOyBcbiAgICAgICAgfSk7XG4gICAgfSkoKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZmFkZUluOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgb2JqLnN0eWxlLm9wYWNpdHkgPSAxO1xuICAgICAgICBvYmouc3R5bGUuekluZGV4ID0gMztcbiAgICB9LFxuICAgIGZhZGVPdXQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICBvYmouc3R5bGUub3BhY2l0eSA9IDA7XG4gICAgICAgIG9iai5zdHlsZS56SW5kZXggPSAxO1xuICAgIH1cbn07XG4iLCJ2YXIgZXZlbnRzID0ge307XG5cbnZhciBhcGkgPSB7XG4gICAgZW1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgICBmb3IgKHZhciBpZCBpbiBldmVudHMpIHtcbiAgICAgICAgICAgIGlmIChldmVudHNbaWRdLmUgPT09IGUpIGV2ZW50c1tpZF0uZigpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZWdpc3RlcjogZnVuY3Rpb24oZSwgZiwgaWQpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygncmVnaXN0ZXJpbmcgZXZlbnQgJyArIGUsIGYsIGlkKTtcbiAgICAgICAgZXZlbnRzW2lkXSA9IHtcbiAgICAgICAgICAgIGY6IGYsXG4gICAgICAgICAgICBlOiBlXG4gICAgICAgIH07XG4gICAgfSxcbiAgICB1bnJlZ2lzdGVyOiBmdW5jdGlvbihpZCkge1xuICAgICAgICBkZWxldGUgZXZlbnRzW2lkXTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcblxudmFyIGFuaW1hdGUgPSBmdW5jdGlvbigpIHtcbiAgICBhcGkuZW1pdCgnYW5pbWF0ZScpO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG59O1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSBhbmltYXRlKCk7XG4iLCJ2YXIgRW50aXRpZXMgPSB7fTtcblxuRW50aXRpZXNbJ1BsYXllciddID0gcmVxdWlyZSgnLi9QbGF5ZXIuanMnKTtcbkVudGl0aWVzWyd0ZXN0J10gPSByZXF1aXJlKCcuL3Rlc3Qtb2JqLmpzJyk7XG5FbnRpdGllc1snZ3VuJ10gPSByZXF1aXJlKCcuL2d1bi5qcycpO1xuRW50aXRpZXNbJ3NxdWFyZSddID0gcmVxdWlyZSgnLi9zcXVhcmUuanMnKTtcbkVudGl0aWVzWydzcGF3bmVyJ10gPSByZXF1aXJlKCcuL3NwYXduZXIuanMnKTtcbkVudGl0aWVzWyd6b21iaWUnXSA9IHJlcXVpcmUoJy4vWm9tYmllLmpzJyk7XG5FbnRpdGllc1snd2FsbCddID0gcmVxdWlyZSgnLi93YWxsLmpzJyk7XG4vL0VudGl0aWVzWydkb29yJ10gPSByZXF1aXJlKCcuL0Rvb3IuanMnKTtcbi8vRW50aXRpZXNbJ3NlbnNvciddID0gcmVxdWlyZSgnLi9TZW5zb3IuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbnRpdGllcztcbiIsInZhciBsYXN0SWQgPSAwO1xuXG52YXIgYXBpID0ge1xuICAgIGdldElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGxhc3RJZCsrO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwidmFyIHdlYXBvbiA9IHJlcXVpcmUoJy4vd2VhcG9uLmpzJyk7XG4vL3ZhciB3b3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcbnZhciBCdWxsZXQgPSByZXF1aXJlKCcuL2J1bGxldC5qcycpO1xudmFyIG1ha2VJbnZlbnRvcnkgPSByZXF1aXJlKCcuL21ha2VJbnZlbnRvcnkuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGd1biA9IHdlYXBvbigpO1xuICAgIHZhciBidWxsZXQ7XG4gICAgaWYgKG9wdGlvbnMucG9zKSBndW4ubW92ZShvcHRpb25zLnBvcyk7XG4gICAgZ3VuLnVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnVsbGV0ID0gZ3VuLmdldEludmVudG9yeSgpWzBdO1xuICAgICAgICBpZiAoIWJ1bGxldCkge1xuICAgICAgICAgICAgYnVsbGV0ID0gQnVsbGV0KHt2ZWxvY2l0eTogMTAsIHBvd2VyOiAxMCwgcmFuZ2U6IDUwMH0pO1xuICAgICAgICAgICAgZ3VuLnRha2VJdGVtcyhidWxsZXQpO1xuICAgICAgICAgICAgd29ybGQubG9hZEl0ZW1zKGJ1bGxldCk7XG4gICAgICAgIH1cbiAgICAgICAgZ3VuLmRyb3BJdGVtKGJ1bGxldCk7XG4gICAgICAgIGJ1bGxldC5maXJlKGd1bi5vd25lci5wb3MpO1xuICAgIH07XG5cbiAgICBndW4udHlwZSA9ICdndW4nO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLnN0YXJ0QW1tbzsgaSsrKSB7XG4gICAgfVxuXG4gICAgcmV0dXJuIGd1bjtcbn07XG5cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblxuICAgIHtlbnRpdHk6ICdQbGF5ZXInLCBwb3M6IHt4OiAxMDAwLCB5OiAxMDAwLCByb3Q6IDB9fSxcbiAgICAvL3tlbnRpdHk6ICd6b21iaWUnLCBwb3M6IHt4OiAzMDAsIHk6IDMwMCwgcm90OiAwfX0sXG4gICAgLy97ZW50aXR5OiAnem9tYmllJywgcG9zOiB7eDogMzAwLCB5OiAzMDAsIHJvdDogMH19LFxuICAgIHtlbnRpdHk6ICdndW4nLCBwb3M6e3g6IDEwMDAsIHk6IDEwMDAsIHJvdDogMH0sIGFtbW9Qcm9wczoge30sIHN0YXJ0QW1tbzogMTAwfSxcbiAgICB7ZW50aXR5OiAnc3Bhd25lcicsIHBvczp7eDogMTAwMCwgeTogMTAwLCByb3Q6IDB9LCBzdGFydDogdHJ1ZSwgaW50ZXJ2YWw6IDEwMDAwLCBzcGF3bkNvdW50OiA0fSxcbiAgICAvL3tlbnRpdHk6ICd3YWxsJywgcG9zOiB7eDogMCwgeTogLTEyNTAsIHJvdDogMH0sIGRpbToge3c6IDEwMCwgaDogMjUwMH19LFxuICAgIHtlbnRpdHk6ICd3YWxsJywgcG9zOiB7eDogMTI1MCwgeTogNzAwLCByb3Q6IDB9LCBkaW06IHt3OiAyNTAwLCBoOiAxMDB9fVxuICAgIC8ve2VudGl0eTogJ3NxdWFyZScsIHBvczoge3g6IC0xMjUwLCB5OiAtMTI1MCwgcm90OiA0NX0sIGRpbToge3c6IDI1MDAsIGg6IDI1MDB9fVxuXG4gICAgLyp7ZW50aXR5OiAnVGlsZScsIHBvczoge3g6IDI1MDAsIHk6IDI1MDB9LCB3aWR0aDogNTAwMCwgaGVpZ2h0OiA1MDAwLCBwYXRoOiAnLi9pbWcvYmFja2dyb3VuZC5qcGcnfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiAwLCB5OiAzOTAwLCByb3Q6IDB9LCB3aWR0aDogMTAwLCBoZWlnaHQ6IDI2MDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDAsIHk6IDExMDAsIHJvdDogMH0sIHdpZHRoOiAxMDAsIGhlaWdodDogMjIwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogMjUwMCwgeTogMCwgcm90OiAwfSwgd2lkdGg6IDUwMDAsIGhlaWdodDogMTAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiAyNTAwLCB5OiA1MDAwLCByb3Q6IDB9LCB3aWR0aDogNTAwMCwgaGVpZ2h0OiAxMDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDUwMDAsIHk6IDI1MDAsIHJvdDogMH0sIHdpZHRoOiAxMDAsIGhlaWdodDogNTAwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL2NhcjEucG5nJywgcG9zOiB7eDogMzAwLCB5OiAzMDAsIHJvdDogMn0sIHdpZHRoOiAyMDAsIGhlaWdodDogMzAwfSxcbiAgICB7ZW50aXR5OiAnWm9tYmllJywgaW1nOiAyLCBwb3M6IHt4OiAxOTAwLCB5OiAxNzAwLCByb3Q6IDB9fVxuKi9cbl07XG5cblxuIiwicmVxdWlyZSgnLi9hbmltYXRpb25TaGltLmpzJyk7XG53aW5kb3cubG9nZ2luZyA9IFtdO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi9kb20uanMnKTtcbnZhciByZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXIuanMnKTtcbndpbmRvdy53b3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcbnZhciBjb2xsaXNpb24gPSByZXF1aXJlKCcuL2NvbGxpc2lvbi5qcycpO1xudmFyIGdldElkID0gcmVxdWlyZSgnLi9nZXRJZC5qcycpLmdldElkO1xudmFyIGNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXIuanMnKTtcblxuZG9tLm9ubG9hZChmdW5jdGlvbigpIHtcblxuICAgIHZhciBjdXJyZW50R2FtZUlkID0gZ2V0SWQoKTtcbiAgICB2YXIgcGxheWVyO1xuXG4gICAgdmFyIHN0YXRlcyA9IHtcbiAgICAgICAgbWFpbk1lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd29ybGQubG9hZExldmVsKCdnYW1lJyk7XG4gICAgICAgICAgICBkb20uZGlzcGxheSgnbWFpbk1lbnUnKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RhcnRHYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHBsYXllciA9IHdvcmxkLmdldEl0ZW1zQnlUeXBlKCdwbGF5ZXInKVswXTtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuY29ubmVjdFBsYXllcihwbGF5ZXIpO1xuICAgICAgICAgICAgcmVuZGVyZXIuY29ubmVjdFBsYXllcihwbGF5ZXIpO1xuICAgICAgICAgICAgc3RhdGVzLnBsYXlpbmdHYW1lKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHBsYXlpbmdHYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRvbS5kaXNwbGF5KCdnYW1lVmlldycpO1xuICAgICAgICAgICAgZXZlbnRzLnJlZ2lzdGVyKCdhbmltYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgd29ybGQuc3RlcCgpO1xuICAgICAgICAgICAgICAgIGNvbGxpc2lvbi5zdGVwKCk7XG4gICAgICAgICAgICAgICAgcmVuZGVyZXIuc3RlcCgpO1xuICAgICAgICAgICAgfSwgY3VycmVudEdhbWVJZCk7XG4gICAgICAgIH0sXG4gICAgICAgIHZpZXdpbmdTdGF0czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzdGF0ZXMucGF1c2VkR2FtZSgpO1xuICAgICAgICAgICAgZG9tLmRpc3BsYXkoJ3N0YXRzJyk7XG4gICAgICAgIH0sXG4gICAgICAgIHBhdXNlZEdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZG9tLmRpc3BsYXkoJ3BhdXNlTWVudScpO1xuICAgICAgICAgICAgZXZlbnRzLnVucmVnaXN0ZXIoY3VycmVudEdhbWVJZCk7XG4gICAgICAgICAgICBjdXJyZW50R2FtZUlkID0gZ2V0SWQoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBcbiAgICBldmVudHMucmVnaXN0ZXIoJ25ld0dhbWUnLCBzdGF0ZXMuc3RhcnRHYW1lLCBnZXRJZCgpKTtcbiAgICBldmVudHMucmVnaXN0ZXIoJ3N0YXJ0Jywgc3RhdGVzLnBsYXlpbmdHYW1lLCBnZXRJZCgpKTtcblxuICAgIGV2ZW50cy5yZWdpc3RlcigncGF1c2UnLCBzdGF0ZXMucGF1c2VkR2FtZSwgZ2V0SWQoKSk7XG5cbiAgICBldmVudHMucmVnaXN0ZXIoJ2dhbWVPdmVyJywgc3RhdGVzLnZpZXdpbmdTdGF0cywgZ2V0SWQoKSk7XG4gICAgZXZlbnRzLnJlZ2lzdGVyKCdtYWluTWVudScsIHN0YXRlcy5tYWluTWVudSwgZ2V0SWQoKSk7XG4gICAgc3RhdGVzLm1haW5NZW51KCk7XG5cbn0pO1xuXG5cblxuXG5cblxuIiwidmFyIHNldEFBQkIgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgQUFCQiA9IHtcbiAgICAgICAgeHM6IFt7dHlwZTogJ2InLCB2YWw6IEluZmluaXR5LCBvYmo6IG9ian0sIHt0eXBlOiAnZScsIHZhbDogLUluZmluaXR5LCBvYmo6IG9ian1dLFxuICAgICAgICB5czogW3t0eXBlOiAnYicsIHZhbDogSW5maW5pdHksIG9iajogb2JqfSwge3R5cGU6ICdlJywgdmFsOiAtSW5maW5pdHksIG9iajogb2JqfV1cbiAgICB9O1xuXG4gICAgaWYgKG9iai5nZW9tZXRyeSA9PT0gJ2NpcmNsZScpIHtcbiAgICAgICAgQUFCQi54c1swXS52YWwgPSBvYmoucG9zLnggLSBvYmoucmFkaXVzO1xuICAgICAgICBBQUJCLnhzWzFdLnZhbCA9IG9iai5wb3MueCArIG9iai5yYWRpdXM7XG4gICAgICAgIEFBQkIueXNbMF0udmFsID0gb2JqLnBvcy55IC0gb2JqLnJhZGl1cztcbiAgICAgICAgQUFCQi55c1sxXS52YWwgPSBvYmoucG9zLnkgKyBvYmoucmFkaXVzO1xuICAgICAgICBvYmouQUFCQiA9IEFBQkI7XG4gICAgICAgIHJldHVybjtcbiAgICB9O1xuICAgIGlmIChvYmouZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSB7XG4gICAgICAgIG9iai5BQUJCID0gb2JqLnZlcnRzLnJlZHVjZShmdW5jdGlvbihhY2MsIHZlcnQpIHtcbiAgICAgICAgICAgIGlmICh2ZXJ0LnggPCBhY2MueHNbMF0udmFsKSBhY2MueHNbMF0udmFsID0gdmVydC54O1xuICAgICAgICAgICAgaWYgKHZlcnQueCA+IGFjYy54c1sxXS52YWwpIGFjYy54c1sxXS52YWwgPSB2ZXJ0Lng7XG4gICAgICAgICAgICBpZiAodmVydC55IDwgYWNjLnlzWzBdLnZhbCkgYWNjLnlzWzBdLnZhbCA9IHZlcnQueTtcbiAgICAgICAgICAgIGlmICh2ZXJ0LnkgPiBhY2MueXNbMV0udmFsKSBhY2MueXNbMV0udmFsID0gdmVydC55O1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSwgQUFCQik7XG4gICAgfVxufTtcblxudmFyIHNldFZlcnRzID0gZnVuY3Rpb24ob2JqKSB7XG5cbiAgICBvYmoucG9zLnggPSBwYXJzZUludChvYmoucG9zLngpO1xuICAgIG9iai5wb3MueSA9IHBhcnNlSW50KG9iai5wb3MueSk7XG5cbiAgICB2YXIgdmVydHMgPSBbXG4gICAgICAgIHt4OiBvYmoucG9zLnggLSBvYmoud2lkdGggLyAyLCB5OiBvYmoucG9zLnkgLSBvYmouaGVpZ2h0IC8gMn0sIFxuICAgICAgICB7eDogb2JqLnBvcy54ICsgb2JqLndpZHRoIC8gMiwgeTogb2JqLnBvcy55IC0gb2JqLmhlaWdodCAvIDJ9LCBcbiAgICAgICAge3g6IG9iai5wb3MueCArIG9iai53aWR0aCAvIDIsIHk6IG9iai5wb3MueSArIG9iai5oZWlnaHQgLyAyfSwgXG4gICAgICAgIHt4OiBvYmoucG9zLnggLSBvYmoud2lkdGggLyAyLCB5OiBvYmoucG9zLnkgKyBvYmouaGVpZ2h0IC8gMn0sIFxuICAgIF07XG5cbiAgICB2YXIgcm90ID0gb2JqLnBvcy5yb3Q7XG4gICAgdmFyIG94ID0gb2JqLnBvcy54O1xuICAgIHZhciBveSA9IG9iai5wb3MueTtcblxuICAgIG9iai52ZXJ0cyA9IHZlcnRzLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciB2eCA9IGl0ZW0ueDtcbiAgICAgICAgdmFyIHZ5ID0gaXRlbS55O1xuICAgICAgICBpdGVtLnggPSBNYXRoLmNvcyhyb3QpICogKHZ4IC0gb3gpIC0gTWF0aC5zaW4ocm90KSAqICh2eSAtIG95KSArIG94O1xuICAgICAgICBpdGVtLnkgPSBNYXRoLnNpbihyb3QpICogKHZ4IC0gb3gpICsgTWF0aC5jb3Mocm90KSAqICh2eSAtIG95KSArIG95O1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9KTtcblxuICAgIHNldEFBQkIob2JqKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCB0eXBlKSB7XG4gICAgb2JqLmdlb21ldHJ5ID0gdHlwZTtcbiAgICBpZiAodHlwZSA9PT0gJ2NpcmNsZScpIHtcbiAgICAgICAgb2JqLm1vdmUoe2V2OiBzZXRBQUJCLmJpbmQobnVsbCwgb2JqKX0pO1xuICAgICAgICBzZXRBQUJCKG9iaik7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnc3F1YXJlJykge1xuICAgICAgICBvYmoud2lkdGggPSAwO1xuICAgICAgICBvYmouaGVpZ2h0ID0gMDtcbiAgICAgICAgb2JqLnNldERpbWVuc2lvbnMgPSBmdW5jdGlvbihkaW0pIHtcbiAgICAgICAgICAgIGlmIChkaW0udykgb2JqLndpZHRoID0gZGltLnc7XG4gICAgICAgICAgICBpZiAoZGltLmgpIG9iai5oZWlnaHQgPSBkaW0uaDtcbiAgICAgICAgICAgIHNldFZlcnRzKG9iaik7XG4gICAgICAgIH1cbiAgICAgICAgb2JqLm1vdmUoe2V2OiBzZXRWZXJ0cy5iaW5kKG51bGwsIG9iail9KTtcbiAgICAgICAgc2V0VmVydHMob2JqKTtcbiAgICB9XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaikge1xuXG4gICAgdmFyIGludmVudG9yeSA9IFtdO1xuICAgIG9iai50YWtlSXRlbXMgPSBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICBpZiAoIWl0ZW1zLmxlbmd0aCkgaXRlbXMgPSBbaXRlbXNdO1xuICAgICAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50T2JqID0gb2JqLmdldEludmVudG9yeUJ5VHlwZShpdGVtLnR5cGUpWzBdO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRPYmogJiYgY3VycmVudE9iai5jb25zb2xpZGF0ZUludmVudG9yeSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmoudGFrZUl0ZW1zKGl0ZW0uZ2V0SW52ZW50b3J5KCkpO1xuICAgICAgICAgICAgICAgIGl0ZW0udW5sb2FkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGludmVudG9yeS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIGl0ZW0ub3duZXIgPSBvYmo7XG4gICAgICAgICAgICAgICAgaXRlbS5sb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgb2JqLmRyb3BJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBpdGVtLm93bmVyID0gZmFsc2U7XG4gICAgICAgIGludmVudG9yeSA9IGludmVudG9yeS5maWx0ZXIoZnVuY3Rpb24obWF5YmVJdGVtKSB7IGlmIChtYXliZUl0ZW0uaWQgIT09IGl0ZW0uaWQpIHJldHVybiB0cnVlOyB9KTtcbiAgICB9O1xuICAgIG9iai5nZXRJbnZlbnRvcnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGludmVudG9yeS5zbGljZSgpO1xuICAgIH07XG4gICAgb2JqLmdldEludmVudG9yeUJ5VHlwZSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGludmVudG9yeS5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyBpZiAoaXRlbS50eXBlID09PSB0eXBlKSByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgfTtcbiAgICBvYmouZ2V0SW52ZW50b3J5QnlCYXNlID0gZnVuY3Rpb24oYmFzZSkge1xuICAgICAgICByZXR1cm4gaW52ZW50b3J5LmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IGlmIChpdGVtLmJhc2UgPT09IGJhc2UpIHJldHVybiB0cnVlOyB9KTtcbiAgICB9O1xufVxuXG4iLCJ2YXIgcGVycFBvaW50ID0gZnVuY3Rpb24odmVydHMsIHApIHtcbiAgICB2YXIgb3V0cHV0ID0gdmVydHMubWFwKGZ1bmN0aW9uKHYwLCBpbmRleCwgYXJyYXkpIHtcbiAgICAgICAgdmFyIHYxID0gYXJyYXlbaW5kZXggKyAxXTtcbiAgICAgICAgaWYgKGluZGV4ICsgMSA9PT0gYXJyYXkubGVuZ3RoKSB2MSA9IGFycmF5WzBdO1xuICAgICAgICB2YXIgayA9ICgodjEueSAtIHYwLnkpICogKHAueCAtIHYwLngpIC0gKHYxLnggLSB2MC54KSAqIChwLnkgLSB2MC55KSkgLyAoTWF0aC5wb3codjEueSAtIHYwLnksIDIpICsgTWF0aC5wb3codjEueCAtIHYwLngsIDIpKTtcbiAgICAgICAgdmFyIHBlcnBQb2ludCA9IHt4OiBwLnggLSBrICogKHYxLnkgLSB2MC55KSwgeTogcC55ICsgayAqICh2MS54IC0gdjAueCl9O1xuICAgICAgICB2YXIgZGlzID0gTWF0aC5zcXJ0KE1hdGgucG93KHAueCAtIHBlcnBQb2ludC54LCAyKSArIE1hdGgucG93KHAueSAtIHBlcnBQb2ludC55LCAyKSk7XG4gICAgICAgIHJldHVybiB7ZGlzOiBkaXMsIHBlcnBQb2ludDogcGVycFBvaW50fTtcbiAgICB9KTtcbiAgICByZXR1cm4gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwYXN0LCBjdXJyZW50KSB7IFxuICAgICAgICBpZiAoIXBhc3QuZGlzKSByZXR1cm4gY3VycmVudDtcbiAgICAgICAgaWYgKGN1cnJlbnQuZGlzIDwgcGFzdC5kaXMpIHJldHVybiBjdXJyZW50O1xuICAgICAgICByZXR1cm4gcGFzdDtcbiAgICB9KS5wZXJwUG9pbnQ7XG59O1xuXG5cbnZhciBwb2ludEluUG9seWdvbiA9IGZ1bmN0aW9uKHNxdWFyZSwgY2lyY2xlKSB7XG4gICAgdmFyIGMgPSBmYWxzZTtcbiAgICB2YXIgaSwgaiwgeCwgeSwgcDtcbiAgICB2YXIgdmVydGljZXMgPSBzcXVhcmUudmVydHM7XG4gICAgdmFyIHBvaW50ID0gY2lyY2xlLnBvcztcblxuICAgIGogPSB2ZXJ0aWNlcy5sZW5ndGggLSAxO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgaWYgKCAoKHZlcnRpY2VzW2ldLnkgPiBwb2ludC55KSAhPT0gKHZlcnRpY2VzW2pdLnkgPiBwb2ludC55KSkgJiZcbiAgICAgICAgKHBvaW50LnggPCAodmVydGljZXNbal0ueCAtIHZlcnRpY2VzW2ldLngpICogKHBvaW50LnkgLSB2ZXJ0aWNlc1tpXS55KSAvICh2ZXJ0aWNlc1tqXS55IC0gdmVydGljZXNbaV0ueSkgKyB2ZXJ0aWNlc1tpXS54KSApIHtcbiAgICAgICAgICAgIGMgPSAhYztcbiAgICAgICAgfVxuXG4gICAgICAgIGogPSBpO1xuICAgIH1cblxuICAgIGlmIChjKSB7XG4gICAgICAgIHAgPSBwZXJwUG9pbnQodmVydGljZXMsIHBvaW50KTtcbiAgICAgICAgeCA9IHAueCAtIGNpcmNsZS5wb3MueDtcbiAgICAgICAgeSA9IHAueSAtIGNpcmNsZS5wb3MueTtcbiAgICAgICAgaWYgKHggPiAzMCB8fCB5ID4gMzApIHtcbiAgICAgICAgICAgIC8vZGVidWdnZXI7XG4gICAgICAgIH1cbiAgICAgICAgbG9nZ2luZy5wdXNoKHtwOiBwLCB4OiB4LCB5OiB5LCB2ZXJ0aWNlczogdmVydGljZXMsIHBvaW50OiB7eDogcG9pbnQueCwgeTogcG9pbnQueSwgdmVjOiB7eDogcG9pbnQudmVjLngsIHk6IHBvaW50LnZlYy55fX19KTtcbiAgICAgICAgY2lyY2xlLmFkZEVmZmVjdChmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICBjaXJjbGUucHVzaCh7eDogeCwgeTogeX0pOyBcbiAgICAgICAgfSk7XG4gICAgICAgIGNpcmNsZS5jb2xsaWRlKHNxdWFyZSk7XG4gICAgICAgIHNxdWFyZS5jb2xsaWRlKGNpcmNsZSk7XG4gICAgfVxufTtcblxudmFyIGxvbmdQdXNoID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB0aGVuID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgeCA9IE1hdGguY29zKGIucG9zLnJvdCkgKiBiLnZlbG9jaXR5O1xuICAgIHZhciB5ID0gTWF0aC5zaW4oYi5wb3Mucm90KSAqIGIudmVsb2NpdHk7XG4gICAgYS5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGFwc2VkVGltZSA9IChEYXRlLm5vdygpIC0gdGhlbikgLyAxMDAwO1xuICAgICAgICB2YXIgc2NhbGVyID0gTWF0aC5wb3coZWxhcHNlZFRpbWUgLSAxLCAyKTtcbiAgICAgICAgaWYgKGVsYXBzZWRUaW1lID4gMSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBhLnB1c2goe3g6IHggKiBzY2FsZXIsIHk6IHkgKiBzY2FsZXJ9KTtcblxuICAgIH0pO1xufTtcblxudmFyIGNpcmNsZURldGVjdCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCwgeSwgZGlzLCByYWRpdXMsIGRlbHRhLCB0aGV0YSwgYURlbHRhLCBiRGVsdGE7XG4gICAgeCA9IGEucG9zLnggLSBiLnBvcy54O1xuICAgIHkgPSBhLnBvcy55IC0gYi5wb3MueTtcbiAgICBkaXMgPSBNYXRoLnNxcnQoTWF0aC5wb3coeCwgMikgKyBNYXRoLnBvdyh5LCAyKSk7XG4gICAgcmFkaXVzID0gcGFyc2VJbnQoYS5yYWRpdXMpICsgcGFyc2VJbnQoYi5yYWRpdXMpO1xuXG4gICAgaWYgKGRpcyA8IHJhZGl1cykge1xuICAgICAgICBkZWx0YSA9IChyYWRpdXMgLSBkaXMpO1xuICAgICAgICB0aGV0YSA9IE1hdGguYXRhbjIoeSwgeCk7XG4gICAgICAgIGEuYWRkRWZmZWN0KGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgIGEucHVzaCh7XG4gICAgICAgICAgICAgICAgeDogKE1hdGguY29zKHRoZXRhKSAqIGRlbHRhKSwgXG4gICAgICAgICAgICAgICAgeTogKE1hdGguc2luKHRoZXRhKSAqIGRlbHRhKVxuICAgICAgICAgICAgfSk7IFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgICAgYi5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgYi5wdXNoKHtcbiAgICAgICAgICAgICAgICB4OiAoTWF0aC5jb3ModGhldGEpICogLWRlbHRhKSwgIFxuICAgICAgICAgICAgICAgIHk6IChNYXRoLnNpbih0aGV0YSkgKiAtZGVsdGEpXG4gICAgICAgICAgICB9KTsgXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYi5pbmVydGlhKSBsb25nUHVzaChhLCBiKTtcbiAgICAgICAgaWYgKGEuaW5lcnRpYSkgbG9uZ1B1c2goYiwgYSk7XG4gICAgICAgIGEuY29sbGlkZShiKTtcbiAgICAgICAgYi5jb2xsaWRlKGEpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgb2JqLnNvbGlkID0gdHJ1ZTtcbiAgICBpZiAob2JqLmdlb21ldHJ5ID09PSAnY2lyY2xlJykge1xuICAgICAgICBvYmouZGV0ZWN0Q29sbGlkZSA9IGZ1bmN0aW9uKGNvbGxpZGVyKSB7XG4gICAgICAgICAgICBpZiAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdjaXJjbGUnKSBjaXJjbGVEZXRlY3Qob2JqLCBjb2xsaWRlcik7XG4gICAgICAgICAgICBpZiAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSBwb2ludEluUG9seWdvbihjb2xsaWRlciwgb2JqKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKG9iai5nZW9tZXRyeSA9PT0gJ3NxdWFyZScpIHtcbiAgICAgICAgb2JqLmRldGVjdENvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnc3F1YXJlJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnY2lyY2xlJykgcG9pbnRJblBvbHlnb24ob2JqLCBjb2xsaWRlcik7XG4gICAgICAgIH07XG4gICAgfVxufTtcbiIsInZhciB0ZXh0dXJlRGF0YSA9IHJlcXVpcmUoJy4vdGV4dHVyZURhdGEuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYWtlVmlzaWJsZSAob2JqKSB7XG4gICAgb2JqLmxvYWQoZnVuY3Rpb24oKSB7IFxuICAgICAgICBvYmoudGV4dHVyZURhdGEgPSB0ZXh0dXJlRGF0YVtvYmouYmFzZV1bb2JqLnR5cGVdOyBcbiAgICAgICAgb2JqLnZpc2libGUgPSB0cnVlO1xuICAgICAgICBvYmouYWRkRWZmZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKG9iai5pbkNvbnRhaW5lcigpKSB7XG4gICAgICAgICAgICAgICAgb2JqLnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqLnZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcbiIsImZ1bmN0aW9uIE1hdHJpeFN0YWNrKCkge1xuICAgICAgdGhpcy5zdGFjayA9IFtdO1xuXG4gICAgICAvL3NpbmNlIHRoZSBzdGFjayBpcyBlbXB0eSB0aGlzIHdpbGwgcHV0IGFuIGluaXRpYWwgbWF0cml4IGluIGl0XG4gICAgICAgICAgdGhpcy5yZXN0b3JlKCk7XG59XG5cbi8vIFBvcHMgdGhlIHRvcCBvZiB0aGUgc3RhY2sgcmVzdG9yaW5nIHRoZSBwcmV2aW91c2x5IHNhdmVkIG1hdHJpeFxuTWF0cml4U3RhY2sucHJvdG90eXBlLnJlc3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YWNrLnBvcCgpO1xuICAgIC8vIE5ldmVyIGxldCB0aGUgc3RhY2sgYmUgdG90YWxseSBlbXB0eVxuICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgdGhpcy5zdGFja1swXSA9IG00LmlkZW50aXR5KCk7XG4gICAgfVxufTtcblxuLy8gUHVzaGVzIGEgY29weSBvZiB0aGUgY3VycmVudCBtYXRyaXggb24gdGhlIHN0YWNrXG5NYXRyaXhTdGFjay5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhY2sucHVzaCh0aGlzLmdldEN1cnJlbnRNYXRyaXgoKSk7XG59O1xuXG4vLyBHZXRzIGEgY29weSBvZiB0aGUgY3VycmVudCBtYXRyaXggKHRvcCBvZiB0aGUgc3RhY2spXG5NYXRyaXhTdGFjay5wcm90b3R5cGUuZ2V0Q3VycmVudE1hdHJpeCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0uc2xpY2UoKTtcbn07XG5cbi8vIExldHMgdXMgc2V0IHRoZSBjdXJyZW50IG1hdHJpeFxuTWF0cml4U3RhY2sucHJvdG90eXBlLnNldEN1cnJlbnRNYXRyaXggPSBmdW5jdGlvbihtKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXSA9IG07XG59O1xuXG4vLyBUcmFuc2xhdGVzIHRoZSBjdXJyZW50IG1hdHJpeFxuTWF0cml4U3RhY2sucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgICBpZiAoeiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHogPSAwO1xuICAgIH1cbiAgICB2YXIgbSA9IHRoaXMuZ2V0Q3VycmVudE1hdHJpeCgpO1xuICAgIHRoaXMuc2V0Q3VycmVudE1hdHJpeChtNC50cmFuc2xhdGUobSwgeCwgeSwgeikpO1xufTtcblxuLy8gUm90YXRlcyB0aGUgY3VycmVudCBtYXRyaXggYXJvdW5kIFpcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5yb3RhdGVaID0gZnVuY3Rpb24oYW5nbGVJblJhZGlhbnMpIHtcbiAgICB2YXIgbSA9IHRoaXMuZ2V0Q3VycmVudE1hdHJpeCgpO1xuICAgIHRoaXMuc2V0Q3VycmVudE1hdHJpeChtNC56Um90YXRlKG0sIGFuZ2xlSW5SYWRpYW5zKSk7XG59O1xuXG4vLyBTY2FsZXMgdGhlIGN1cnJlbnQgbWF0cml4XG5NYXRyaXhTdGFjay5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgaWYgKHogPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB6ID0gMTtcbiAgICB9XG4gICAgdmFyIG0gPSB0aGlzLmdldEN1cnJlbnRNYXRyaXgoKTtcbiAgICB0aGlzLnNldEN1cnJlbnRNYXRyaXgobTQuc2NhbGUobSwgeCwgeSwgeikpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdHJpeFN0YWNrO1xuIiwidmFyIGJhc2VFbnRpdHkgPSByZXF1aXJlKCcuL2Jhc2VFbnRpdHkuanMnKTtcbnZhciBtYWtlVmlzaWJsZSA9IHJlcXVpcmUoJy4vbWFrZVZpc2libGUuanMnKTtcbnZhciBtYWtlR2VvbWV0cnkgPSByZXF1aXJlKCcuL21ha2VHZW9tZXRyeS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcm9qZWN0aWxlID0gYmFzZUVudGl0eSgpO1xuICAgIG1ha2VWaXNpYmxlKHByb2plY3RpbGUpO1xuICAgIG1ha2VHZW9tZXRyeShwcm9qZWN0aWxlLCAnY2lyY2xlJyk7XG4gICAgcHJvamVjdGlsZS5iYXNlID0gJ3Byb2plY3RpbGUnO1xuXG4gICAgcmV0dXJuIHByb2plY3RpbGU7XG59O1xuXG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgZ2wgPSByZXF1aXJlKCcuL3dlYmdsLmpzJyk7XG52YXIgV29ybGQgPSByZXF1aXJlKCcuL3dvcmxkLmpzJyk7XG4vL3ZhciBhdWRpbyA9IHJlcXVpcmUoJy4vYXVkaW8uanMnKTtcbnZhciBjdXJyZW50TGV2ZWw7XG52YXIgcG92O1xudmFyIHNjcmVlbkRpbSA9IGdsLnNjcmVlbkRpbWVuc2lvbnM7XG5cbnZhciBzdGVwID0gZnVuY3Rpb24oKSB7XG5cbiAgICBnbC5jbGVhcigpO1xuICAgIHZhciB3b3JsZCA9IFdvcmxkLmdldEl0ZW1zKCk7XG4gICAgLy9pZiAocG92KSBhdWRpby51cGRhdGVQb3YocG92LnBvcyk7XG4gICAgd29ybGQuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7IFxuICAgICAgICB2YXIgd2lkdGgsIGhlaWdodCwgc3gsIHN5LCBpLCBzdywgc2gsIHBhdHRlcm47XG4gICAgICAgIGlmIChpdGVtLmF1ZGlvKSB7XG4gICAgICAgICAgICBhdWRpb1tpdGVtLnR5cGVdW2l0ZW0uYXVkaW9dKGl0ZW0ucG9zKTtcbiAgICAgICAgICAgIGl0ZW0uYXVkaW8gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpdGVtLnZpc2libGUpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLnRleHR1cmVEYXRhLnBvc2VzKSB7XG4gICAgICAgICAgICAgICAgc3cgPSBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLncgLyBpdGVtLnRleHR1cmVEYXRhLnBvc2VzLng7XG4gICAgICAgICAgICAgICAgc2ggPSBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLmggLyBpdGVtLnRleHR1cmVEYXRhLnBvc2VzLnk7XG4gICAgICAgICAgICAgICAgc3ggPSBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLnggKyBzdyAqIGl0ZW0ucG9zZS54O1xuICAgICAgICAgICAgICAgIHN5ID0gaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS55ICsgc2ggKiBpdGVtLnBvc2UueTtcblxuICAgICAgICAgICAgfSAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc3ggPSBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLnhcbiAgICAgICAgICAgICAgICBzeSA9IGl0ZW0udGV4dHVyZURhdGEuZnJhbWUueVxuICAgICAgICAgICAgICAgIHN3ID0gaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS53O1xuICAgICAgICAgICAgICAgIHNoID0gaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS5oO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0uZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSB7IFxuICAgICAgICAgICAgICAgIHdpZHRoID0gaXRlbS53aWR0aDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBpdGVtLmhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLmdlb21ldHJ5ID09PSAnY2lyY2xlJykgeyBcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHN3O1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IHNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ2wubWF0cml4LnJlc3RvcmUoKTsgXG5cbiAgICAgICAgICAgIC8vZ2wubWF0cml4U3RhY2suZ2xvYmFsQWxwaGEgPSBpdGVtLm9wYWNpdHkgfHwgMTtcbiAgICAgICAgICAgIGdsLm1hdHJpeC50cmFuc2xhdGUoIChpdGVtLnBvcy54ICsgKHNjcmVlbkRpbS54IC8gMiAtIHBvdi54KSksIChpdGVtLnBvcy55ICsgKHNjcmVlbkRpbS55IC8gMiAtIHBvdi55KSkpO1xuICAgICAgICAgICAgZ2wubWF0cml4LnJvdGF0ZVooaXRlbS5wb3Mucm90KTtcbiAgICAgICAgICAgIGdsLmRyYXdJbWcoc3gsIHN5LCBzdywgc2gsIC0gd2lkdGggLyAyLCAtIGhlaWdodCAvIDIsIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICAgIH1cbiAgICB9KTtcblxufTtcblxudmFyIGFwaSA9IHtcbiAgICBzdGVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHBvdikgc3RlcCgpO1xuICAgIH0sXG4gICAgY29ubmVjdFBsYXllcjogZnVuY3Rpb24ocGxheWVyKSB7XG4gICAgICAgIHBvdiA9IHBsYXllci5wb3M7XG4gICAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgem9tYmllID0gcmVxdWlyZSgnLi9ab21iaWUuanMnKTtcbi8vdmFyIHdvcmxkID0gcmVxdWlyZSgnLi93b3JsZC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgc3Bhd25lciA9IGJhc2VFbnRpdHkoKTtcbiAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpO1xuICAgIHZhciBzcGF3bmluZyA9IG9wdGlvbnMuc3RhcnQ7XG4gICAgdmFyIHNwYXduQ291bnQgPSBvcHRpb25zLnNwYXduQ291bnQ7XG4gICAgdmFyIGxhc3RTcGF3biA9IERhdGUubm93KCk7XG4gICAgc3Bhd25lci5tb3ZlKG9wdGlvbnMucG9zKTtcbiAgICBzcGF3bmVyLnN0ZXAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBpZiAoc3Bhd25pbmcpIHtcbiAgICAgICAgICAgIGlmIChzcGF3bkNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3Bhd25Db3VudCA9IG9wdGlvbnMuc3Bhd25Db3VudDtcbiAgICAgICAgICAgICAgICBzcGF3bmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRpbWVyID0gbm93O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdyAtIGxhc3RTcGF3biA+IDUwMCkge1xuICAgICAgICAgICAgICAgIGxhc3RTcGF3biA9IG5vdztcbiAgICAgICAgICAgICAgICB3b3JsZC5sb2FkSXRlbXMoem9tYmllKHtwb3M6IHNwYXduZXIucG9zfSkpO1xuICAgICAgICAgICAgICAgIHNwYXduQ291bnQtLTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5vdyAtIHRpbWVyID4gb3B0aW9ucy5pbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgIHNwYXduaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNwYXduZXI7XG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcImZyYW1lc1wiOntcImJ1bGxldFwiOntcImZyYW1lXCI6e1wieFwiOjQ1MyxcInlcIjo5MjIsXCJ3XCI6MjAxLFwiaFwiOjQ2fSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjIwMSxcImhcIjo0Nn0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjIwMSxcImhcIjo0Nn19LFwibWFjaGluZWd1blwiOntcImZyYW1lXCI6e1wieFwiOjAsXCJ5XCI6OTIyLFwid1wiOjE1MCxcImhcIjoxNTB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MCxcImhcIjoxNTB9fSxcInBpc3RvbFwiOntcImZyYW1lXCI6e1wieFwiOjE1MSxcInlcIjo5MjIsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAsXCJoXCI6MTUwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwLFwiaFwiOjE1MH19LFwicGxheWVyXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6MjgwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6MjgwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwMCxcImhcIjoyODB9fSxcInNob3RndW5cIjp7XCJmcmFtZVwiOntcInhcIjozMDIsXCJ5XCI6OTIyLFwid1wiOjE1MCxcImhcIjoxNTB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MCxcImhcIjoxNTB9fSxcIndhbGxcIjp7XCJmcmFtZVwiOntcInhcIjo0NTMsXCJ5XCI6OTY5LFwid1wiOjEwMCxcImhcIjoxMDB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTAwLFwiaFwiOjEwMH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjEwMCxcImhcIjoxMDB9fSxcInpvbWJpZTFcIjp7XCJmcmFtZVwiOntcInhcIjowLFwieVwiOjE3NjAsXCJ3XCI6MTUwMCxcImhcIjo1NjB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwMCxcImhcIjo1NjB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjU2MH19LFwiem9tYmllMlwiOntcImZyYW1lXCI6e1wieFwiOjAsXCJ5XCI6MjgxLFwid1wiOjE1MDAsXCJoXCI6NjQwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6NjQwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwMCxcImhcIjo2NDB9fSxcInpvbWJpZTNcIjp7XCJmcmFtZVwiOntcInhcIjowLFwieVwiOjE2MzQsXCJ3XCI6MTUwMCxcImhcIjo2ODZ9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwMCxcImhcIjo2ODZ9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjY4Nn19fSxcIm1ldGFcIjp7XCJhcHBcIjpcImh0dHBzOi8vd3d3Lmxlc2h5bGFicy5jb20vYXBwcy9zc3Rvb2wvXCIsXCJ2ZXJzaW9uXCI6XCJMZXNoeSBTcHJpdGVTaGVldCBUb29sIHYwLjguNFwiLFwiaW1hZ2VcIjpcInNwcml0ZXNoZWV0LnBuZ1wiLFwic2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjIzMjB9LFwic2NhbGVcIjoxfX07XG4iLCJ2YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VWaXNpYmxlID0gcmVxdWlyZSgnLi9tYWtlVmlzaWJsZS5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBzcXVhcmUgPSBiYXNlRW50aXR5KCk7XG4gICAgbWFrZVZpc2libGUoc3F1YXJlKTtcbiAgICBtYWtlR2VvbWV0cnkoc3F1YXJlLCAnc3F1YXJlJyk7XG4gICAgc3F1YXJlLnNldERpbWVuc2lvbnMob3B0aW9ucy5kaW0pO1xuICAgIHNxdWFyZS5tb3ZlKG9wdGlvbnMucG9zKTtcbiAgICBzcXVhcmUuYmFzZSA9ICdzcXVhcmUnO1xuICAgIHNxdWFyZS50eXBlID0gJ3RpbGUnO1xuICAgIHNxdWFyZS5jb2xsaWRlID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIHJldHVybiBzcXVhcmU7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cbiAgICB7ZW50aXR5OiAndGVzdCcsIHBvczoge3g6IC00MDAsIHk6IC00MDUsIHJvdDogMH19LFxuICAgIHtlbnRpdHk6ICd0ZXN0JywgcG9zOiB7eDogLTQwMCwgeTogLTQwNSwgcm90OiAwfX1cbiAgICAvL3tlbnRpdHk6ICd3YWxsJywgcG9zOiB7eDogLTQ1MCwgeTogLTQ1MCwgcm90OiAwfSwgZGltOiB7dzogMzAwLCBoOiAzMDB9fSxcbiAgICAvL3tlbnRpdHk6ICdzcXVhcmUnLCBwb3M6IHt4OiAtMTI1MCwgeTogLTEyNTAsIHJvdDogNDV9LCBkaW06IHt3OiAyNTAwLCBoOiAyNTAwfX1cblxuICAgIC8qe2VudGl0eTogJ1RpbGUnLCBwb3M6IHt4OiAyNTAwLCB5OiAyNTAwfSwgd2lkdGg6IDUwMDAsIGhlaWdodDogNTAwMCwgcGF0aDogJy4vaW1nL2JhY2tncm91bmQuanBnJ30sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogMCwgeTogMzkwMCwgcm90OiAwfSwgd2lkdGg6IDEwMCwgaGVpZ2h0OiAyNjAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiAwLCB5OiAxMTAwLCByb3Q6IDB9LCB3aWR0aDogMTAwLCBoZWlnaHQ6IDIyMDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDI1MDAsIHk6IDAsIHJvdDogMH0sIHdpZHRoOiA1MDAwLCBoZWlnaHQ6IDEwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogMjUwMCwgeTogNTAwMCwgcm90OiAwfSwgd2lkdGg6IDUwMDAsIGhlaWdodDogMTAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiA1MDAwLCB5OiAyNTAwLCByb3Q6IDB9LCB3aWR0aDogMTAwLCBoZWlnaHQ6IDUwMDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy9jYXIxLnBuZycsIHBvczoge3g6IDMwMCwgeTogMzAwLCByb3Q6IDJ9LCB3aWR0aDogMjAwLCBoZWlnaHQ6IDMwMH0sXG4gICAge2VudGl0eTogJ1pvbWJpZScsIGltZzogMiwgcG9zOiB7eDogMTkwMCwgeTogMTcwMCwgcm90OiAwfX1cbiovXG5dO1xuXG5cbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcbnZhciBtYWtlU29saWQgPSByZXF1aXJlKCcuL21ha2VTb2xpZC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgb2JqID0gYmFzZUVudGl0eSgpO1xuICAgIG9iai5yYWRpdXMgPSAxMDtcbiAgICBtYWtlR2VvbWV0cnkob2JqLCAnY2lyY2xlJyk7XG4gICAgbWFrZVNvbGlkKG9iaik7XG4gICAgb2JqLmJhc2UgPSAnb2JqJztcbiAgICBvYmoudHlwZSA9ICd0ZXN0JztcbiAgICBvYmoubW92ZShvcHRpb25zLnBvcyk7XG4gICAgb2JqLmNvbGxpZGUgPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbiIsInZhciBzcHJpdGVzID0gcmVxdWlyZSgnLi9zcHJpdGVzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNoYXJhY3Rlcjoge1xuICAgICAgICB6b21iaWU6IHsgXG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMuem9tYmllMi5mcmFtZSxcbiAgICAgICAgICAgIHBvc2VzOiB7XG4gICAgICAgICAgICAgICAgeDogNixcbiAgICAgICAgICAgICAgICB5OiA0LFxuICAgICAgICAgICAgICAgIHNsaWRlczogWzYsIDUsIDIsIDNdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHpvbWJpZTI6IHsgXG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMuem9tYmllMi5mcmFtZSxcbiAgICAgICAgICAgIHBvc2VzOiB7XG4gICAgICAgICAgICAgICAgeDogNixcbiAgICAgICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgICAgIHNsaWRlczogWzYsIDVdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHpvbWJpZTM6IHsgXG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMuem9tYmllMy5mcmFtZSxcbiAgICAgICAgICAgIHBvc2VzOiB7XG4gICAgICAgICAgICAgICAgeDogNixcbiAgICAgICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgICAgIHNsaWRlczogWzYsIDVdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHBsYXllcjogeyBcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy5wbGF5ZXIuZnJhbWUsXG4gICAgICAgICAgICBwb3Nlczoge1xuICAgICAgICAgICAgICAgIHg6IDYsXG4gICAgICAgICAgICAgICAgeTogMixcbiAgICAgICAgICAgICAgICBzbGlkZXM6IFs2LCA1XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBwcm9qZWN0aWxlOiB7XG4gICAgICAgIGJ1bGxldDoge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLmJ1bGxldC5mcmFtZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzcXVhcmU6IHtcbiAgICAgICAgdGlsZToge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLndhbGwuZnJhbWVcbiAgICAgICAgfSxcbiAgICAgICAgd2FsbDoge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLndhbGwuZnJhbWVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgd2VhcG9uOiB7XG4gICAgICAgIGd1bjoge1xuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLnBpc3RvbC5mcmFtZVxuICAgICAgICB9XG4gICAgfVxufTtcbiIsInZhciBzcXVhcmUgPSByZXF1aXJlKCcuL3NxdWFyZS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHdhbGwgPSBzcXVhcmUob3B0aW9ucyk7XG4gICAgd2FsbC5vblRvcCA9IHRydWU7XG4gICAgbWFrZVNvbGlkKHdhbGwpO1xuICAgIHdhbGwudHlwZSA9ICd3YWxsJztcblxuICAgIHJldHVybiB3YWxsO1xufTtcbiIsInZhciBtYWtlVmlzaWJsZSA9IHJlcXVpcmUoJy4vbWFrZVZpc2libGUuanMnKTtcbnZhciBtYWtlSW52ZW50b3J5ID0gcmVxdWlyZSgnLi9tYWtlSW52ZW50b3J5LmpzJyk7XG52YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3ZWFwb24gPSBiYXNlRW50aXR5KCk7XG4gICAgbWFrZUdlb21ldHJ5KHdlYXBvbiwgJ2NpcmNsZScpO1xuICAgIG1ha2VTb2xpZCh3ZWFwb24pO1xuICAgIG1ha2VWaXNpYmxlKHdlYXBvbik7XG4gICAgbWFrZUludmVudG9yeSh3ZWFwb24pO1xuICAgIHdlYXBvbi5iYXNlID0gJ3dlYXBvbic7XG4gICAgd2VhcG9uLnJhZGl1cyA9ICcxMCc7XG4gICAgd2VhcG9uLmNvb2xEb3duID0gNTtcbiAgICB3ZWFwb24uY29uc29saWRhdGVJbnZlbnRvcnkgPSB0cnVlO1xuICAgIHdlYXBvbi5jb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgc3dpdGNoIChjb2xsaWRlci50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdwbGF5ZXInOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdlYXBvbjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbnZhciBzY3JlZW4gPSB7fTtcbnNjcmVlbi53aWR0aCA9IDIwMDA7XG5zY3JlZW4uaGVpZ2h0ID0gMjAwMCAvIGNhbnZhcy5jbGllbnRXaWR0aCAqIGNhbnZhcy5jbGllbnRIZWlnaHQ7XG5cbnZhciBtYXRyaXhTdGFjayA9IHJlcXVpcmUoJy4vbWF0cml4U3RhY2suanMnKTtcbm1hdHJpeFN0YWNrID0gbmV3IG1hdHJpeFN0YWNrKCk7XG5cbi8vIEdldCBBIFdlYkdMIGNvbnRleHRcbi8qKiBAdHlwZSB7SFRNTENhbnZhc0VsZW1lbnR9ICovXG5jYW52YXMuc2V0QXR0cmlidXRlKCd3aWR0aCcsIHNjcmVlbi53aWR0aCk7XG5jYW52YXMuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBzY3JlZW4uaGVpZ2h0KTtcbnZhciBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpO1xuaWYgKCFnbCkge1xuICAgIHJldHVybjtcbn1cblxuLy8gc2V0dXAgR0xTTCBwcm9ncmFtXG52YXIgcHJvZ3JhbSA9IHdlYmdsVXRpbHMuY3JlYXRlUHJvZ3JhbUZyb21TY3JpcHRzKGdsLCBbXCJkcmF3SW1hZ2UtdmVydGV4LXNoYWRlclwiLCBcImRyYXdJbWFnZS1mcmFnbWVudC1zaGFkZXJcIl0pO1xuXG4vLyBsb29rIHVwIHdoZXJlIHRoZSB2ZXJ0ZXggZGF0YSBuZWVkcyB0byBnby5cbnZhciBwb3NpdGlvbkxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpO1xudmFyIHRleGNvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4Y29vcmRcIik7XG5cbi8vIGxvb2t1cCB1bmlmb3Jtc1xudmFyIG1hdHJpeExvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidV9tYXRyaXhcIik7XG52YXIgdGV4dHVyZU1hdHJpeExvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidV90ZXh0dXJlTWF0cml4XCIpO1xudmFyIHRleHR1cmVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfdGV4dHVyZVwiKTtcblxuLy8gQ3JlYXRlIGEgYnVmZmVyLlxudmFyIHBvc2l0aW9uQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG5nbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcG9zaXRpb25CdWZmZXIpO1xuXG4vLyBQdXQgYSB1bml0IHF1YWQgaW4gdGhlIGJ1ZmZlclxudmFyIHBvc2l0aW9ucyA9IFtcbiAgICAwLCAwLFxuICAgIDAsIDEsXG4gICAgMSwgMCxcbiAgICAxLCAwLFxuICAgIDAsIDEsXG4gICAgMSwgMSxcbl1cbmdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucyksIGdsLlNUQVRJQ19EUkFXKTtcblxuLy8gQ3JlYXRlIGEgYnVmZmVyIGZvciB0ZXh0dXJlIGNvb3Jkc1xudmFyIHRleGNvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG5nbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4Y29vcmRCdWZmZXIpO1xuXG4vLyBQdXQgdGV4Y29vcmRzIGluIHRoZSBidWZmZXJcbnZhciB0ZXhjb29yZHMgPSBbXG4gICAgMCwgMCxcbiAgICAwLCAxLFxuICAgIDEsIDAsXG4gICAgMSwgMCxcbiAgICAwLCAxLFxuICAgIDEsIDEsXG5dXG5nbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0ZXhjb29yZHMpLCBnbC5TVEFUSUNfRFJBVyk7XG5cbi8vIGNyZWF0ZXMgYSB0ZXh0dXJlIGluZm8geyB3aWR0aDogdywgaGVpZ2h0OiBoLCB0ZXh0dXJlOiB0ZXggfVxuLy8gVGhlIHRleHR1cmUgd2lsbCBzdGFydCB3aXRoIDF4MSBwaXhlbHMgYW5kIGJlIHVwZGF0ZWRcbi8vIHdoZW4gdGhlIGltYWdlIGhhcyBsb2FkZWRcbmZ1bmN0aW9uIGxvYWRJbWFnZUFuZENyZWF0ZVRleHR1cmVJbmZvKHVybCkge1xuICAgIHZhciB0ZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcbiAgICAvLyBGaWxsIHRoZSB0ZXh0dXJlIHdpdGggYSAxeDEgYmx1ZSBwaXhlbC5cbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIDEsIDEsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsXG4gICAgICAgICAgICBuZXcgVWludDhBcnJheShbMCwgMCwgMjU1LCAyNTVdKSk7XG5cbiAgICAvLyBsZXQncyBhc3N1bWUgYWxsIGltYWdlcyBhcmUgbm90IGEgcG93ZXIgb2YgMlxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xuXG4gICAgdmFyIHRleHR1cmVJbmZvID0ge1xuICAgICAgICB3aWR0aDogMSwgICAvLyB3ZSBkb24ndCBrbm93IHRoZSBzaXplIHVudGlsIGl0IGxvYWRzXG4gICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgdGV4dHVyZTogdGV4LFxuICAgIH07XG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRleHR1cmVJbmZvLndpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICB0ZXh0dXJlSW5mby5oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmVJbmZvLnRleHR1cmUpO1xuICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltZyk7XG4gICAgfSk7XG4gICAgaW1nLnNyYyA9IHVybDtcblxuICAgIHJldHVybiB0ZXh0dXJlSW5mbztcbn1cblxudmFyIHRleHR1cmUgPSBsb2FkSW1hZ2VBbmRDcmVhdGVUZXh0dXJlSW5mbygnLi9pbWcvc3ByaXRlc2hlZXQucG5nJyk7XG5cblxuLy8gVW5saWtlIGltYWdlcywgdGV4dHVyZXMgZG8gbm90IGhhdmUgYSB3aWR0aCBhbmQgaGVpZ2h0IGFzc29jaWF0ZWRcbi8vIHdpdGggdGhlbSBzbyB3ZSdsbCBwYXNzIGluIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoZSB0ZXh0dXJlXG5mdW5jdGlvbiBkcmF3SW1hZ2UoXG4gICAgICAgIHNyY1gsIHNyY1ksIHNyY1dpZHRoLCBzcmNIZWlnaHQsXG4gICAgICAgIGRzdFgsIGRzdFksIGRzdFdpZHRoLCBkc3RIZWlnaHRcbiAgICAgICAgKSB7XG4gICAgdmFyIHNyY1JvdGF0aW9uID0gMDtcbiAgICBpZiAoZHN0WCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRzdFggPSBzcmNYO1xuICAgICAgICBzcmNYID0gMDtcbiAgICB9XG4gICAgaWYgKGRzdFkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkc3RZID0gc3JjWTtcbiAgICAgICAgc3JjWSA9IDA7XG4gICAgfVxuICAgIGlmIChzcmNXaWR0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNyY1dpZHRoID0gdGV4dHVyZS53aWR0aDtcbiAgICB9XG4gICAgaWYgKHNyY0hlaWdodCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNyY0hlaWdodCA9IHRleHR1cmUuaGVpZ2h0O1xuICAgIH1cbiAgICBpZiAoZHN0V2lkdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkc3RXaWR0aCA9IHNyY1dpZHRoO1xuICAgICAgICBzcmNXaWR0aCA9IHRleHR1cmUud2lkdGg7XG4gICAgfVxuICAgIGlmIChkc3RIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkc3RIZWlnaHQgPSBzcmNIZWlnaHQ7XG4gICAgICAgIHNyY0hlaWdodCA9IHRleHR1cmUuaGVpZ2h0O1xuICAgIH1cblxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUudGV4dHVyZSk7XG5cbiAgICAvLyBUZWxsIFdlYkdMIHRvIHVzZSBvdXIgc2hhZGVyIHByb2dyYW0gcGFpclxuICAgIGdsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XG5cbiAgICAvLyBTZXR1cCB0aGUgYXR0cmlidXRlcyB0byBwdWxsIGRhdGEgZnJvbSBvdXIgYnVmZmVyc1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwb3NpdGlvbkJ1ZmZlcik7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocG9zaXRpb25Mb2NhdGlvbik7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwb3NpdGlvbkxvY2F0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0ZXhjb29yZEJ1ZmZlcik7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGV4Y29vcmRMb2NhdGlvbik7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih0ZXhjb29yZExvY2F0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgLy8gdGhpcyBtYXRpcnggd2lsbCBjb252ZXJ0IGZyb20gcGl4ZWxzIHRvIGNsaXAgc3BhY2VcbiAgICB2YXIgbWF0cml4ID0gbTQub3J0aG9ncmFwaGljKDAsIHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCwgMCwgLTEsIDEpO1xuXG4gICAgLy8gdGhpcyBtYXRyaXggbW92ZXMgdGhlIG9yaWdpbiB0byB0aGUgb25lIHJlcHJlc2VudGVkIGJ5XG4gICAgLy8gdGhlIGN1cnJlbnQgbWF0cml4IHN0YWNrLlxuICAgIG1hdHJpeCA9IG00Lm11bHRpcGx5KG1hdHJpeCwgbWF0cml4U3RhY2suZ2V0Q3VycmVudE1hdHJpeCgpKTtcblxuICAgIG1hdHJpeCA9IG00LnRyYW5zbGF0ZShtYXRyaXgsIGRzdFgsIGRzdFksIDApO1xuXG4gICAgLy8gdGhpcyBtYXRyaXggd2lsbCBzY2FsZSBvdXIgMSB1bml0IHF1YWRcbiAgICAvLyBmcm9tIDEgdW5pdCB0byB0ZXh0dXJlLndpZHRoLCB0ZXh0dXJlLmhlaWdodCB1bml0c1xuICAgIG1hdHJpeCA9IG00LnNjYWxlKG1hdHJpeCwgZHN0V2lkdGgsIGRzdEhlaWdodCwgMSk7XG5cbiAgICAvLyBTZXQgdGhlIG1hdHJpeC5cbiAgICBnbC51bmlmb3JtTWF0cml4NGZ2KG1hdHJpeExvY2F0aW9uLCBmYWxzZSwgbWF0cml4KTtcblxuICAgIC8vIGp1c3QgbGlrZSBhIDJkIHByb2plY3Rpb24gbWF0cml4IGV4Y2VwdCBpbiB0ZXh0dXJlIHNwYWNlICgwIHRvIDEpXG4gICAgLy8gaW5zdGVhZCBvZiBjbGlwIHNwYWNlLiBUaGlzIG1hdHJpeCBwdXRzIHVzIGluIHBpeGVsIHNwYWNlLlxuICAgIHZhciB0ZXhNYXRyaXggPSBtNC5zY2FsaW5nKDEgLyB0ZXh0dXJlLndpZHRoLCAxIC8gdGV4dHVyZS5oZWlnaHQsIDEpO1xuXG4gICAgLy8gV2UgbmVlZCB0byBwaWNrIGEgcGxhY2UgdG8gcm90YXRlIGFyb3VuZFxuICAgIC8vIFdlJ2xsIG1vdmUgdG8gdGhlIG1pZGRsZSwgcm90YXRlLCB0aGVuIG1vdmUgYmFja1xuICAgIHZhciB0ZXhNYXRyaXggPSBtNC50cmFuc2xhdGUodGV4TWF0cml4LCAoc3JjWCArIHNyY1dpZHRoICogMC41KSwgKHNyY1kgKyBzcmNIZWlnaHQgKiAwLjUpLCAwKTtcbiAgICB2YXIgdGV4TWF0cml4ID0gbTQuelJvdGF0ZSh0ZXhNYXRyaXgsIHNyY1JvdGF0aW9uKTtcbiAgICB2YXIgdGV4TWF0cml4ID0gbTQudHJhbnNsYXRlKHRleE1hdHJpeCwgLShzcmNYICsgc3JjV2lkdGggKiAwLjUpLCAtKHNyY1kgKyBzcmNIZWlnaHQgKiAwLjUpLCAwKTtcblxuICAgIC8vIGJlY2F1c2Ugd2VyZSBpbiBwaXhlbCBzcGFjZVxuICAgIC8vIHRoZSBzY2FsZSBhbmQgdHJhbnNsYXRpb24gYXJlIG5vdyBpbiBwaXhlbHNcbiAgICB2YXIgdGV4TWF0cml4ID0gbTQudHJhbnNsYXRlKHRleE1hdHJpeCwgc3JjWCwgc3JjWSwgMCk7XG4gICAgdmFyIHRleE1hdHJpeCA9IG00LnNjYWxlKHRleE1hdHJpeCwgc3JjV2lkdGgsIHNyY0hlaWdodCwgMSk7XG5cbiAgICAvLyBTZXQgdGhlIHRleHR1cmUgbWF0cml4LlxuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYodGV4dHVyZU1hdHJpeExvY2F0aW9uLCBmYWxzZSwgdGV4TWF0cml4KTtcblxuICAgIC8vIFRlbGwgdGhlIHNoYWRlciB0byBnZXQgdGhlIHRleHR1cmUgZnJvbSB0ZXh0dXJlIHVuaXQgMFxuICAgIGdsLnVuaWZvcm0xaSh0ZXh0dXJlTG9jYXRpb24sIDApO1xuXG4gICAgLy8gZHJhdyB0aGUgcXVhZCAoMiB0cmlhbmdsZXMsIDYgdmVydGljZXMpXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIDYpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkcmF3SW1nOiBkcmF3SW1hZ2UsXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBnbC52aWV3cG9ydCgwLCAwLCBzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpO1xuXG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH0sXG4gICAgbWF0cml4OiBtYXRyaXhTdGFjayxcbiAgICBzY3JlZW5EaW1lbnNpb25zOiB7XG4gICAgICAgIHg6IHNjcmVlbi53aWR0aCxcbiAgICAgICAgeTogc2NyZWVuLmhlaWdodFxuICAgIH1cbn07XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgbGV2ZWwgPSB7fTtcbmxldmVsLmdhbWUgPSByZXF1aXJlKCcuL2xldmVsLmpzJyk7XG5sZXZlbC50ZXN0ID0gcmVxdWlyZSgnLi90ZXN0LWxldmVsLmpzJyk7XG52YXIgRW50aXRpZXMgPSByZXF1aXJlKCcuL2dldEVudGl0aWVzLmpzJyk7XG52YXIgY2lyY2xlcyA9IFtdO1xudmFyIHNxdWFyZXMgPSBbXTtcbnZhciBwb2ludHMgPSBbXTtcbnZhciB4cyA9IFtdO1xuXG52YXIgZ2V0ID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgIHZhciBodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICBodHRwLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG5cbiAgICAvL1NlbmQgdGhlIHByb3BlciBoZWFkZXIgaW5mb3JtYXRpb24gYWxvbmcgd2l0aCB0aGUgcmVxdWVzdFxuICAgIGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xuXG4gICAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGE7XG4gICAgICAgIGlmKChodHRwLnJlYWR5U3RhdGUgPT09IDQpICYmIGh0dHAuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGh0dHAucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGh0dHAuc2VuZCgpO1xuXG59O1xuXG52YXIgd29ybGQgPSBbXTtcbnZhciBuZXdJdGVtcyA9IFtdO1xuXG52YXIgYXBpID0ge1xuICAgIHVubG9hZFdvcmxkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgd29ybGQuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnVubG9hZCgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGxvYWRMZXZlbDogZnVuY3Rpb24obGV2ZWxJZCkge1xuICAgICAgICBhcGkudW5sb2FkV29ybGQoKTtcbiAgICAgICAgLy9nZXQoJy4vbGV2ZWxzLycgKyBsZXZlbCwgYXBpLmxvYWRJdGVtcyk7XG4gICAgICAgIGFwaS5sb2FkSXRlbXMobGV2ZWxbbGV2ZWxJZF0pO1xuICAgICAgICBhcGkuc3RlcCgpO1xuICAgIH0sXG4gICAgbG9hZEl0ZW1zOiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICBcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgICAgICAgICAgaXRlbXMgPSBbaXRlbXNdO1xuICAgICAgICB9XG5cbiAgICAgICAgaXRlbXMgPSBpdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdmFyIGVudGl0eSA9IGl0ZW07XG4gICAgICAgICAgICBpZiAoIWVudGl0eS50eXBlKSBlbnRpdHkgPSBFbnRpdGllc1tpdGVtLmVudGl0eV0oaXRlbSk7XG4gICAgICAgICAgICBlbnRpdHkubG9hZCgpO1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0eTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld0l0ZW1zID0gbmV3SXRlbXMuY29uY2F0KGl0ZW1zKTtcbiAgICB9LFxuICAgIGdldEl0ZW1zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkLnNsaWNlKCk7XG4gICAgfSxcbiAgICBnZXRJdGVtQnlJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5pZCA9PT0gaWQpIHJldHVybiB0cnVlO1xuICAgICAgICB9KVswXTtcbiAgICB9LFxuICAgIGdldEl0ZW1zQnlUeXBlOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHJldHVybiB3b3JsZC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gdHlwZSkgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgd29ybGQgPSB3b3JsZC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyBpZiAoaXRlbS5pZCAhPT0gaWQpIHJldHVybiB0cnVlOyB9KTtcbiAgICB9LFxuICAgIGdldFhzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHhzO1xuICAgIH0sXG4gICAgc3RlcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdvcmxkID0gd29ybGQuY29uY2F0KG5ld0l0ZW1zKTtcbiAgICAgICAgeHMgPSBbXTtcbiAgICAgICAgeXMgPSBbXTtcbiAgICAgICAgbmV3SXRlbXMgPSBbXTtcbiAgICAgICAgY2lyY2xlcyA9IFtdO1xuICAgICAgICBzcXVhcmVzID0gW107XG4gICAgICAgIHBvaW50cyA9IFtdO1xuICAgICAgICB3b3JsZC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsgXG4gICAgICAgICAgICBpZiAoaXRlbS5nZW9tZXRyeSA9PT0gJ2NpcmNsZScgJiYgaXRlbS5zb2xpZCkgY2lyY2xlcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGl0ZW0uZ2VvbWV0cnkgPT09ICdzcXVhcmUnICYmIGl0ZW0uc29saWQpIHNxdWFyZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIGlmIChpdGVtLmdlb21ldHJ5ID09PSAncG9pbnQnICYmIGl0ZW0uc29saWQpIHBvaW50cy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgaXRlbS5jb2xsaXNpb25EYXRhID0ge307XG4gICAgICAgICAgICBpdGVtLnN0ZXAuY2FsbChpdGVtKTsgXG4gICAgICAgICAgICBpZiAoaXRlbS5nZW9tZXRyeSAmJiBpdGVtLnNvbGlkICYmICFpdGVtLmluQ29udGFpbmVyKCkpIHhzID0geHMuY29uY2F0KGl0ZW0uQUFCQi54cyk7XG4gICAgICAgIH0pO1xuICAgICAgICB3b3JsZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLm9uVG9wO1xuICAgICAgICB9KTtcbiAgICAgICAgeHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gKGEudmFsID4gYi52YWwpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldEdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICAgIGlmIChnZW9tZXRyeSA9PT0gJ2NpcmNsZScpIHJldHVybiBjaXJjbGVzO1xuICAgICAgICBpZiAoZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSByZXR1cm4gc3F1YXJlcztcbiAgICAgICAgaWYgKGdlb21ldHJ5ID09PSAncG9pbnQnKSByZXR1cm4gcG9pbnRzO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
