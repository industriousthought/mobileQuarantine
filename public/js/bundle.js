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

},{"./character.js":7,"./events.js":13}],2:[function(require,module,exports){
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

},{"./character.js":7}],3:[function(require,module,exports){
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

},{"./getId.js":16,"./makeSolid.js":22,"./square.js":30}],5:[function(require,module,exports){
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


},{"./getId.js":16}],6:[function(require,module,exports){
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

},{"./makeSolid.js":22,"./projectile.js":26}],7:[function(require,module,exports){
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


},{"./baseEntity.js":5,"./makeGeometry.js":20,"./makeInventory.js":21,"./makeSolid.js":22,"./makeVisible.js":24}],8:[function(require,module,exports){
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



},{"./world.js":37}],9:[function(require,module,exports){
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
        if (y < -90) y = -90;
        if (x < -90) x = -90;
        if (y > 90) y = 90;
        if (x > 90) x = 90;
        player.lookAtVec({x: x, y: y});
        player.push({x: -x / 5, y: -y / 5});
        console.log({x: -x / 5, y: -y / 5});
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

},{"./dom.js":10,"./events.js":13,"./getId.js":16}],10:[function(require,module,exports){
document.oncontextmenu = function() { return false; }
var loaded = false;
var events = require('./events.js');
var getId = require('./getId.js').getId;
var effects = require('./effects.js');
var objs = {};
var menus = {};
var inputs = {};
window.functions = {};
var menuCloseEvents = {};
var loadEvents = [];
var canvases = {};
var oldWeapons = [];
var iconEvents = [];
var weaponIcons = [];


window.onload = function() { 
    [].slice.call(document.getElementsByClassName('menus')).forEach(function(obj, index, array) { 
        menus[obj.id] = obj; 
        effects.fadeOut(obj);
    });
    [].slice.call(document.getElementsByClassName('domobj')).forEach(function(obj, index, array) { 
        objs[obj.id] = obj; 
    });
    [].slice.call(document.getElementsByTagName('input')).forEach(function(obj, index, array) { 
        inputs[obj.id] = obj; 
    });
    //objs['modalAck'].addEventListener('click', function() { effects.fadeOut(objs['modal']); });
    objs['window'] = window;
    loaded = true; 
    loadEvents.forEach(function(ev) { ev(); }); 
};

var ensureObjId = function(obj) {
    if (obj.id) return obj.id;
    obj.id = getId();
    objs[obj.id] = obj;
    return obj.id;
};

var resetCanvas = function(canvas) {
    var canvasWidth = canvas.getAttribute('width');
    var canvasHeight = canvas.getAttribute('height');
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    if (canvasWidth / canvasHeight > screenWidth / screenHeight) {
        canvas.style.width = screenWidth + 'px';
        canvas.style.height = screenWidth * (canvasHeight / canvasWidth) + 'px';
        canvas.style.top = (screenHeight - (screenWidth * (canvasHeight / canvasWidth))) / 2 + 'px';
        canvas.style.left = '0px'; 
    } else {
        canvas.style.height = screenHeight + 'px';
        canvas.style.width = screenHeight * (canvasWidth / canvasHeight) + 'px';
        canvas.style.left = (screenWidth - (screenHeight * (canvasWidth / canvasHeight))) / 2 + 'px';
        canvas.style.top = '0px'; 
    }
};



var api = {
    setCanvas: function(id, dim) {
        if (dim) {
            objs[id].setAttribute('width', dim.width);
            objs[id].setAttribute('height', dim.height);
            if (!canvases[id]) {
                canvases[id] = objs[id];
                resetCanvas(objs[id]);
                api.attachEvent('window', 'resize', resetCanvas.bind(null, objs[id]));
            } 
        }
        return objs[id].getContext('webgl');
    },
    clearInputs: function(ancestor) {
        ancestor = api.getObjById(ancestor);
        for (var input in inputs) {
            if (ancestor.contains(inputs[input])) inputs[input].value = '';
        }
    },
    onHideMenu: function(id, func) {
        if (!menuCloseEvents[id]) menuCloseEvents[id] = [];
        menuCloseEvents[id].push(func);
    },
    hideMenu: function(id) {
        if (id) {
            effects.fadeOut(menus[id]);
            if (menuCloseEvents[id]) {
                menuCloseEvents[id].forEach(function(f) { f(); });
                menuCloseEvents[id] = [];
            }
            return;
        }
        for (var menu in menus) {
            if (menus[menu].id !== 'worldInspector') {
                effects.fadeOut(menus[menu]);
                if (menuCloseEvents[menu]) {
                    menuCloseEvents[menu].forEach(function(f) { f(); });
                    menuCloseEvents[menu] = [];
                }
            }
        }
    },
    showMenu: function(id, pos) {
        effects.fadeIn(menus[id]);
        if (pos) {
            menus[id].style.left = parseInt(pos.x - 20) + 'px';
            menus[id].style.top = parseInt(pos.y - 20) + 'px';
        }
    },
    getItemsByClass: function(c) {
        return [].slice.call(document.getElementsByClassName(c)).map(function(item) {
            return item.id;
        });;
    },
    addListItem: function(ul, li) {
        objs[ul].appendChild(objs[li]);
    },
    addMenuListItem: function(id, text, click, mouseover) {
        var li = document.createElement('li');
        var span = document.createElement('span');
        ensureObjId(li);
        span.innerText = text;
        li.appendChild(span);
        if (click) span.addEventListener('click', click);
        if (mouseover) span.addEventListener('mouseover', mouseover);
        objs[id].appendChild(li);
        return li.id;
    },
    clearListItems: function(id) {
        [].slice.call(objs[id].children).forEach(function(child) {
           if (!child.className.split(' ').reduce(function(a, b) {
                if (a) return true;
                if (b === 'listItem') return true;
                return false;
           }, false)) objs[id].removeChild(child);
        });
    },
    getInputsValues: function(ancestor) {
        return [].slice.call(document.getElementsByTagName('select')).
            concat([].slice.call(document.getElementsByTagName('input'))).
            filter(function(item) {
                return (objs[ancestor].contains(item));
            }).map(function(item) {
                return {id: item.id, value: item.value};
            });
    },
    onload: function(ev) {
        if (loaded) return ev();
        loadEvents.push(ev);
    },
    getGenericListItem: function() {
        return document.getElementsByClassName('genericListItem')[0].cloneNode(true);
    },
    attachEvent: function(id, type, func) {
        if (id.cloneNode) id = ensureObjId(id);
        var fid = getId();
        functions[fid] = {f: func, id: id, type: type};
        api.onload(function() { 
            objs[id].addEventListener(type, func); 
        });
        return fid;
    },
    detachEvent: function(fid) {
        var ev = functions[fid];
        if (objs[ev.id].removeEventListener) objs[ev.id].removeEventListener(ev.type, ev.f);
        delete functions[fid];
    },
    display: function(id) {
        [].slice.call(document.getElementsByClassName('slides')).forEach(function(obj) { effects.fadeOut(obj); });
        effects.fadeIn(objs[id]);
    },
    getObjById: function(id) {
        return objs[id];
    },
    getGenericButton: function(text, click, mouseover) {
        var button = document.createElement('button');
        button.innerText = text;
        if (click) button.addEventListener('click', click);
        if (mouseover) button.addEventListener('mouseover', mouseover);
        return button;
    },
    modal: function(msg) {
        api.getObjById('modalMsg').innerText = msg;
        effects.fadeIn(api.getObjById('modal'));
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

for (var i = 0; i < 4; i++) {
    weaponIcons.push(document.createElement('li'));
    weaponIcons[i].className = 'weaponicon';
    (function() { 
        var j = i;
        if (objs['weaponOptions']) api.onload(function() { 
            objs['weaponOptions'].appendChild(weaponIcons[j]); 
        });
    })();
}
module.exports = api;

},{"./effects.js":12,"./events.js":13,"./getId.js":16}],11:[function(require,module,exports){
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


},{"./makeStartOptions.js":23,"./wall.js":34}],12:[function(require,module,exports){
module.exports = {
    fadeIn: function(obj) {
        obj.style.opacity = 1;
        obj.style.zIndex = 3;
        obj.style.display = 'inherit';
    },
    fadeOut: function(obj) {
        obj.style.opacity = 0;
        obj.style.zIndex = 1;
        obj.style.display = 'none';
    }
};

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){

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


},{}],15:[function(require,module,exports){
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

},{"./Player.js":1,"./Zombie.js":2,"./area.js":4,"./door.js":11,"./gun.js":17,"./spawner.js":28,"./square.js":30,"./test-obj.js":32,"./wall.js":34}],16:[function(require,module,exports){
var lastId = 0;

var api = {
    getId: function() {
        return 'a' + lastId++;
    }
};

module.exports = api;

},{}],17:[function(require,module,exports){
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




},{"./bullet.js":6,"./makeInventory.js":21,"./weapon.js":35}],18:[function(require,module,exports){
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



},{}],19:[function(require,module,exports){
require('./animationShim.js');
window.logging = [];
var events = require('./events.js');
var get = require('./get.js');
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
            dom.display('mainMenu');
            dom.clearListItems('ownerLevels');
            dom.clearListItems('publicLevels');
            get('./levels/', function(data) {
                data.forEach(function(level) {
                    var list = 'ownerLevels';
                    if (level.snapshot) list = 'publicLevels';
                    var li = dom.addMenuListItem(list, level.name, function() {
                        world.loadLevel(level.id, function() {
                            states.startGame();
                        });
                    });
                });
            });
        },
        startGame: function() {
            player = world.getItemsByType('player')[0];
            controller.connectPlayer(player);
            renderer.connectCamera(player);
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

    

    events.register('pause', states.pausedGame, getId());

    events.register('gameOver', states.viewingStats, getId());
    events.register('mainMenu', states.mainMenu, getId());
    states.mainMenu();

});







},{"./animationShim.js":3,"./collision.js":8,"./controller.js":9,"./dom.js":10,"./events.js":13,"./get.js":14,"./getId.js":16,"./renderer.js":27,"./world.js":37}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){

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


},{}],22:[function(require,module,exports){
module.exports = function(obj) {
    obj.solid = true;
};

},{}],23:[function(require,module,exports){


module.exports = function(obj) {
    var startOptions = {};
    obj.startOptions = function(options) {
        if (!options) return startOptions;
        for (var option in options) {
            startOptions[option] = options[option];
        }
    };
};

},{}],24:[function(require,module,exports){
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

},{"./textureData.js":33}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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


},{"./baseEntity.js":5,"./makeGeometry.js":20,"./makeVisible.js":24}],27:[function(require,module,exports){
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

},{"./webgl.js":36,"./world.js":37,"events":38}],28:[function(require,module,exports){
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


},{"./Zombie.js":2,"./baseEntity.js":5,"./makeGeometry.js":20,"./makeStartOptions.js":23}],29:[function(require,module,exports){
module.exports = {"frames":{"bullet":{"frame":{"x":453,"y":922,"w":201,"h":46},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":201,"h":46},"sourceSize":{"w":201,"h":46}},"machinegun":{"frame":{"x":0,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"pistol":{"frame":{"x":151,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"player":{"frame":{"x":0,"y":0,"w":1500,"h":280},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":280},"sourceSize":{"w":1500,"h":280}},"shotgun":{"frame":{"x":302,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"wall":{"frame":{"x":453,"y":969,"w":100,"h":100},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":100,"h":100},"sourceSize":{"w":100,"h":100}},"zombie1":{"frame":{"x":0,"y":1760,"w":1500,"h":560},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":560},"sourceSize":{"w":1500,"h":560}},"zombie2":{"frame":{"x":0,"y":281,"w":1500,"h":640},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":640},"sourceSize":{"w":1500,"h":640}},"zombie3":{"frame":{"x":0,"y":1634,"w":1500,"h":686},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":686},"sourceSize":{"w":1500,"h":686}}},"meta":{"app":"https://www.leshylabs.com/apps/sstool/","version":"Leshy SpriteSheet Tool v0.8.4","image":"spritesheet.png","size":{"w":1500,"h":2320},"scale":1}};

},{}],30:[function(require,module,exports){
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

},{"./baseEntity.js":5,"./makeGeometry.js":20,"./makeVisible.js":24}],31:[function(require,module,exports){
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



},{}],32:[function(require,module,exports){
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


},{"./baseEntity.js":5,"./makeGeometry.js":20,"./makeSolid.js":22}],33:[function(require,module,exports){
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

},{"./sprites.js":29}],34:[function(require,module,exports){
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

},{"./makeSolid.js":22,"./makeVisible.js":24,"./square.js":30}],35:[function(require,module,exports){
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

},{"./baseEntity.js":5,"./makeGeometry.js":20,"./makeInventory.js":21,"./makeSolid.js":22,"./makeVisible.js":24}],36:[function(require,module,exports){
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

},{"./get.js":14,"./matrixStack.js":25}],37:[function(require,module,exports){
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

},{"./events.js":13,"./get.js":14,"./getEntities.js":15,"./level.js":18,"./test-level.js":31}],38:[function(require,module,exports){
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

},{}]},{},[19])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIlBsYXllci5qcyIsIlpvbWJpZS5qcyIsImFuaW1hdGlvblNoaW0uanMiLCJhcmVhLmpzIiwiYmFzZUVudGl0eS5qcyIsImJ1bGxldC5qcyIsImNoYXJhY3Rlci5qcyIsImNvbGxpc2lvbi5qcyIsImNvbnRyb2xsZXIuanMiLCJkb20uanMiLCJkb29yLmpzIiwiZWZmZWN0cy5qcyIsImV2ZW50cy5qcyIsImdldC5qcyIsImdldEVudGl0aWVzLmpzIiwiZ2V0SWQuanMiLCJndW4uanMiLCJsZXZlbC5qcyIsIm1haW4uanMiLCJtYWtlR2VvbWV0cnkuanMiLCJtYWtlSW52ZW50b3J5LmpzIiwibWFrZVNvbGlkLmpzIiwibWFrZVN0YXJ0T3B0aW9ucy5qcyIsIm1ha2VWaXNpYmxlLmpzIiwibWF0cml4U3RhY2suanMiLCJwcm9qZWN0aWxlLmpzIiwicmVuZGVyZXIuanMiLCJzcGF3bmVyLmpzIiwic3ByaXRlcy5qcyIsInNxdWFyZS5qcyIsInRlc3QtbGV2ZWwuanMiLCJ0ZXN0LW9iai5qcyIsInRleHR1cmVEYXRhLmpzIiwid2FsbC5qcyIsIndlYXBvbi5qcyIsIndlYmdsLmpzIiwid29ybGQuanMiLCIuLi8uLi8uLi8uLi8uLi91c3IvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBDaGFyYWN0ZXIgPSByZXF1aXJlKCcuL2NoYXJhY3Rlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgIHZhciBwbGF5ZXIgPSBDaGFyYWN0ZXIoe1xuICAgICAgICBwb3M6IG9wdGlvbnMucG9zLFxuICAgICAgICB0eXBlOiAncGxheWVyJyxcbiAgICAgICAgbW9kZTogJ3N0YW5kaW5nJyxcbiAgICAgICAgbW9kZXM6IHtcbiAgICAgICAgICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmVtaXQoJ2RpZScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YW5kaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9zZS55ID0gMDtcbiAgICAgICAgICAgICAgICBwbGF5ZXIudmVsb2NpdHkgPSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2Fsa2luZzogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG9vdGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnBvc2UueSA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHBsYXllci5jdXJyZW50V2VhcG9ucy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICAgICAgICAgICAgICB2YXIgY29vbERvd24gPSBwbGF5ZXIuY3VycmVudFdlYXBvbnNbcGxheWVyLndlaWxkaW5nXS5jb29sRG93bjtcbiAgICAgICAgICAgICAgICB2YXIgdGljayA9IGNvb2xEb3duIC0gMTtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuYWRkRWZmZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGxheWVyLmN1cnJlbnRNb2RlICE9PSAnc2hvb3RpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRpY2srKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpY2sgPiBjb29sRG93bikgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllci5jdXJyZW50V2VhcG9uc1twbGF5ZXIud2VpbGRpbmddLnVzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29sbGlkZTogZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIuYmFzZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3dlYXBvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmICghY29sbGlkZXIuaW5Db250YWluZXIoKSkgcGxheWVyLnRha2VJdGVtcyhjb2xsaWRlcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3pvbWJpZSc6XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5lbWl0KCdnYW1lT3ZlcicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZ2FtZW92ZXJycnJycicpO1xuICAgICAgICAgICAgICAgICAgICAvL3BsYXllci5oZWFsdGggLT0gMC40O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhcmVhJzogXG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9KTtcbiAgICBwbGF5ZXIubmV4dFdlYXBvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwbGF5ZXIud2VpbGRpbmcrKztcbiAgICAgICAgaWYgKHdlaWxkaW5nID09PSBwbGF5ZXIuY3VycmVudFdlYXBvbnMubGVuZ3RoKSB3ZWlsZGluZyA9IDA7XG4gICAgfTtcbiAgICBwbGF5ZXIud2VpbGRpbmcgPSAwO1xuICAgIHBsYXllci5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBsYXllci5jdXJyZW50V2VhcG9ucyA9IHBsYXllci5nZXRJbnZlbnRvcnlCeUJhc2UoJ3dlYXBvbicpO1xuICAgICAgICBwbGF5ZXIuY3VycmVudFdlYXBvbnMuZm9yRWFjaChmdW5jdGlvbih3ZWFwb24sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAod2VhcG9uLnNlbGVjdFdlYXBvbikgcGxheWVyLndlaWxkaW5nID0gaW5kZXg7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuXG4gICAgcmV0dXJuIHBsYXllcjtcbn07XG4iLCJ2YXIgQ2hhcmFjdGVyID0gcmVxdWlyZSgnLi9jaGFyYWN0ZXIuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICB2YXIgY3VycmVudEF0dHJhY3RvciA9IGZhbHNlO1xuICAgIHZhciBzcGVlZCA9IDEgKyBNYXRoLnJhbmRvbSgpICogMztcblxuICAgIHZhciB6b21iaWUgPSBDaGFyYWN0ZXIoe1xuICAgICAgICB0eXBlOiAnem9tYmllJyxcbiAgICAgICAgbW9kZTogJ3dhbmRlcmluZycsXG4gICAgICAgIHBvczogb3B0aW9ucy5wb3MsXG4gICAgICAgIG1vZGVzOiB7XG4gICAgICAgICAgICByZXdhbmRlcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgem9tYmllLmFkZE1vZGUoJ3dhbmRlcmluZycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdhbmRlcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnd2FuZGVyaW5nJyk7XG4gICAgICAgICAgICAgICAgLy9pZiAoTWF0aC5yYW5kb20oKSA8IDAuMDUpIHpvbWJpZS5hdWRpbyA9ICdncm93bCc7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVMZW5ndGggPSAxICsgcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDMgKiAxMDAwKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tU3BlZWQgPSBNYXRoLnJhbmRvbSgpICogMjtcbiAgICAgICAgICAgICAgICB6b21iaWUucG9zLnJvdCA9IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMjtcbiAgICAgICAgICAgICAgICB6b21iaWUucG9zZS55ID0gMTtcblxuICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoem9tYmllLmN1cnJlbnRNb2RlICE9PSAnd2FuZGVyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFRpbWUgKyB0aW1lTGVuZ3RoIDwgbm93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgncmV3YW5kZXJpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgem9tYmllLnB1c2goe3g6IE1hdGguY29zKHpvbWJpZS5wb3Mucm90KSAqIHJhbmRvbVNwZWVkLCB5OiBNYXRoLnNpbih6b21iaWUucG9zLnJvdCkgKiByYW5kb21TcGVlZH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZWFyY2hpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoYXNpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IHpvbWJpZS5sb29rQXRPYmooY3VycmVudEF0dHJhY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh6b21iaWUuY3VycmVudE1vZGUgIT09ICdjaGFzaW5nJyB8fCAhY3VycmVudEF0dHJhY3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHpvbWJpZS5wdXNoKHt4OiBNYXRoLmNvcyh0aGV0YSkgKiBzcGVlZCAvIDIsIHk6IE1hdGguc2luKHRoZXRhKSAqIHNwZWVkIC8gMn0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBydW5uaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiaXRpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YWdnZXJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgem9tYmllLnVubG9hZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb2xsaWRlOiBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYnVsbGV0JzpcbiAgICAgICAgICAgICAgICBjYXNlICdtZWVsZWUnOlxuICAgICAgICAgICAgICAgICAgICB6b21iaWUuaGVhbHRoIC09IGNvbGxpZGVyLnBvd2VyIC8gMTAwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgem9tYmllLnN0ZXAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJlbnRBdHRyYWN0b3IgPSB3b3JsZC5nZXRJdGVtc0J5VHlwZSgncGxheWVyJylbMF07XG4gICAgICAgIGlmIChjdXJyZW50QXR0cmFjdG9yKSB7XG4gICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnY2hhc2luZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgem9tYmllLmFkZE1vZGUoJ3dhbmRlcmluZycpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gem9tYmllO1xufTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHZhciB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcbiAgICBmb3IodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXSBcbiAgICAgICAgICAgIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICB9XG5cbiAgICBpZiAoIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcbiAgICAgICAgICAgIHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVUb0NhbGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpXG4gICAgICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgICAgICAgICB9O1xufSgpKTtcbiIsInZhciBnZXRJZCA9IHJlcXVpcmUoJy4vZ2V0SWQuanMnKS5nZXRJZDtcbnZhciBzcXVhcmUgPSByZXF1aXJlKCcuL3NxdWFyZS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBvYmpFdmVudHMgPSBbXTtcbiAgICB2YXIgYXJlYSA9IHNxdWFyZShvcHRpb25zKTtcbiAgICBhcmVhLm9uVG9wID0gdHJ1ZTtcbiAgICBhcmVhLnR5cGUgPSAnYXJlYSc7XG4gICAgYXJlYS5wbGF5ZXJNZXNzYWdlID0gJyc7XG4gICAgYXJlYS5hZGRPYmpFdmVudCA9IGZ1bmN0aW9uKHRyaWdnZXIsIHZlcmIsIG5vdW4pIHtcbiAgICAgICAgdmFyIGlkID0gZ2V0SWQoKTtcbiAgICAgICAgb2JqRXZlbnRzLnB1c2goe2lkOiBpZCwgdHJpZ2dlcjogdHJpZ2dlciwgdmVyYjogdmVyYiwgbm91bjogbm91bn0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcbiAgICBhcmVhLmRlbGV0ZU9iakV2ZW50ID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgb2JqRXZlbnRzID0gb2JqRXZlbnRzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IHJldHVybiAoaXRlbS5pZCAhPT0gaWQpOyB9KTtcbiAgICB9O1xuICAgIGFyZWEuZ2V0T2JqRXZlbnQgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICBpZiAoaWQpIHJldHVybiBvYmpFdmVudHMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKGl0ZW0uaWQgPSBpZCkgcmV0dXJuIHRydWU7IH0pWzBdO1xuICAgICAgICByZXR1cm4gb2JqRXZlbnRzO1xuICAgIH07XG4gICAgYXJlYS5jb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgb2JqRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0udHJpZ2dlciA9PT0gY29sbGlkZXIudHlwZSB8fCBpdGVtLnRyaWdnZXIgPT09IGNvbGxpZGVyLmJhc2UpIHtcbiAgICAgICAgICAgICAgICB3b3JsZC5nZXRPYmpCeU5hbWUoaXRlbS5ub3VuKS52ZXJic1tpdGVtLnZlcmJdKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXJlYTtcbn07XG4iLCJ2YXIgZ2V0SWQgPSByZXF1aXJlKCcuL2dldElkLmpzJykuZ2V0SWQ7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHVzaEV2ZW50cyA9IFtdO1xuICAgIHZhciBtb3ZlRXZlbnRzID0gW107XG4gICAgdmFyIGxvYWRFdmVudHMgPSBbXTtcbiAgICB2YXIgdW5sb2FkRXZlbnRzID0gW107XG4gICAgdmFyIHN0ZXBFdmVudHMgPSBbXTtcbiAgICB2YXIgbG9hZGVkID0gZmFsc2U7XG4gICAgdmFyIG9iak5hbWUgPSBmYWxzZTtcbiAgICB2YXIgbW92ZWQgPSBmYWxzZTtcbiAgICB2YXIgbmV3RWZmZWN0cyA9IFtdO1xuICAgIHZhciBlZmZlY3RzID0gW107XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgICAgaW5Db250YWluZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICghIW9iai5vd25lcik7XG4gICAgICAgIH0sXG4gICAgICAgIHNldE9iak5hbWU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIG9iak5hbWUgPSBuYW1lO1xuICAgICAgICB9LFxuICAgICAgICBnZXRPYmpOYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmpOYW1lO1xuICAgICAgICB9LFxuICAgICAgICBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24oZSkgeyBlKCk7IH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRFdmVudHMgPSBhcmdzLmNvbmNhdChsb2FkRXZlbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFsb2FkZWQpIHtcbiAgICAgICAgICAgICAgICBsb2FkRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZSkgeyBlKCk7IH0pO1xuICAgICAgICAgICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHJldHVybiB1bmxvYWRFdmVudHMgPSBhcmdzLmNvbmNhdCh1bmxvYWRFdmVudHMpO1xuICAgICAgICAgICAgdW5sb2FkRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZSkgeyBlKCk7IH0pO1xuICAgICAgICAgICAgd29ybGQuZGVsZXRlSXRlbShvYmouaWQpO1xuICAgICAgICAgICAgaWYgKG9iai5vd25lcikgb2JqLm93bmVyLmRyb3BJdGVtKG9iaik7XG4gICAgICAgIH0sXG4gICAgICAgIHN0ZXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPiAwKSByZXR1cm4gc3RlcEV2ZW50cyA9IGFyZ3MuY29uY2F0KHN0ZXBFdmVudHMpO1xuICAgICAgICAgICAgc3RlcEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHsgZSgpOyB9KTtcbiAgICAgICAgICAgIGVmZmVjdHMgPSBlZmZlY3RzLmNvbmNhdChuZXdFZmZlY3RzKTtcbiAgICAgICAgICAgIG5ld0VmZmVjdHMgPSBbXTtcbiAgICAgICAgICAgIGVmZmVjdHMgPSBlZmZlY3RzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmNhbGwob2JqKTsgfSk7XG4gICAgICAgICAgICBpZiAobW92ZWQpIG9iai5wcm9jZXNzTW92ZW1lbnRFdmVudHMoKTtcbiAgICAgICAgICAgIGlmIChvYmoucG9zLnJvdCA+IE1hdGguUEkgKiAyKSBvYmoucG9zLnJvdCAtPSBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIGlmIChvYmoucG9zLnJvdCA8IDApIG9iai5wb3Mucm90ICs9IE1hdGguUEkgKiAyO1xuXG4gICAgICAgIH0sXG4gICAgICAgIHByb2Nlc3NNb3ZlbWVudEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBvYmoudmVsb2NpdHkgPSBNYXRoLnNxcnQob2JqLnBvcy52ZWMueCAqIG9iai5wb3MudmVjLnggKyBvYmoucG9zLnZlYy55ICogb2JqLnBvcy52ZWMueSk7XG4gICAgICAgICAgICBpZiAob2JqLnZlbG9jaXR5ID4gMzApIHtcbiAgICAgICAgICAgICAgICAvL2RlYnVnZ2VyO1xuICAgICAgICAgICAgICAgIG9iai5wb3MudmVjLnggPSBvYmoucG9zLnZlYy54IC8gKG9iai52ZWxvY2l0eSAvIDMwKTtcbiAgICAgICAgICAgICAgICBvYmoucG9zLnZlYy55ID0gb2JqLnBvcy52ZWMueSAvIChvYmoudmVsb2NpdHkgLyAzMCk7XG4gICAgICAgICAgICAgICAgb2JqLnZlbG9jaXR5ID0gMzA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmoucG9zLnggKz0gb2JqLnBvcy52ZWMueDtcbiAgICAgICAgICAgIG9iai5wb3MueSArPSBvYmoucG9zLnZlYy55O1xuICAgICAgICAgICAgaWYgKG9iai5vd25lcikge1xuICAgICAgICAgICAgICAgIG9iai5tb3ZlKG9iai5vd25lci5wb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqLnBvcy52ZWMueCA9IDA7XG4gICAgICAgICAgICBvYmoucG9zLnZlYy55ID0gMDtcbiAgICAgICAgICAgIG1vdmVFdmVudHMuZm9yRWFjaChmdW5jdGlvbihmbikgeyBmbigpOyB9KTtcbiAgICAgICAgICAgIG1vdmVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGlkOiBnZXRJZCgpLFxuICAgICAgICBwb3M6IHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgcm90OiAwLFxuICAgICAgICAgICAgdmVjOiB7XG4gICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICB5OiAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vdmU6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICAgICAgaWYgKHBvcy5ldikge1xuICAgICAgICAgICAgICAgIG1vdmVFdmVudHMucHVzaChwb3MuZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBvcy54KSBvYmoucG9zLnggPSBwb3MueDtcbiAgICAgICAgICAgIGlmIChwb3MueSkgb2JqLnBvcy55ID0gcG9zLnk7XG4gICAgICAgICAgICBpZiAocG9zLnJvdCkgb2JqLnBvcy5yb3QgPSBwb3Mucm90O1xuICAgICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBwdXNoOiBmdW5jdGlvbih2ZWMpIHtcbiAgICAgICAgICAgIGlmICh2ZWMuZXYpIHtcbiAgICAgICAgICAgICAgICBtb3ZlRXZlbnRzLnB1c2godmVjLmV2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2ZWMueCkgb2JqLnBvcy52ZWMueCArPSB2ZWMueDtcbiAgICAgICAgICAgIGlmICh2ZWMueSkgb2JqLnBvcy52ZWMueSArPSB2ZWMueTtcbiAgICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkRWZmZWN0OiBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgbmV3RWZmZWN0cy5wdXNoKGZuKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHJldHVybiBvYmo7XG59O1xuXG4iLCJ2YXIgcHJvamVjdGlsZSA9IHJlcXVpcmUoJy4vcHJvamVjdGlsZS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG5cbnZhciBCdWxsZXQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICB2YXIgYnVsbGV0ID0gcHJvamVjdGlsZSgpO1xuXG4gICAgYnVsbGV0LmZpcmUgPSBmdW5jdGlvbihwb3MpIHtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gMDtcbiAgICAgICAgdmFyIHRoZXRhID0gcG9zLnJvdDtcbiAgICAgICAgYnVsbGV0LmluZXJ0aWEgPSB0cnVlO1xuICAgICAgICBidWxsZXQucG9zLnJvdCA9IHBvcy5yb3Q7XG4gICAgICAgIGJ1bGxldC5vblRvcCA9IHRydWU7XG4gICAgICAgIGJ1bGxldC52ZWxvY2l0eSA9IDI1O1xuICAgICAgICBtYWtlU29saWQoYnVsbGV0KTtcbiAgICAgICAgYnVsbGV0LnN0ZXAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoYnVsbGV0LmRpZSB8fCBkaXN0YW5jZSA+IGJ1bGxldC5yYW5nZSkgYnVsbGV0LnVubG9hZCgpO1xuICAgICAgICAgICAgZGlzdGFuY2UrKztcbiAgICAgICAgICAgIGJ1bGxldC5wdXNoKHt4OiBNYXRoLmNvcyh0aGV0YSkgKiBidWxsZXQudmVsb2NpdHksIHk6IE1hdGguc2luKHRoZXRhKSAqIGJ1bGxldC52ZWxvY2l0eX0pO1xuICAgICAgICB9KTtcbiAgICAgICAgYnVsbGV0LnJhZGl1cyA9IDE7XG4gICAgICAgIGJ1bGxldC5jb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpe1xuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnem9tYmllJzpcbiAgICAgICAgICAgICAgICAgICAgYnVsbGV0LnVubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXIuYmFzZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NxdWFyZSc6XG4gICAgICAgICAgICAgICAgICAgIGJ1bGxldC51bmxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnVsbGV0Lm1vdmUoe3g6IHBvcy54ICsgTWF0aC5jb3ModGhldGEpICogNzUsIHk6IHBvcy55ICsgTWF0aC5zaW4odGhldGEpICogNzV9KTtcbiAgICB9O1xuXG4gICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgYnVsbGV0W2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgfVxuXG4gICAgYnVsbGV0LnR5cGUgPSAnYnVsbGV0JztcbiAgICByZXR1cm4gYnVsbGV0O1xufTtcblxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBCdWxsZXQ7XG4iLCJ2YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VWaXNpYmxlID0gcmVxdWlyZSgnLi9tYWtlVmlzaWJsZS5qcycpO1xudmFyIG1ha2VJbnZlbnRvcnkgPSByZXF1aXJlKCcuL21ha2VJbnZlbnRvcnkuanMnKTtcbnZhciBtYWtlU29saWQgPSByZXF1aXJlKCcuL21ha2VTb2xpZC5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBjaGFyYWN0ZXIgPSBiYXNlRW50aXR5KCk7XG4gICAgdmFyIGFuaVRpY2sgPSAwO1xuICAgIG1ha2VJbnZlbnRvcnkoY2hhcmFjdGVyKTtcbiAgICBtYWtlR2VvbWV0cnkoY2hhcmFjdGVyLCAnY2lyY2xlJyk7XG4gICAgbWFrZVNvbGlkKGNoYXJhY3Rlcik7XG4gICAgbWFrZVZpc2libGUoY2hhcmFjdGVyKTtcbiAgICBjaGFyYWN0ZXIucmFkaXVzID0gNTA7XG4gICAgY2hhcmFjdGVyLnNvbGlkID0gdHJ1ZTtcbiAgICBjaGFyYWN0ZXIub25Ub3AgPSB0cnVlO1xuICAgIGNoYXJhY3Rlci5nZW9tZXRyeSA9ICdjaXJjbGUnO1xuICAgIGNoYXJhY3Rlci5sb29rQXRWZWMgPSBmdW5jdGlvbih2ZWMpIHtcbiAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMih2ZWMueSwgdmVjLngpO1xuICAgICAgICBjaGFyYWN0ZXIucG9zLnJvdCA9IHRoZXRhICsgTWF0aC5QSTtcbiAgICAgICAgcmV0dXJuIHRoZXRhO1xuICAgIH07XG4gICAgY2hhcmFjdGVyLmxvb2tBdE9iaiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKG9iai5wb3MueSAtIGNoYXJhY3Rlci5wb3MueSwgb2JqLnBvcy54IC0gY2hhcmFjdGVyLnBvcy54KTtcbiAgICAgICAgY2hhcmFjdGVyLnBvcy5yb3QgPSB0aGV0YTtcbiAgICAgICAgcmV0dXJuIHRoZXRhO1xuICAgIH07XG4gICAgY2hhcmFjdGVyLmJhc2UgPSAnY2hhcmFjdGVyJztcbiAgICBjaGFyYWN0ZXIuaGVhbHRoID0gMTtcbiAgICBjaGFyYWN0ZXIuc3RlcChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGNoYXJhY3Rlci5oZWFsdGggPD0gMCkgY2hhcmFjdGVyLmFkZE1vZGUoJ2RpZScpO1xuICAgICAgICBhbmlUaWNrKys7XG4gICAgICAgIGlmICghY2hhcmFjdGVyLnZlbG9jaXR5KSB7XG4gICAgICAgICAgICBjaGFyYWN0ZXIucG9zZS54ID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChhbmlUaWNrID4gMTYgLSBjaGFyYWN0ZXIudmVsb2NpdHkpIHtcbiAgICAgICAgICAgICAgICBhbmlUaWNrID0gMDtcbiAgICAgICAgICAgICAgICBpZiAoY2hhcmFjdGVyLnBvc2UueCA8IGNoYXJhY3Rlci50ZXh0dXJlRGF0YS5wb3Nlcy5zbGlkZXNbY2hhcmFjdGVyLnBvc2UueV0gLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3Rlci5wb3NlLngrKztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXIucG9zZS54ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuaVRpY2srKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNoYXJhY3Rlci5tb2RlcyA9IG9wdGlvbnMubW9kZXM7XG4gICAgY2hhcmFjdGVyLmNvbGxpZGUgPSBvcHRpb25zLmNvbGxpZGU7XG4gICAgY2hhcmFjdGVyLnR5cGUgPSBvcHRpb25zLnR5cGU7XG4gICAgY2hhcmFjdGVyLmFkZE1vZGUgPSBmdW5jdGlvbihtb2RlKSB7XG4gICAgICAgIGlmIChjaGFyYWN0ZXIuY3VycmVudE1vZGUgPT09IG1vZGUpIHJldHVybjtcbiAgICAgICAgY2hhcmFjdGVyLmN1cnJlbnRNb2RlID0gbW9kZTtcbiAgICAgICAgY2hhcmFjdGVyLm1vZGVzW21vZGVdKCk7XG4gICAgfTtcbiAgICBjaGFyYWN0ZXIucG9zZSA9IHt4OiAwLCB5OiAwfTtcbiAgICBjaGFyYWN0ZXIubG9hZChmdW5jdGlvbigpIHsgY2hhcmFjdGVyLmFkZE1vZGUob3B0aW9ucy5tb2RlKTsgfSk7XG4gICAgY2hhcmFjdGVyLm1vdmUob3B0aW9ucy5wb3MpO1xuICAgIHJldHVybiBjaGFyYWN0ZXI7XG59O1xuXG4iLCJ2YXIgd29ybGQgPSByZXF1aXJlKCcuL3dvcmxkLmpzJyk7XG52YXIgcHJ1bmUgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgICAgICgoYS5BQUJCLnlzWzBdLnZhbCA+IGIuQUFCQi55c1swXS52YWwgJiYgYS5BQUJCLnlzWzBdLnZhbCA8IGIuQUFCQi55c1sxXS52YWwpIHx8XG4gICAgICAgICAgICAoYS5BQUJCLnlzWzFdLnZhbCA+IGIuQUFCQi55c1swXS52YWwgJiYgYS5BQUJCLnlzWzFdLnZhbCA8IGIuQUFCQi55c1sxXS52YWwpIHx8XG4gICAgICAgICAgICAoYi5BQUJCLnlzWzBdLnZhbCA+IGEuQUFCQi55c1swXS52YWwgJiYgYi5BQUJCLnlzWzBdLnZhbCA8IGEuQUFCQi55c1sxXS52YWwpIHx8XG4gICAgICAgICAgICAoYi5BQUJCLnlzWzFdLnZhbCA+IGEuQUFCQi55c1swXS52YWwgJiYgYi5BQUJCLnlzWzFdLnZhbCA8IGEuQUFCQi55c1sxXS52YWwpKSAmJiBcbiAgICAgICAgICAgICghKGIuZ2VvbWV0cnkgPT09ICdzcXVhcmUnICYmIGEuZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSkgJiZcbiAgICAgICAgICAgIChiLmlkICE9PSBhLmlkKVxuICAgICAgICAgICApO1xufTtcblxudmFyIGNvbGxpc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzd2VlcGluZyA9IFtdO1xuICAgIHZhciBwb3NzaWJsZVhzID0gW107XG4gICAgdmFyIG1vdmVzID0gW107XG4gICAgd29ybGQuZ2V0WHMoKS5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgaWYgKHgudHlwZSA9PT0gJ2InKSB7XG4gICAgICAgICAgICBzd2VlcGluZy5mb3JFYWNoKGZ1bmN0aW9uKHN3ZXB0KSB7XG4gICAgICAgICAgICAgICAgcG9zc2libGVYcy5wdXNoKFt4Lm9iaiwgc3dlcHRdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3dlZXBpbmcucHVzaCh4Lm9iaik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHgudHlwZSA9PT0gJ2UnKSB7XG4gICAgICAgICAgICBzd2VlcGluZyA9IHN3ZWVwaW5nLmZpbHRlcihmdW5jdGlvbihzd2VwdCkge1xuICAgICAgICAgICAgICAgIGlmIChzd2VwdC5pZCAhPT0geC5vYmouaWQpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHBvc3NpYmxlWHMgPSBwb3NzaWJsZVhzLmZpbHRlcihmdW5jdGlvbihwYWlyKSB7XG4gICAgICAgIHJldHVybiBwcnVuZShwYWlyWzBdLCBwYWlyWzFdKTtcbiAgICB9KTtcblxuICAgIHBvc3NpYmxlWHMuZm9yRWFjaChmdW5jdGlvbihwYWlyKSB7XG4gICAgICAgIHBhaXJbMF0uZGV0ZWN0Q29sbGlkZShwYWlyWzFdKTtcbiAgICB9KTtcblxufTtcblxuYXBpID0ge1xuICAgIHN0ZXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb2xsaXNpb24oKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcblxuLypcbiAqXG4gICAgICAgICAgICAgICAgICAgIGlmICgoY29sbGlkZXIudHlwZSA9PT0gJ3pvbWJpZScgJiYgY29sbGlkZWUudHlwZSA9PT0gJ2h1bWFuJykgfHwgKGNvbGxpZGVlLnR5cGUgPT09ICd6b21iaWUnICYmIGNvbGxpZGVyLnR5cGUgPT09ICdodW1hbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGlkZXIudHlwZSA9PT0gJ3pvbWJpZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6b21iaWUgPSBjb2xsaWRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodW1hbiA9IGNvbGxpZGVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6b21iaWUgPSBjb2xsaWRlZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodW1hbiA9IGNvbGxpZGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBvY2x1ZGUgPSB3b3JsZC5maWx0ZXIoZnVuY3Rpb24oY3Vycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyLnR5cGUgPT09ICdibG9jaycpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmV2KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3Vyci5vY2x1ZGUoY29sbGlkZXIucG9zLCBjb2xsaWRlZS5wb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoem9tYmllLnRhcmdldCA9PT0gaHVtYW4gJiYgb2NsdWRlICYmIGRpcyA+IDEwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnc2VhcmNoaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5nMiA9IE1hdGguYWJzKE1hdGguYXRhbjIoaHVtYW4ucG9zLnkgLSB6b21iaWUucG9zLnksIGh1bWFuLnBvcy54IC0gem9tYmllLnBvcy54KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmcgPSAgem9tYmllLnBvcy5yb3QgLSBhbmcyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb2NsdWRlICYmIChNYXRoLmFicyhhbmcpIDwgTWF0aC5QSSAqIDAuNDUgfHwgZGlzIDwgNTAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnY2hhc2luZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6b21iaWUudGFyZ2V0ID0gaHVtYW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnYmxvY2snICYmIGNvbGxpZGVlLmdlb21ldHJ5ID09PSAnY2lyY2xlJykgfHwgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnY2lyY2xlJyAmJiBjb2xsaWRlZS5nZW9tZXRyeSA9PT0gJ2Jsb2NrJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnYmxvY2snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9jayA9IGNvbGxpZGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2lyY2xlID0gY29sbGlkZWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxpZGVlLmdlb21ldHJ5ID09PSAnYmxvY2snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9jayA9IGNvbGxpZGVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2lyY2xlID0gY29sbGlkZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2lyY2xlLnR5cGUgIT09ICdnb2FsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSBibG9jay50ZXN0UG9pbnQoY2lyY2xlLnBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2lyY2xlLnR5cGUgPT09ICdjbGlja09iaicpIGNpcmNsZS5hZGRPYmooYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaXJjbGUudHlwZSA9PT0gJ2NsaWNrTWVudScpIGNpcmNsZS5hZGRPYmooYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaXJjbGUudHlwZSA9PT0gJ2J1bGxldCcgJiYgYmxvY2sudHlwZSA9PT0gJ2Jsb2NrJykgY2lyY2xlLmRpZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrLnR5cGUgPT09ICdzZW5zb3InICYmIGNpcmNsZS50eXBlID09PSAnYWN0aXZhdGlvbicpIGJsb2NrLmNvbGxpc2lvbi5hY3RpdmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrLnNvbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNpcmNsZS5wb3MueCA9IHBvaW50Lng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNpcmNsZS5wb3MueSA9IHBvaW50Lnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICovXG5cblxuIiwidmFyIGdldElkID0gcmVxdWlyZSgnLi9nZXRJZC5qcycpLmdldElkO1xuLy92YXIgc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlLmpzJyk7XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbS5qcycpO1xudmFyIHBsYXllcjtcbnZhciBsZWZ0Sm95c3RpY2sgPSBmYWxzZTtcbnZhciByaWdodEpveXN0aWNrID0gZmFsc2U7XG52YXIgb25nb2luZ1RvdWNoZXMgPSBbXTtcbnZhciB0b3VjaFBhZFdpZHRoOyBcbmRvbS5vbmxvYWQoZnVuY3Rpb24oKSB7IHRvdWNoUGFkV2lkdGggPSBkb20uZ2V0T2JqQnlJZCgnY2FudmFzJykuY2xpZW50V2lkdGg7IH0pO1xuXG52YXIgYXBpID0ge1xuICAgIGNvbm5lY3RQbGF5ZXI6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcGxheWVyID0gcDtcbiAgICB9XG59O1xuXG5kb20uYXR0YWNoRXZlbnQoJ29rYXlTdGF0cycsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ21haW5NZW51JykpO1xuZG9tLmF0dGFjaEV2ZW50KCdyZXN1bWVHYW1lJywgJ2NsaWNrJywgZXZlbnRzLmVtaXQuYmluZChudWxsLCAnc3RhcnQnKSk7XG5kb20uYXR0YWNoRXZlbnQoJ3BhdXNlR2FtZScsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ3BhdXNlJykpO1xuZG9tLmF0dGFjaEV2ZW50KCdwYXVzZUdhbWUnLCAndG91Y2hzdGFydCcsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ3BhdXNlJykpO1xuZG9tLmF0dGFjaEV2ZW50KCdxdWl0R2FtZScsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ2dhbWVPdmVyJykpO1xuZG9tLmF0dGFjaEV2ZW50KCduZXh0V2VhcG9uJywgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKHBsYXllcikgcGxheWVyLm5leHRXZWFwb24oKTtcbn0pO1xuXG52YXIgbmV3VG91Y2ggPSBmdW5jdGlvbih0b3VjaCkge1xuICAgIGlmICh0b3VjaC5wYWdlWCA8IHRvdWNoUGFkV2lkdGggLyAyICYmICFsZWZ0Sm95c3RpY2spIHtcbiAgICAgICAgbGVmdEpveXN0aWNrID0ge1xuICAgICAgICAgICAgdG91Y2g6IHRvdWNoLFxuICAgICAgICAgICAgb3JpZ2VuOiB7XG4gICAgICAgICAgICAgICAgeDogdG91Y2gucGFnZVgsXG4gICAgICAgICAgICAgICAgeTogdG91Y2gucGFnZVlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWx0YToge1xuICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgeTogMFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAodG91Y2gucGFnZVggPj0gdG91Y2hQYWRXaWR0aCAvIDIgJiYgIXJpZ2h0Sm95c3RpY2spIHtcbiAgICAgICAgcmlnaHRKb3lzdGljayA9IHtcbiAgICAgICAgICAgIHRvdWNoOiB0b3VjaCxcbiAgICAgICAgICAgIG9yaWdlbjoge1xuICAgICAgICAgICAgICAgIHg6IHRvdWNoLnBhZ2VYLFxuICAgICAgICAgICAgICAgIHk6IHRvdWNoLnBhZ2VZXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsdGE6IHtcbiAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG52YXIgdXBkYXRlVG91Y2ggPSBmdW5jdGlvbih0b3VjaCkge1xuICAgIHZhciBqb3lzdGljaztcbiAgICBpZiAobGVmdEpveXN0aWNrICYmIHRvdWNoLmlkZW50aWZpZXIgPT09IGxlZnRKb3lzdGljay50b3VjaC5pZGVudGlmaWVyKSB7XG4gICAgICAgIGpveXN0aWNrID0gbGVmdEpveXN0aWNrO1xuICAgIH1cbiAgICBpZiAocmlnaHRKb3lzdGljayAmJiB0b3VjaC5pZGVudGlmaWVyID09PSByaWdodEpveXN0aWNrLnRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgam95c3RpY2sgPSByaWdodEpveXN0aWNrO1xuICAgIH1cbiAgICBpZiAoIWpveXN0aWNrKSByZXR1cm47XG4gICAgam95c3RpY2suZGVsdGEueSA9IGpveXN0aWNrLm9yaWdlbi55IC0gdG91Y2gucGFnZVk7XG4gICAgam95c3RpY2suZGVsdGEueCA9IGpveXN0aWNrLm9yaWdlbi54IC0gdG91Y2gucGFnZVg7XG59O1xuXG52YXIgZW5kVG91Y2ggPSBmdW5jdGlvbih0b3VjaCkge1xuICAgIHZhciBqb3lzdGljaztcbiAgICBpZiAobGVmdEpveXN0aWNrICYmIHRvdWNoLmlkZW50aWZpZXIgPT09IGxlZnRKb3lzdGljay50b3VjaC5pZGVudGlmaWVyKSB7XG4gICAgICAgIGxlZnRKb3lzdGljayA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAocmlnaHRKb3lzdGljayAmJiB0b3VjaC5pZGVudGlmaWVyID09PSByaWdodEpveXN0aWNrLnRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgcmlnaHRKb3lzdGljayA9IGZhbHNlO1xuICAgIH1cbn07XG5cbmRvbS5hdHRhY2hFdmVudCgnZ2FtZVZpZXcnLCAndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGV2dCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0b3VjaGVzID0gZXZ0LmNoYW5nZWRUb3VjaGVzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBuZXdUb3VjaCh0b3VjaGVzW2ldKTtcbiAgICB9XG5cbn0pO1xuXG5kb20uYXR0YWNoRXZlbnQoJ2dhbWVWaWV3JywgJ3RvdWNobW92ZScsIGZ1bmN0aW9uKGV2dCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0b3VjaGVzID0gZXZ0LmNoYW5nZWRUb3VjaGVzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB1cGRhdGVUb3VjaCh0b3VjaGVzW2ldKTtcbiAgICB9XG5cbn0pO1xuXG5kb20uYXR0YWNoRXZlbnQoJ2dhbWVWaWV3JywgJ3RvdWNoZW5kJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHRvdWNoZXMgPSBldnQuY2hhbmdlZFRvdWNoZXM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVuZFRvdWNoKHRvdWNoZXNbaV0pO1xuICAgIH1cblxufSk7XG5cblxuZXZlbnRzLnJlZ2lzdGVyKCdhbmltYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoZXRhLCB4LCB5LCBwb3M7XG4gICAgaWYgKCFwbGF5ZXIpIHJldHVybjtcbiAgICBpZiAobGVmdEpveXN0aWNrICkge1xuICAgICAgICB5ID0gbGVmdEpveXN0aWNrLmRlbHRhLnk7XG4gICAgICAgIHggPSBsZWZ0Sm95c3RpY2suZGVsdGEueDtcbiAgICAgICAgaWYgKHkgPCAtOTApIHkgPSAtOTA7XG4gICAgICAgIGlmICh4IDwgLTkwKSB4ID0gLTkwO1xuICAgICAgICBpZiAoeSA+IDkwKSB5ID0gOTA7XG4gICAgICAgIGlmICh4ID4gOTApIHggPSA5MDtcbiAgICAgICAgcGxheWVyLmxvb2tBdFZlYyh7eDogeCwgeTogeX0pO1xuICAgICAgICBwbGF5ZXIucHVzaCh7eDogLXggLyA1LCB5OiAteSAvIDV9KTtcbiAgICAgICAgY29uc29sZS5sb2coe3g6IC14IC8gNSwgeTogLXkgLyA1fSk7XG4gICAgfVxuICAgIGlmIChyaWdodEpveXN0aWNrICkge1xuICAgICAgICB5ID0gcmlnaHRKb3lzdGljay5kZWx0YS55O1xuICAgICAgICB4ID0gcmlnaHRKb3lzdGljay5kZWx0YS54O1xuICAgICAgICBwbGF5ZXIubG9va0F0VmVjKHt4OiB4LCB5OiB5fSk7XG4gICAgICAgIHBsYXllci5hZGRNb2RlKCdzaG9vdGluZycpO1xuICAgIH1cbiAgICBpZiAoIXJpZ2h0Sm95c3RpY2sgKSBwbGF5ZXIuYWRkTW9kZSgncnVubmluZycpO1xuICAgIGlmICghbGVmdEpveXN0aWNrICYmICFyaWdodEpveXN0aWNrICkgcGxheWVyLmFkZE1vZGUoJ3N0YW5kaW5nJyk7XG4gICAgZG9tLnVwZGF0ZVdlYXBvbkljb25zKHBsYXllci5jdXJyZW50V2VhcG9ucyk7XG5cbn0sIGdldElkKCkpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwiZG9jdW1lbnQub25jb250ZXh0bWVudSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2U7IH1cbnZhciBsb2FkZWQgPSBmYWxzZTtcbnZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIGdldElkID0gcmVxdWlyZSgnLi9nZXRJZC5qcycpLmdldElkO1xudmFyIGVmZmVjdHMgPSByZXF1aXJlKCcuL2VmZmVjdHMuanMnKTtcbnZhciBvYmpzID0ge307XG52YXIgbWVudXMgPSB7fTtcbnZhciBpbnB1dHMgPSB7fTtcbndpbmRvdy5mdW5jdGlvbnMgPSB7fTtcbnZhciBtZW51Q2xvc2VFdmVudHMgPSB7fTtcbnZhciBsb2FkRXZlbnRzID0gW107XG52YXIgY2FudmFzZXMgPSB7fTtcbnZhciBvbGRXZWFwb25zID0gW107XG52YXIgaWNvbkV2ZW50cyA9IFtdO1xudmFyIHdlYXBvbkljb25zID0gW107XG5cblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyBcbiAgICBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21lbnVzJykpLmZvckVhY2goZnVuY3Rpb24ob2JqLCBpbmRleCwgYXJyYXkpIHsgXG4gICAgICAgIG1lbnVzW29iai5pZF0gPSBvYmo7IFxuICAgICAgICBlZmZlY3RzLmZhZGVPdXQob2JqKTtcbiAgICB9KTtcbiAgICBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2RvbW9iaicpKS5mb3JFYWNoKGZ1bmN0aW9uKG9iaiwgaW5kZXgsIGFycmF5KSB7IFxuICAgICAgICBvYmpzW29iai5pZF0gPSBvYmo7IFxuICAgIH0pO1xuICAgIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JykpLmZvckVhY2goZnVuY3Rpb24ob2JqLCBpbmRleCwgYXJyYXkpIHsgXG4gICAgICAgIGlucHV0c1tvYmouaWRdID0gb2JqOyBcbiAgICB9KTtcbiAgICAvL29ianNbJ21vZGFsQWNrJ10uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHsgZWZmZWN0cy5mYWRlT3V0KG9ianNbJ21vZGFsJ10pOyB9KTtcbiAgICBvYmpzWyd3aW5kb3cnXSA9IHdpbmRvdztcbiAgICBsb2FkZWQgPSB0cnVlOyBcbiAgICBsb2FkRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZXYpIHsgZXYoKTsgfSk7IFxufTtcblxudmFyIGVuc3VyZU9iaklkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iai5pZCkgcmV0dXJuIG9iai5pZDtcbiAgICBvYmouaWQgPSBnZXRJZCgpO1xuICAgIG9ianNbb2JqLmlkXSA9IG9iajtcbiAgICByZXR1cm4gb2JqLmlkO1xufTtcblxudmFyIHJlc2V0Q2FudmFzID0gZnVuY3Rpb24oY2FudmFzKSB7XG4gICAgdmFyIGNhbnZhc1dpZHRoID0gY2FudmFzLmdldEF0dHJpYnV0ZSgnd2lkdGgnKTtcbiAgICB2YXIgY2FudmFzSGVpZ2h0ID0gY2FudmFzLmdldEF0dHJpYnV0ZSgnaGVpZ2h0Jyk7XG4gICAgdmFyIHNjcmVlbldpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdmFyIHNjcmVlbkhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICBpZiAoY2FudmFzV2lkdGggLyBjYW52YXNIZWlnaHQgPiBzY3JlZW5XaWR0aCAvIHNjcmVlbkhlaWdodCkge1xuICAgICAgICBjYW52YXMuc3R5bGUud2lkdGggPSBzY3JlZW5XaWR0aCArICdweCc7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBzY3JlZW5XaWR0aCAqIChjYW52YXNIZWlnaHQgLyBjYW52YXNXaWR0aCkgKyAncHgnO1xuICAgICAgICBjYW52YXMuc3R5bGUudG9wID0gKHNjcmVlbkhlaWdodCAtIChzY3JlZW5XaWR0aCAqIChjYW52YXNIZWlnaHQgLyBjYW52YXNXaWR0aCkpKSAvIDIgKyAncHgnO1xuICAgICAgICBjYW52YXMuc3R5bGUubGVmdCA9ICcwcHgnOyBcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gc2NyZWVuSGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgY2FudmFzLnN0eWxlLndpZHRoID0gc2NyZWVuSGVpZ2h0ICogKGNhbnZhc1dpZHRoIC8gY2FudmFzSGVpZ2h0KSArICdweCc7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5sZWZ0ID0gKHNjcmVlbldpZHRoIC0gKHNjcmVlbkhlaWdodCAqIChjYW52YXNXaWR0aCAvIGNhbnZhc0hlaWdodCkpKSAvIDIgKyAncHgnO1xuICAgICAgICBjYW52YXMuc3R5bGUudG9wID0gJzBweCc7IFxuICAgIH1cbn07XG5cblxuXG52YXIgYXBpID0ge1xuICAgIHNldENhbnZhczogZnVuY3Rpb24oaWQsIGRpbSkge1xuICAgICAgICBpZiAoZGltKSB7XG4gICAgICAgICAgICBvYmpzW2lkXS5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgZGltLndpZHRoKTtcbiAgICAgICAgICAgIG9ianNbaWRdLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgZGltLmhlaWdodCk7XG4gICAgICAgICAgICBpZiAoIWNhbnZhc2VzW2lkXSkge1xuICAgICAgICAgICAgICAgIGNhbnZhc2VzW2lkXSA9IG9ianNbaWRdO1xuICAgICAgICAgICAgICAgIHJlc2V0Q2FudmFzKG9ianNbaWRdKTtcbiAgICAgICAgICAgICAgICBhcGkuYXR0YWNoRXZlbnQoJ3dpbmRvdycsICdyZXNpemUnLCByZXNldENhbnZhcy5iaW5kKG51bGwsIG9ianNbaWRdKSk7XG4gICAgICAgICAgICB9IFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmpzW2lkXS5nZXRDb250ZXh0KCd3ZWJnbCcpO1xuICAgIH0sXG4gICAgY2xlYXJJbnB1dHM6IGZ1bmN0aW9uKGFuY2VzdG9yKSB7XG4gICAgICAgIGFuY2VzdG9yID0gYXBpLmdldE9iakJ5SWQoYW5jZXN0b3IpO1xuICAgICAgICBmb3IgKHZhciBpbnB1dCBpbiBpbnB1dHMpIHtcbiAgICAgICAgICAgIGlmIChhbmNlc3Rvci5jb250YWlucyhpbnB1dHNbaW5wdXRdKSkgaW5wdXRzW2lucHV0XS52YWx1ZSA9ICcnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBvbkhpZGVNZW51OiBmdW5jdGlvbihpZCwgZnVuYykge1xuICAgICAgICBpZiAoIW1lbnVDbG9zZUV2ZW50c1tpZF0pIG1lbnVDbG9zZUV2ZW50c1tpZF0gPSBbXTtcbiAgICAgICAgbWVudUNsb3NlRXZlbnRzW2lkXS5wdXNoKGZ1bmMpO1xuICAgIH0sXG4gICAgaGlkZU1lbnU6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgZWZmZWN0cy5mYWRlT3V0KG1lbnVzW2lkXSk7XG4gICAgICAgICAgICBpZiAobWVudUNsb3NlRXZlbnRzW2lkXSkge1xuICAgICAgICAgICAgICAgIG1lbnVDbG9zZUV2ZW50c1tpZF0uZm9yRWFjaChmdW5jdGlvbihmKSB7IGYoKTsgfSk7XG4gICAgICAgICAgICAgICAgbWVudUNsb3NlRXZlbnRzW2lkXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIG1lbnUgaW4gbWVudXMpIHtcbiAgICAgICAgICAgIGlmIChtZW51c1ttZW51XS5pZCAhPT0gJ3dvcmxkSW5zcGVjdG9yJykge1xuICAgICAgICAgICAgICAgIGVmZmVjdHMuZmFkZU91dChtZW51c1ttZW51XSk7XG4gICAgICAgICAgICAgICAgaWYgKG1lbnVDbG9zZUV2ZW50c1ttZW51XSkge1xuICAgICAgICAgICAgICAgICAgICBtZW51Q2xvc2VFdmVudHNbbWVudV0uZm9yRWFjaChmdW5jdGlvbihmKSB7IGYoKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1lbnVDbG9zZUV2ZW50c1ttZW51XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2hvd01lbnU6IGZ1bmN0aW9uKGlkLCBwb3MpIHtcbiAgICAgICAgZWZmZWN0cy5mYWRlSW4obWVudXNbaWRdKTtcbiAgICAgICAgaWYgKHBvcykge1xuICAgICAgICAgICAgbWVudXNbaWRdLnN0eWxlLmxlZnQgPSBwYXJzZUludChwb3MueCAtIDIwKSArICdweCc7XG4gICAgICAgICAgICBtZW51c1tpZF0uc3R5bGUudG9wID0gcGFyc2VJbnQocG9zLnkgLSAyMCkgKyAncHgnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXRJdGVtc0J5Q2xhc3M6IGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShjKSkubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICB9KTs7XG4gICAgfSxcbiAgICBhZGRMaXN0SXRlbTogZnVuY3Rpb24odWwsIGxpKSB7XG4gICAgICAgIG9ianNbdWxdLmFwcGVuZENoaWxkKG9ianNbbGldKTtcbiAgICB9LFxuICAgIGFkZE1lbnVMaXN0SXRlbTogZnVuY3Rpb24oaWQsIHRleHQsIGNsaWNrLCBtb3VzZW92ZXIpIHtcbiAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGVuc3VyZU9iaklkKGxpKTtcbiAgICAgICAgc3Bhbi5pbm5lclRleHQgPSB0ZXh0O1xuICAgICAgICBsaS5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgaWYgKGNsaWNrKSBzcGFuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2spO1xuICAgICAgICBpZiAobW91c2VvdmVyKSBzcGFuLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIG1vdXNlb3Zlcik7XG4gICAgICAgIG9ianNbaWRdLmFwcGVuZENoaWxkKGxpKTtcbiAgICAgICAgcmV0dXJuIGxpLmlkO1xuICAgIH0sXG4gICAgY2xlYXJMaXN0SXRlbXM6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIFtdLnNsaWNlLmNhbGwob2Jqc1tpZF0uY2hpbGRyZW4pLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgaWYgKCFjaGlsZC5jbGFzc05hbWUuc3BsaXQoJyAnKS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgIGlmIChhKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoYiA9PT0gJ2xpc3RJdGVtJykgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9LCBmYWxzZSkpIG9ianNbaWRdLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRJbnB1dHNWYWx1ZXM6IGZ1bmN0aW9uKGFuY2VzdG9yKSB7XG4gICAgICAgIHJldHVybiBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzZWxlY3QnKSkuXG4gICAgICAgICAgICBjb25jYXQoW10uc2xpY2UuY2FsbChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKSkpLlxuICAgICAgICAgICAgZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKG9ianNbYW5jZXN0b3JdLmNvbnRhaW5zKGl0ZW0pKTtcbiAgICAgICAgICAgIH0pLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtpZDogaXRlbS5pZCwgdmFsdWU6IGl0ZW0udmFsdWV9O1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcbiAgICBvbmxvYWQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmIChsb2FkZWQpIHJldHVybiBldigpO1xuICAgICAgICBsb2FkRXZlbnRzLnB1c2goZXYpO1xuICAgIH0sXG4gICAgZ2V0R2VuZXJpY0xpc3RJdGVtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dlbmVyaWNMaXN0SXRlbScpWzBdLmNsb25lTm9kZSh0cnVlKTtcbiAgICB9LFxuICAgIGF0dGFjaEV2ZW50OiBmdW5jdGlvbihpZCwgdHlwZSwgZnVuYykge1xuICAgICAgICBpZiAoaWQuY2xvbmVOb2RlKSBpZCA9IGVuc3VyZU9iaklkKGlkKTtcbiAgICAgICAgdmFyIGZpZCA9IGdldElkKCk7XG4gICAgICAgIGZ1bmN0aW9uc1tmaWRdID0ge2Y6IGZ1bmMsIGlkOiBpZCwgdHlwZTogdHlwZX07XG4gICAgICAgIGFwaS5vbmxvYWQoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgb2Jqc1tpZF0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmdW5jKTsgXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmlkO1xuICAgIH0sXG4gICAgZGV0YWNoRXZlbnQ6IGZ1bmN0aW9uKGZpZCkge1xuICAgICAgICB2YXIgZXYgPSBmdW5jdGlvbnNbZmlkXTtcbiAgICAgICAgaWYgKG9ianNbZXYuaWRdLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG9ianNbZXYuaWRdLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXYudHlwZSwgZXYuZik7XG4gICAgICAgIGRlbGV0ZSBmdW5jdGlvbnNbZmlkXTtcbiAgICB9LFxuICAgIGRpc3BsYXk6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2xpZGVzJykpLmZvckVhY2goZnVuY3Rpb24ob2JqKSB7IGVmZmVjdHMuZmFkZU91dChvYmopOyB9KTtcbiAgICAgICAgZWZmZWN0cy5mYWRlSW4ob2Jqc1tpZF0pO1xuICAgIH0sXG4gICAgZ2V0T2JqQnlJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIG9ianNbaWRdO1xuICAgIH0sXG4gICAgZ2V0R2VuZXJpY0J1dHRvbjogZnVuY3Rpb24odGV4dCwgY2xpY2ssIG1vdXNlb3Zlcikge1xuICAgICAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgIGJ1dHRvbi5pbm5lclRleHQgPSB0ZXh0O1xuICAgICAgICBpZiAoY2xpY2spIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrKTtcbiAgICAgICAgaWYgKG1vdXNlb3ZlcikgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIG1vdXNlb3Zlcik7XG4gICAgICAgIHJldHVybiBidXR0b247XG4gICAgfSxcbiAgICBtb2RhbDogZnVuY3Rpb24obXNnKSB7XG4gICAgICAgIGFwaS5nZXRPYmpCeUlkKCdtb2RhbE1zZycpLmlubmVyVGV4dCA9IG1zZztcbiAgICAgICAgZWZmZWN0cy5mYWRlSW4oYXBpLmdldE9iakJ5SWQoJ21vZGFsJykpO1xuICAgIH0sXG4gICAgdXBkYXRlV2VhcG9uSWNvbnM6IGZ1bmN0aW9uKHdlYXBvbnMpIHtcbiAgICAgICAgdmFyIGNoYW5nZWQ7XG4gICAgICAgIGlmICh3ZWFwb25zKSB7XG4gICAgICAgICAgICB3ZWFwb25zLmZvckVhY2goZnVuY3Rpb24od2VhcG9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdlYXBvbnMudHlwZSAhPT0gb2xkV2VhcG9ucy50eXBlKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICBvbGRXZWFwb25zID0gd2VhcG9ucztcbiAgICAgICAgICAgICAgICB3ZWFwb25JY29ucy5mb3JFYWNoKGZ1bmN0aW9uKGljb24pIHtcbiAgICAgICAgICAgICAgICAgICAgd2VhcG9uSWNvbnNbaW5kZXhdLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICcnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGljb25FdmVudHMuZm9yRWFjaChmdW5jdGlvbihldikge1xuICAgICAgICAgICAgICAgICAgICBldi5kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihldi5mdW5jKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB3ZWFwb25zLmZvckVhY2goZnVuY3Rpb24od2VhcG9uLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYXBvbi5zZWxlY3RXZWFwb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB3ZWFwb25JY29uc1tpbmRleF0uc3R5bGUuYmFja2dyb3VuZEltYWdlID0gd2VhcG9uLmljb247XG4gICAgICAgICAgICAgICAgICAgIGljb25FdmVudHMucHVzaCh7ZG9tOiB3ZWFwb25JY29uc1tpbmRleF0sIGZ1bmM6IGNsaWNrfSk7XG4gICAgICAgICAgICAgICAgICAgIHdlYXBvbkljb25zLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2spO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICB3ZWFwb25JY29ucy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJykpO1xuICAgIHdlYXBvbkljb25zW2ldLmNsYXNzTmFtZSA9ICd3ZWFwb25pY29uJztcbiAgICAoZnVuY3Rpb24oKSB7IFxuICAgICAgICB2YXIgaiA9IGk7XG4gICAgICAgIGlmIChvYmpzWyd3ZWFwb25PcHRpb25zJ10pIGFwaS5vbmxvYWQoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgb2Jqc1snd2VhcG9uT3B0aW9ucyddLmFwcGVuZENoaWxkKHdlYXBvbkljb25zW2pdKTsgXG4gICAgICAgIH0pO1xuICAgIH0pKCk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiIsInZhciB3YWxsID0gcmVxdWlyZSgnLi93YWxsLmpzJyk7XG52YXIgbWFrZVN0YXJ0T3B0aW9ucyA9IHJlcXVpcmUoJy4vbWFrZVN0YXJ0T3B0aW9ucy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgZG9vciA9IHdhbGwob3B0aW9ucyk7XG4gICAgbWFrZVN0YXJ0T3B0aW9ucyhkb29yKTtcbiAgICBkb29yLnN0YXJ0T3B0aW9ucyh7c3BlZWQ6IG9wdGlvbnMuc3BlZWR9KTtcbiAgICBkb29yLnR5cGUgPSAnZG9vcic7XG4gICAgZG9vci5vcGVuUG9zID0gb3B0aW9ucy5vcGVuUG9zIHx8IG9wdGlvbnMucG9zO1xuICAgIGRvb3IuY2xvc2VQb3MgPSBvcHRpb25zLmNsb3NlUG9zIHx8IG9wdGlvbnMucG9zO1xuICAgIGRvb3Iub3BlbmVkID0gb3B0aW9ucy5vcGVuZWQgfHwgdHJ1ZTtcblxuICAgIHZhciBwcm9ncmVzcyA9IChkb29yLm9wZW5lZCkgPyAxIDogMDtcbiAgICB2YXIgc3RhcnRUaW1lO1xuICAgIHZhciB1cGRhdGVQb3MgPSBmdW5jdGlvbih0b2dnbGUpIHtcbiAgICAgICAgaWYgKHRvZ2dsZSkgcHJvZ3Jlc3MgPSAoZG9vci5vcGVuZWQpID8gMSA6IDA7XG4gICAgICAgIGRvb3IubW92ZSh7XG4gICAgICAgICAgICB4OiBkb29yLm9wZW5Qb3MueCArIChkb29yLmNsb3NlUG9zLnggLSBkb29yLm9wZW5Qb3MueCkgKiBwcm9ncmVzcyxcbiAgICAgICAgICAgIHk6IGRvb3Iub3BlblBvcy55ICsgKGRvb3IuY2xvc2VQb3MueSAtIGRvb3Iub3BlblBvcy55KSAqIHByb2dyZXNzLFxuICAgICAgICAgICAgcm90OiBkb29yLm9wZW5Qb3Mucm90ICsgKGRvb3IuY2xvc2VQb3Mucm90IC0gZG9vci5vcGVuUG9zLnJvdCkgKiBwcm9ncmVzc1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZG9vci51cGRhdGVQb3MgPSB1cGRhdGVQb3M7XG5cbiAgICB1cGRhdGVQb3MoKTtcblxuICAgIGlmICghZG9vci52ZXJicykgZG9vci52ZXJicyA9IHt9O1xuICAgIGRvb3IudmVyYnMub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoZG9vci5vcGVuZWQpIHtcbiAgICAgICAgICAgIGRvb3Iub3BlbmVkID0gZmFsc2U7XG4gICAgICAgICAgICBkb29yLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzcyAtPSBvcHRpb25zLnNwZWVkO1xuICAgICAgICAgICAgICAgIGlmIChwcm9ncmVzcyA8IDApIHByb2dyZXNzID0gMDtcbiAgICAgICAgICAgICAgICB1cGRhdGVQb3MoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHByb2dyZXNzICYmICFkb29yLm9wZW5lZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvb3Iub3BlbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGRvb3IuYWRkRWZmZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzICs9IG9wdGlvbnMuc3BlZWQ7XG4gICAgICAgICAgICAgICAgaWYgKHByb2dyZXNzID4gMSkgcHJvZ3Jlc3MgPSAxO1xuICAgICAgICAgICAgICAgIHVwZGF0ZVBvcygpO1xuICAgICAgICAgICAgICAgIHJldHVybiAocHJvZ3Jlc3MgLSAxICYmIGRvb3Iub3BlbmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBkb29yO1xufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZmFkZUluOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgb2JqLnN0eWxlLm9wYWNpdHkgPSAxO1xuICAgICAgICBvYmouc3R5bGUuekluZGV4ID0gMztcbiAgICAgICAgb2JqLnN0eWxlLmRpc3BsYXkgPSAnaW5oZXJpdCc7XG4gICAgfSxcbiAgICBmYWRlT3V0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgb2JqLnN0eWxlLm9wYWNpdHkgPSAwO1xuICAgICAgICBvYmouc3R5bGUuekluZGV4ID0gMTtcbiAgICAgICAgb2JqLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxufTtcbiIsInZhciBldmVudHMgPSB7fTtcblxudmFyIGFwaSA9IHtcbiAgICBlbWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGZvciAodmFyIGlkIGluIGV2ZW50cykge1xuICAgICAgICAgICAgaWYgKGV2ZW50c1tpZF0uZSA9PT0gZSkgZXZlbnRzW2lkXS5mKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihlLCBmLCBpZCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdyZWdpc3RlcmluZyBldmVudCAnICsgZSwgZiwgaWQpO1xuICAgICAgICBldmVudHNbaWRdID0ge1xuICAgICAgICAgICAgZjogZixcbiAgICAgICAgICAgIGU6IGVcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHVucmVnaXN0ZXI6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGRlbGV0ZSBldmVudHNbaWRdO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuXG52YXIgYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGFwaS5lbWl0KCdhbmltYXRlJyk7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbn07XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIGFuaW1hdGUoKTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIGh0dHAub3BlbignR0VUJywgdXJsLCB0cnVlKTtcblxuICAgIC8vU2VuZCB0aGUgcHJvcGVyIGhlYWRlciBpbmZvcm1hdGlvbiBhbG9uZyB3aXRoIHRoZSByZXF1ZXN0XG4gICAgaHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XG5cbiAgICBodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YTtcbiAgICAgICAgaWYoKGh0dHAucmVhZHlTdGF0ZSA9PT0gNCkgJiYgaHR0cC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgaWYgKC9eW1xcXSw6e31cXHNdKiQvLnRlc3QoaHR0cC5yZXNwb25zZVRleHQucmVwbGFjZSgvXFxcXFtcIlxcXFxcXC9iZm5ydHVdL2csICdAJykucmVwbGFjZSgvXCJbXlwiXFxcXFxcblxccl0qXCJ8dHJ1ZXxmYWxzZXxudWxsfC0/XFxkKyg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/L2csICddJykucmVwbGFjZSgvKD86Xnw6fCwpKD86XFxzKlxcWykrL2csICcnKSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShodHRwLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBodHRwLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGh0dHAuc2VuZCgpO1xuXG59O1xuXG4iLCJ2YXIgRW50aXRpZXMgPSB7fTtcblxuRW50aXRpZXNbJ3BsYXllciddID0gcmVxdWlyZSgnLi9QbGF5ZXIuanMnKTtcbkVudGl0aWVzWyd0ZXN0J10gPSByZXF1aXJlKCcuL3Rlc3Qtb2JqLmpzJyk7XG5FbnRpdGllc1snZ3VuJ10gPSByZXF1aXJlKCcuL2d1bi5qcycpO1xuRW50aXRpZXNbJ3RpbGUnXSA9IHJlcXVpcmUoJy4vc3F1YXJlLmpzJyk7XG5FbnRpdGllc1snem9tYmllU3Bhd25lciddID0gcmVxdWlyZSgnLi9zcGF3bmVyLmpzJyk7XG5FbnRpdGllc1snem9tYmllJ10gPSByZXF1aXJlKCcuL1pvbWJpZS5qcycpO1xuRW50aXRpZXNbJ3dhbGwnXSA9IHJlcXVpcmUoJy4vd2FsbC5qcycpO1xuRW50aXRpZXNbJ2Rvb3InXSA9IHJlcXVpcmUoJy4vZG9vci5qcycpO1xuRW50aXRpZXNbJ2FyZWEnXSA9IHJlcXVpcmUoJy4vYXJlYS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0aWVzO1xuIiwidmFyIGxhc3RJZCA9IDA7XG5cbnZhciBhcGkgPSB7XG4gICAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2EnICsgbGFzdElkKys7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XG4iLCJ2YXIgd2VhcG9uID0gcmVxdWlyZSgnLi93ZWFwb24uanMnKTtcbi8vdmFyIHdvcmxkID0gcmVxdWlyZSgnLi93b3JsZC5qcycpO1xudmFyIEJ1bGxldCA9IHJlcXVpcmUoJy4vYnVsbGV0LmpzJyk7XG52YXIgbWFrZUludmVudG9yeSA9IHJlcXVpcmUoJy4vbWFrZUludmVudG9yeS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgZ3VuID0gd2VhcG9uKCk7XG4gICAgdmFyIGJ1bGxldDtcbiAgICBpZiAob3B0aW9ucy5wb3MpIGd1bi5tb3ZlKG9wdGlvbnMucG9zKTtcbiAgICBndW4udXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBidWxsZXQgPSBndW4uZ2V0SW52ZW50b3J5KClbMF07XG4gICAgICAgIGlmICghYnVsbGV0KSB7XG4gICAgICAgICAgICBidWxsZXQgPSBCdWxsZXQoe3ZlbG9jaXR5OiAxMCwgcG93ZXI6IDEwLCByYW5nZTogNTAwfSk7XG4gICAgICAgICAgICBndW4udGFrZUl0ZW1zKGJ1bGxldCk7XG4gICAgICAgICAgICB3b3JsZC5sb2FkSXRlbXMoYnVsbGV0KTtcbiAgICAgICAgfVxuICAgICAgICBndW4uZHJvcEl0ZW0oYnVsbGV0KTtcbiAgICAgICAgYnVsbGV0LmZpcmUoZ3VuLm93bmVyLnBvcyk7XG4gICAgfTtcblxuICAgIGd1bi50eXBlID0gJ2d1bic7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuc3RhcnRBbW1vOyBpKyspIHtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3VuO1xufTtcblxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xue1wiZW50aXR5XCI6IFwidGlsZVwiLFxuICAgIFwicG9zXCI6IHtcbiAgICAgICAgXCJ4XCI6OTkzMCxcbiAgICAgICAgXCJ5XCI6MTAxNTYsXG4gICAgICAgIFwicm90XCI6MC43OFxuICAgIH0sXG4gICAgXCJ3aWR0aFwiOlwiNTAwMFwiLFxuICAgIFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LFxue1wiZW50aXR5XCI6XCJwbGF5ZXJcIixcbiAgICBcInBvc1wiOiB7XCJ4XCI6MTAwMjMuMDI4ODY4OTk2MDg1LFwieVwiOjk5ODAuNzczMTY0Nzc1MjEzLFwicm90XCI6MH0sXCJyYWRpdXNcIjo1MH0sXG57XCJlbnRpdHlcIjpcImd1blwiLFxuICAgIFwicG9zXCI6IHtcInhcIjoxMDAyMy4wMjg4Njg5OTYwODUsXCJ5XCI6OTk4MC43NzMxNjQ3NzUyMTMsXCJyb3RcIjowfX0sXG57XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDQ0OCxcInlcIjoxMDc3MyxcInJvdFwiOjAuNzh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCIxMjAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjk1OTksXCJ5XCI6OTc5OSxcInJvdFwiOjAuNzh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCIxMjAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjgxMzMsXCJ5XCI6ODQ0NSxcInJvdFwiOjAuNzh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjEwNjgxLFwieVwiOjk3NzcsXCJyb3RcIjoyLjM0fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiMTIwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDkyNCxcInlcIjo4NTE0LFwicm90XCI6MS41OH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjgwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDAwMyxcInlcIjo4NjA4LFwicm90XCI6My4xNH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjE2MDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTE2NDIsXCJ5XCI6ODQxMyxcInJvdFwiOjIuMzR9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjExNjk1LFwieVwiOjExODc3LFwicm90XCI6MC43OH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjUwMDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6ODE4MyxcInlcIjoxMTkyMSxcInJvdFwiOjIuMzR9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjEwMjY3LFwieVwiOjg3OTAsXCJyb3RcIjozLjE0fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiMTIwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDM1MSxcInlcIjo3ODYxLFwicm90XCI6MS41OH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjgwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMTAyNCxcInlcIjo5MDU1LFwicm90XCI6MC4zfSxcIndpZHRoXCI6XCI0MDBcIixcImhlaWdodFwiOlwiMjUwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjExODk4LFwieVwiOjk0OTAsXCJyb3RcIjowLjZ9LFwid2lkdGhcIjpcIjkwMFwiLFwiaGVpZ2h0XCI6XCIxMDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTE2MTksXCJ5XCI6OTg5NSxcInJvdFwiOjAuNn0sXCJ3aWR0aFwiOlwiOTAwXCIsXCJoZWlnaHRcIjpcIjEwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjo5NTAwLFwieVwiOjExNzg2LFwicm90XCI6MH0sXCJ3aWR0aFwiOlwiODAwXCIsXCJoZWlnaHRcIjpcIjgwMFwifSxcbntcImVudGl0eVwiOlwiem9tYmllU3Bhd25lclwiLFwicG9zXCI6e1wieFwiOjc3NjksXCJ5XCI6OTQxMSxcInJvdFwiOjB9LFwicmFkaXVzXCI6MTAsIFwic3RhcnRcIjogdHJ1ZSwgXCJpbnRlcnZhbFwiOiAyMDAwMCwgXCJzcGF3bkNvdW50XCI6IDE1fSxcbntcImVudGl0eVwiOlwiem9tYmllU3Bhd25lclwiLFwicG9zXCI6e1wieFwiOjEyMzc5LFwieVwiOjk0NDksXCJyb3RcIjowfSxcInJhZGl1c1wiOjEwLCBcInN0YXJ0XCI6IGZhbHNlLCBcImludGVydmFsXCI6IDQ1MDAwLCBcInNwYXduQ291bnRcIjogMzV9LFxue1wiZW50aXR5XCI6XCJ6b21iaWVTcGF3bmVyXCIsXCJwb3NcIjp7XCJ4XCI6ODc2MCxcInlcIjoxMTk4MyxcInJvdFwiOjB9LFwicmFkaXVzXCI6MTAsIFwic3RhcnRcIjogdHJ1ZSwgXCJpbnRlcnZhbFwiOiAyMDAwMCwgXCJzcGF3bkNvdW50XCI6IDV9XG5cbl07XG5cblxuIiwicmVxdWlyZSgnLi9hbmltYXRpb25TaGltLmpzJyk7XG53aW5kb3cubG9nZ2luZyA9IFtdO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgZ2V0ID0gcmVxdWlyZSgnLi9nZXQuanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbS5qcycpO1xudmFyIHJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJlci5qcycpO1xud2luZG93LndvcmxkID0gcmVxdWlyZSgnLi93b3JsZC5qcycpO1xudmFyIGNvbGxpc2lvbiA9IHJlcXVpcmUoJy4vY29sbGlzaW9uLmpzJyk7XG52YXIgZ2V0SWQgPSByZXF1aXJlKCcuL2dldElkLmpzJykuZ2V0SWQ7XG52YXIgY29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlci5qcycpO1xuXG5kb20ub25sb2FkKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGN1cnJlbnRHYW1lSWQgPSBnZXRJZCgpO1xuICAgIHZhciBwbGF5ZXI7XG5cbiAgICB2YXIgc3RhdGVzID0ge1xuICAgICAgICBtYWluTWVudTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkb20uZGlzcGxheSgnbWFpbk1lbnUnKTtcbiAgICAgICAgICAgIGRvbS5jbGVhckxpc3RJdGVtcygnb3duZXJMZXZlbHMnKTtcbiAgICAgICAgICAgIGRvbS5jbGVhckxpc3RJdGVtcygncHVibGljTGV2ZWxzJyk7XG4gICAgICAgICAgICBnZXQoJy4vbGV2ZWxzLycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24obGV2ZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSAnb3duZXJMZXZlbHMnO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGV2ZWwuc25hcHNob3QpIGxpc3QgPSAncHVibGljTGV2ZWxzJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpID0gZG9tLmFkZE1lbnVMaXN0SXRlbShsaXN0LCBsZXZlbC5uYW1lLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmxkLmxvYWRMZXZlbChsZXZlbC5pZCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzLnN0YXJ0R2FtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0YXJ0R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwbGF5ZXIgPSB3b3JsZC5nZXRJdGVtc0J5VHlwZSgncGxheWVyJylbMF07XG4gICAgICAgICAgICBjb250cm9sbGVyLmNvbm5lY3RQbGF5ZXIocGxheWVyKTtcbiAgICAgICAgICAgIHJlbmRlcmVyLmNvbm5lY3RDYW1lcmEocGxheWVyKTtcbiAgICAgICAgICAgIHN0YXRlcy5wbGF5aW5nR2FtZSgpO1xuICAgICAgICB9LFxuICAgICAgICBwbGF5aW5nR2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkb20uZGlzcGxheSgnZ2FtZVZpZXcnKTtcbiAgICAgICAgICAgIGV2ZW50cy5yZWdpc3RlcignYW5pbWF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHdvcmxkLnN0ZXAoKTtcbiAgICAgICAgICAgICAgICBjb2xsaXNpb24uc3RlcCgpO1xuICAgICAgICAgICAgICAgIHJlbmRlcmVyLnN0ZXAoKTtcbiAgICAgICAgICAgIH0sIGN1cnJlbnRHYW1lSWQpO1xuICAgICAgICB9LFxuICAgICAgICB2aWV3aW5nU3RhdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc3RhdGVzLnBhdXNlZEdhbWUoKTtcbiAgICAgICAgICAgIGRvbS5kaXNwbGF5KCdzdGF0cycpO1xuICAgICAgICB9LFxuICAgICAgICBwYXVzZWRHYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRvbS5kaXNwbGF5KCdwYXVzZU1lbnUnKTtcbiAgICAgICAgICAgIGV2ZW50cy51bnJlZ2lzdGVyKGN1cnJlbnRHYW1lSWQpO1xuICAgICAgICAgICAgY3VycmVudEdhbWVJZCA9IGdldElkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgXG5cbiAgICBldmVudHMucmVnaXN0ZXIoJ3BhdXNlJywgc3RhdGVzLnBhdXNlZEdhbWUsIGdldElkKCkpO1xuXG4gICAgZXZlbnRzLnJlZ2lzdGVyKCdnYW1lT3ZlcicsIHN0YXRlcy52aWV3aW5nU3RhdHMsIGdldElkKCkpO1xuICAgIGV2ZW50cy5yZWdpc3RlcignbWFpbk1lbnUnLCBzdGF0ZXMubWFpbk1lbnUsIGdldElkKCkpO1xuICAgIHN0YXRlcy5tYWluTWVudSgpO1xuXG59KTtcblxuXG5cblxuXG5cbiIsInZhciBwZXJwUG9pbnQgPSBmdW5jdGlvbih2ZXJ0cywgcCkge1xuICAgIHZhciBvdXRwdXQgPSB2ZXJ0cy5tYXAoZnVuY3Rpb24odjAsIGluZGV4LCBhcnJheSkge1xuICAgICAgICB2YXIgdjEgPSBhcnJheVtpbmRleCArIDFdO1xuICAgICAgICBpZiAoaW5kZXggKyAxID09PSBhcnJheS5sZW5ndGgpIHYxID0gYXJyYXlbMF07XG4gICAgICAgIHZhciBrID0gKCh2MS55IC0gdjAueSkgKiAocC54IC0gdjAueCkgLSAodjEueCAtIHYwLngpICogKHAueSAtIHYwLnkpKSAvIChNYXRoLnBvdyh2MS55IC0gdjAueSwgMikgKyBNYXRoLnBvdyh2MS54IC0gdjAueCwgMikpO1xuICAgICAgICB2YXIgcGVycFBvaW50ID0ge3g6IHAueCAtIGsgKiAodjEueSAtIHYwLnkpLCB5OiBwLnkgKyBrICogKHYxLnggLSB2MC54KX07XG4gICAgICAgIHZhciBkaXMgPSBNYXRoLnNxcnQoTWF0aC5wb3cocC54IC0gcGVycFBvaW50LngsIDIpICsgTWF0aC5wb3cocC55IC0gcGVycFBvaW50LnksIDIpKTtcbiAgICAgICAgcmV0dXJuIHtkaXM6IGRpcywgcGVycFBvaW50OiBwZXJwUG9pbnR9O1xuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHBhc3QsIGN1cnJlbnQpIHsgXG4gICAgICAgIGlmICghcGFzdC5kaXMpIHJldHVybiBjdXJyZW50O1xuICAgICAgICBpZiAoY3VycmVudC5kaXMgPCBwYXN0LmRpcykgcmV0dXJuIGN1cnJlbnQ7XG4gICAgICAgIHJldHVybiBwYXN0O1xuICAgIH0pLnBlcnBQb2ludDtcbn07XG5cblxudmFyIHBvaW50SW5Qb2x5Z29uID0gZnVuY3Rpb24oc3F1YXJlLCBjaXJjbGUpIHtcbiAgICB2YXIgYyA9IGZhbHNlO1xuICAgIHZhciBpLCBqLCB4LCB5LCBwO1xuICAgIHZhciB2ZXJ0aWNlcyA9IHNxdWFyZS52ZXJ0cztcbiAgICB2YXIgcG9pbnQgPSBjaXJjbGUucG9zO1xuXG4gICAgaiA9IHZlcnRpY2VzLmxlbmd0aCAtIDE7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdmVydGljZXMubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICBpZiAoICgodmVydGljZXNbaV0ueSA+IHBvaW50LnkpICE9PSAodmVydGljZXNbal0ueSA+IHBvaW50LnkpKSAmJlxuICAgICAgICAocG9pbnQueCA8ICh2ZXJ0aWNlc1tqXS54IC0gdmVydGljZXNbaV0ueCkgKiAocG9pbnQueSAtIHZlcnRpY2VzW2ldLnkpIC8gKHZlcnRpY2VzW2pdLnkgLSB2ZXJ0aWNlc1tpXS55KSArIHZlcnRpY2VzW2ldLngpICkge1xuICAgICAgICAgICAgYyA9ICFjO1xuICAgICAgICB9XG5cbiAgICAgICAgaiA9IGk7XG4gICAgfVxuXG4gICAgaWYgKGMpIHtcbiAgICAgICAgaWYgKHNxdWFyZS5zb2xpZCAmJiBjaXJjbGUuc29saWQpIHtcbiAgICAgICAgICAgIHAgPSBwZXJwUG9pbnQodmVydGljZXMsIHBvaW50KTtcbiAgICAgICAgICAgIC8veCA9IHAueCAtIGNpcmNsZS5wb3MueDtcbiAgICAgICAgICAgIC8veSAuPSBwLnkgLSBjaXJjbGUucG9zLnk7XG4gICAgICAgICAgICAvL2NpcmNsZS5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgICAgIGNpcmNsZS5tb3ZlKHt4OiBwLngsIHk6IHAueX0pOyBcbiAgICAgICAgICAgIC8vfSk7XG4gICAgICAgICAgICBjaXJjbGUuY29sbGlkZShzcXVhcmUpO1xuICAgICAgICAgICAgc3F1YXJlLmNvbGxpZGUoY2lyY2xlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59O1xuXG52YXIgbG9uZ1B1c2ggPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHRoZW4gPSBEYXRlLm5vdygpO1xuICAgIHZhciB4ID0gTWF0aC5jb3MoYi5wb3Mucm90KSAqIGIudmVsb2NpdHk7XG4gICAgdmFyIHkgPSBNYXRoLnNpbihiLnBvcy5yb3QpICogYi52ZWxvY2l0eTtcbiAgICBhLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsYXBzZWRUaW1lID0gKERhdGUubm93KCkgLSB0aGVuKSAvIDEwMDA7XG4gICAgICAgIHZhciBzY2FsZXIgPSBNYXRoLnBvdyhlbGFwc2VkVGltZSAtIDEsIDIpO1xuICAgICAgICBpZiAoZWxhcHNlZFRpbWUgPiAxKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGEucHVzaCh7eDogeCAqIHNjYWxlciwgeTogeSAqIHNjYWxlcn0pO1xuXG4gICAgfSk7XG59O1xuXG52YXIgY2lyY2xlRGV0ZWN0ID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4LCB5LCBkaXMsIHJhZGl1cywgZGVsdGEsIHRoZXRhLCBhRGVsdGEsIGJEZWx0YTtcbiAgICB4ID0gYS5wb3MueCAtIGIucG9zLng7XG4gICAgeSA9IGEucG9zLnkgLSBiLnBvcy55O1xuICAgIGRpcyA9IE1hdGguc3FydChNYXRoLnBvdyh4LCAyKSArIE1hdGgucG93KHksIDIpKTtcbiAgICByYWRpdXMgPSBwYXJzZUludChhLnJhZGl1cykgKyBwYXJzZUludChiLnJhZGl1cyk7XG5cbiAgICBpZiAoZGlzIDwgcmFkaXVzKSB7XG4gICAgICAgIGlmIChhLnNvbGlkICYmIGIuc29saWQpIHtcbiAgICAgICAgICAgIGRlbHRhID0gKHJhZGl1cyAtIGRpcyk7XG4gICAgICAgICAgICB0aGV0YSA9IE1hdGguYXRhbjIoeSwgeCk7XG4gICAgICAgICAgICBhLmFkZEVmZmVjdChmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICAgICAgYS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogKE1hdGguY29zKHRoZXRhKSAqIGRlbHRhKSwgXG4gICAgICAgICAgICAgICAgICAgIHk6IChNYXRoLnNpbih0aGV0YSkgKiBkZWx0YSlcbiAgICAgICAgICAgICAgICB9KTsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBiLmFkZEVmZmVjdChmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICAgICAgYi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogKE1hdGguY29zKHRoZXRhKSAqIC1kZWx0YSksICBcbiAgICAgICAgICAgICAgICAgICAgeTogKE1hdGguc2luKHRoZXRhKSAqIC1kZWx0YSlcbiAgICAgICAgICAgICAgICB9KTsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoYi5pbmVydGlhKSBsb25nUHVzaChhLCBiKTtcbiAgICAgICAgICAgIGlmIChhLmluZXJ0aWEpIGxvbmdQdXNoKGIsIGEpO1xuICAgICAgICAgICAgYS5jb2xsaWRlKGIpO1xuICAgICAgICAgICAgYi5jb2xsaWRlKGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn07XG5cbnZhciBzZXRBQUJCID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIEFBQkIgPSB7XG4gICAgICAgIHhzOiBbe3R5cGU6ICdiJywgdmFsOiBJbmZpbml0eSwgb2JqOiBvYmp9LCB7dHlwZTogJ2UnLCB2YWw6IC1JbmZpbml0eSwgb2JqOiBvYmp9XSxcbiAgICAgICAgeXM6IFt7dHlwZTogJ2InLCB2YWw6IEluZmluaXR5LCBvYmo6IG9ian0sIHt0eXBlOiAnZScsIHZhbDogLUluZmluaXR5LCBvYmo6IG9ian1dXG4gICAgfTtcblxuICAgIGlmIChvYmouZ2VvbWV0cnkgPT09ICdjaXJjbGUnKSB7XG4gICAgICAgIEFBQkIueHNbMF0udmFsID0gb2JqLnBvcy54IC0gb2JqLnJhZGl1cztcbiAgICAgICAgQUFCQi54c1sxXS52YWwgPSBvYmoucG9zLnggKyBvYmoucmFkaXVzO1xuICAgICAgICBBQUJCLnlzWzBdLnZhbCA9IG9iai5wb3MueSAtIG9iai5yYWRpdXM7XG4gICAgICAgIEFBQkIueXNbMV0udmFsID0gb2JqLnBvcy55ICsgb2JqLnJhZGl1cztcbiAgICAgICAgb2JqLkFBQkIgPSBBQUJCO1xuICAgICAgICByZXR1cm47XG4gICAgfTtcbiAgICBpZiAob2JqLmdlb21ldHJ5ID09PSAnc3F1YXJlJykge1xuICAgICAgICBvYmouQUFCQiA9IG9iai52ZXJ0cy5yZWR1Y2UoZnVuY3Rpb24oYWNjLCB2ZXJ0KSB7XG4gICAgICAgICAgICBpZiAodmVydC54IDwgYWNjLnhzWzBdLnZhbCkgYWNjLnhzWzBdLnZhbCA9IHZlcnQueDtcbiAgICAgICAgICAgIGlmICh2ZXJ0LnggPiBhY2MueHNbMV0udmFsKSBhY2MueHNbMV0udmFsID0gdmVydC54O1xuICAgICAgICAgICAgaWYgKHZlcnQueSA8IGFjYy55c1swXS52YWwpIGFjYy55c1swXS52YWwgPSB2ZXJ0Lnk7XG4gICAgICAgICAgICBpZiAodmVydC55ID4gYWNjLnlzWzFdLnZhbCkgYWNjLnlzWzFdLnZhbCA9IHZlcnQueTtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sIEFBQkIpO1xuICAgIH1cbn07XG5cbnZhciBzZXRWZXJ0cyA9IGZ1bmN0aW9uKG9iaikge1xuXG4gICAgb2JqLnBvcy54ID0gcGFyc2VJbnQob2JqLnBvcy54KTtcbiAgICBvYmoucG9zLnkgPSBwYXJzZUludChvYmoucG9zLnkpO1xuXG4gICAgdmFyIHZlcnRzID0gW1xuICAgICAgICB7eDogb2JqLnBvcy54IC0gb2JqLndpZHRoIC8gMiwgeTogb2JqLnBvcy55IC0gb2JqLmhlaWdodCAvIDJ9LCBcbiAgICAgICAge3g6IG9iai5wb3MueCArIG9iai53aWR0aCAvIDIsIHk6IG9iai5wb3MueSAtIG9iai5oZWlnaHQgLyAyfSwgXG4gICAgICAgIHt4OiBvYmoucG9zLnggKyBvYmoud2lkdGggLyAyLCB5OiBvYmoucG9zLnkgKyBvYmouaGVpZ2h0IC8gMn0sIFxuICAgICAgICB7eDogb2JqLnBvcy54IC0gb2JqLndpZHRoIC8gMiwgeTogb2JqLnBvcy55ICsgb2JqLmhlaWdodCAvIDJ9LCBcbiAgICBdO1xuXG4gICAgdmFyIHJvdCA9IG9iai5wb3Mucm90O1xuICAgIHZhciBveCA9IG9iai5wb3MueDtcbiAgICB2YXIgb3kgPSBvYmoucG9zLnk7XG5cbiAgICBvYmoudmVydHMgPSB2ZXJ0cy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB2YXIgdnggPSBpdGVtLng7XG4gICAgICAgIHZhciB2eSA9IGl0ZW0ueTtcbiAgICAgICAgaXRlbS54ID0gTWF0aC5jb3Mocm90KSAqICh2eCAtIG94KSAtIE1hdGguc2luKHJvdCkgKiAodnkgLSBveSkgKyBveDtcbiAgICAgICAgaXRlbS55ID0gTWF0aC5zaW4ocm90KSAqICh2eCAtIG94KSArIE1hdGguY29zKHJvdCkgKiAodnkgLSBveSkgKyBveTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSk7XG5cbiAgICBzZXRBQUJCKG9iaik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgdHlwZSkge1xuICAgIG9iai5nZW9tZXRyeSA9IHR5cGU7XG4gICAgaWYgKHR5cGUgPT09ICdjaXJjbGUnKSB7XG4gICAgICAgIG9iai5kZXRlY3RDb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgICAgIGlmIChjb2xsaWRlci5nZW9tZXRyeSA9PT0gJ2NpcmNsZScpIHJldHVybiBjaXJjbGVEZXRlY3Qob2JqLCBjb2xsaWRlcik7XG4gICAgICAgICAgICBpZiAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSByZXR1cm4gcG9pbnRJblBvbHlnb24oY29sbGlkZXIsIG9iaik7XG4gICAgICAgIH07XG4gICAgICAgIG9iai5tb3ZlKHtldjogc2V0QUFCQi5iaW5kKG51bGwsIG9iail9KTtcbiAgICAgICAgc2V0QUFCQihvYmopO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ3NxdWFyZScpIHtcbiAgICAgICAgb2JqLmRldGVjdENvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnc3F1YXJlJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnY2lyY2xlJykgcmV0dXJuIHBvaW50SW5Qb2x5Z29uKG9iaiwgY29sbGlkZXIpO1xuICAgICAgICB9O1xuICAgICAgICBvYmoud2lkdGggPSAxMDA7XG4gICAgICAgIG9iai5oZWlnaHQgPSAxMDA7XG4gICAgICAgIG9iai5zZXREaW1lbnNpb25zID0gZnVuY3Rpb24oZGltKSB7XG4gICAgICAgICAgICBpZiAoZGltKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpbS53aWR0aCkgb2JqLndpZHRoID0gZGltLndpZHRoO1xuICAgICAgICAgICAgICAgIGlmIChkaW0uaGVpZ2h0KSBvYmouaGVpZ2h0ID0gZGltLmhlaWdodDtcbiAgICAgICAgICAgICAgICBzZXRWZXJ0cyhvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9iai5tb3ZlKHtldjogc2V0VmVydHMuYmluZChudWxsLCBvYmopfSk7XG4gICAgICAgIHNldFZlcnRzKG9iaik7XG4gICAgfVxufTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmopIHtcblxuICAgIHZhciBpbnZlbnRvcnkgPSBbXTtcbiAgICBvYmoudGFrZUl0ZW1zID0gZnVuY3Rpb24oaXRlbXMpIHtcbiAgICAgICAgaWYgKCFpdGVtcy5sZW5ndGgpIGl0ZW1zID0gW2l0ZW1zXTtcbiAgICAgICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudE9iaiA9IG9iai5nZXRJbnZlbnRvcnlCeVR5cGUoaXRlbS50eXBlKVswXTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50T2JqICYmIGN1cnJlbnRPYmouY29uc29saWRhdGVJbnZlbnRvcnkpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50T2JqLnRha2VJdGVtcyhpdGVtLmdldEludmVudG9yeSgpKTtcbiAgICAgICAgICAgICAgICBpdGVtLnVubG9hZCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnZlbnRvcnkucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICBpdGVtLm93bmVyID0gb2JqO1xuICAgICAgICAgICAgICAgIGl0ZW0ubG9hZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIG9iai5kcm9wSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgaXRlbS5vd25lciA9IGZhbHNlO1xuICAgICAgICBpbnZlbnRvcnkgPSBpbnZlbnRvcnkuZmlsdGVyKGZ1bmN0aW9uKG1heWJlSXRlbSkgeyBpZiAobWF5YmVJdGVtLmlkICE9PSBpdGVtLmlkKSByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgfTtcbiAgICBvYmouZ2V0SW52ZW50b3J5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpbnZlbnRvcnkuc2xpY2UoKTtcbiAgICB9O1xuICAgIG9iai5nZXRJbnZlbnRvcnlCeVR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHJldHVybiBpbnZlbnRvcnkuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKGl0ZW0udHlwZSA9PT0gdHlwZSkgcmV0dXJuIHRydWU7IH0pO1xuICAgIH07XG4gICAgb2JqLmdldEludmVudG9yeUJ5QmFzZSA9IGZ1bmN0aW9uKGJhc2UpIHtcbiAgICAgICAgcmV0dXJuIGludmVudG9yeS5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyBpZiAoaXRlbS5iYXNlID09PSBiYXNlKSByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgfTtcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBvYmouc29saWQgPSB0cnVlO1xufTtcbiIsIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBzdGFydE9wdGlvbnMgPSB7fTtcbiAgICBvYmouc3RhcnRPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHJldHVybiBzdGFydE9wdGlvbnM7XG4gICAgICAgIGZvciAodmFyIG9wdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBzdGFydE9wdGlvbnNbb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuIiwidmFyIHRleHR1cmVEYXRhID0gcmVxdWlyZSgnLi90ZXh0dXJlRGF0YS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1ha2VWaXNpYmxlIChvYmopIHtcbiAgICBvYmoubG9hZChmdW5jdGlvbigpIHsgXG4gICAgICAgIG9iai50ZXh0dXJlRGF0YSA9IHRleHR1cmVEYXRhW29iai5iYXNlXVtvYmoudHlwZV07IFxuICAgICAgICBvYmoudmlzaWJsZSA9IHRydWU7XG4gICAgICAgIG9iai5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAob2JqLmluQ29udGFpbmVyKCkpIHtcbiAgICAgICAgICAgICAgICBvYmoudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvYmoudmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuIiwiZnVuY3Rpb24gTWF0cml4U3RhY2soKSB7XG4gICAgICB0aGlzLnN0YWNrID0gW107XG5cbiAgICAgIC8vc2luY2UgdGhlIHN0YWNrIGlzIGVtcHR5IHRoaXMgd2lsbCBwdXQgYW4gaW5pdGlhbCBtYXRyaXggaW4gaXRcbiAgICAgICAgICB0aGlzLnJlc3RvcmUoKTtcbn1cblxuLy8gUG9wcyB0aGUgdG9wIG9mIHRoZSBzdGFjayByZXN0b3JpbmcgdGhlIHByZXZpb3VzbHkgc2F2ZWQgbWF0cml4XG5NYXRyaXhTdGFjay5wcm90b3R5cGUucmVzdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhY2sucG9wKCk7XG4gICAgLy8gTmV2ZXIgbGV0IHRoZSBzdGFjayBiZSB0b3RhbGx5IGVtcHR5XG4gICAgaWYgKHRoaXMuc3RhY2subGVuZ3RoIDwgMSkge1xuICAgICAgICB0aGlzLnN0YWNrWzBdID0gbTQuaWRlbnRpdHkoKTtcbiAgICB9XG59O1xuXG4vLyBQdXNoZXMgYSBjb3B5IG9mIHRoZSBjdXJyZW50IG1hdHJpeCBvbiB0aGUgc3RhY2tcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGFjay5wdXNoKHRoaXMuZ2V0Q3VycmVudE1hdHJpeCgpKTtcbn07XG5cbi8vIEdldHMgYSBjb3B5IG9mIHRoZSBjdXJyZW50IG1hdHJpeCAodG9wIG9mIHRoZSBzdGFjaylcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5nZXRDdXJyZW50TWF0cml4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXS5zbGljZSgpO1xufTtcblxuLy8gTGV0cyB1cyBzZXQgdGhlIGN1cnJlbnQgbWF0cml4XG5NYXRyaXhTdGFjay5wcm90b3R5cGUuc2V0Q3VycmVudE1hdHJpeCA9IGZ1bmN0aW9uKG0pIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdID0gbTtcbn07XG5cbi8vIFRyYW5zbGF0ZXMgdGhlIGN1cnJlbnQgbWF0cml4XG5NYXRyaXhTdGFjay5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgIGlmICh6ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgeiA9IDA7XG4gICAgfVxuICAgIHZhciBtID0gdGhpcy5nZXRDdXJyZW50TWF0cml4KCk7XG4gICAgdGhpcy5zZXRDdXJyZW50TWF0cml4KG00LnRyYW5zbGF0ZShtLCB4LCB5LCB6KSk7XG59O1xuXG4vLyBSb3RhdGVzIHRoZSBjdXJyZW50IG1hdHJpeCBhcm91bmQgWlxuTWF0cml4U3RhY2sucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbihhbmdsZUluUmFkaWFucykge1xuICAgIHZhciBtID0gdGhpcy5nZXRDdXJyZW50TWF0cml4KCk7XG4gICAgdGhpcy5zZXRDdXJyZW50TWF0cml4KG00LnpSb3RhdGUobSwgYW5nbGVJblJhZGlhbnMpKTtcbn07XG5cbi8vIFNjYWxlcyB0aGUgY3VycmVudCBtYXRyaXhcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgICBpZiAoeiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHogPSAxO1xuICAgIH1cbiAgICB2YXIgbSA9IHRoaXMuZ2V0Q3VycmVudE1hdHJpeCgpO1xuICAgIHRoaXMuc2V0Q3VycmVudE1hdHJpeChtNC5zY2FsZShtLCB4LCB5LCB6KSk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTWF0cml4U3RhY2s7XG4iLCJ2YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VWaXNpYmxlID0gcmVxdWlyZSgnLi9tYWtlVmlzaWJsZS5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByb2plY3RpbGUgPSBiYXNlRW50aXR5KCk7XG4gICAgbWFrZVZpc2libGUocHJvamVjdGlsZSk7XG4gICAgbWFrZUdlb21ldHJ5KHByb2plY3RpbGUsICdjaXJjbGUnKTtcbiAgICBwcm9qZWN0aWxlLmJhc2UgPSAncHJvamVjdGlsZSc7XG5cbiAgICByZXR1cm4gcHJvamVjdGlsZTtcbn07XG5cbiIsInZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciBnbCA9IHJlcXVpcmUoJy4vd2ViZ2wuanMnKTtcbnZhciBXb3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcbi8vdmFyIGF1ZGlvID0gcmVxdWlyZSgnLi9hdWRpby5qcycpO1xudmFyIGN1cnJlbnRMZXZlbDtcbnZhciBwb3Y7XG52YXIgY2FudmFzRGltID0gZ2wuY2FudmFzRGltZW5zaW9ucztcbldvcmxkLmNhbnZhc0RpbSA9IGNhbnZhc0RpbTtcblxuXG52YXIgc3RlcCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgZ2wuY2xlYXIoKTtcbiAgICBnbC5zZXRVcENhbWVyYShwb3YpO1xuICAgIHZhciB0ZXh0dXJlID0gZ2wuZ2V0VGV4dHVyZSgpO1xuICAgIHZhciBpbnN0YW5jZXMgPSBbXTtcbiAgICB2YXIgdGV4dHVyZXMgPSBbXTtcbiAgICB2YXIgZGltcyA9IFtdO1xuICAgIFdvcmxkLmdldEdlb21ldHJ5KCdzcXVhcmUnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0sIGluZGV4LCBhcnJheSkge1xuICAgICAgICBpbnN0YW5jZXMgPSBpbnN0YW5jZXMuY29uY2F0KFtpdGVtLnBvcy54LCBpdGVtLnBvcy55LCBpdGVtLnBvcy5yb3RdKTtcbiAgICAgICAgdGV4dHVyZXMgPSB0ZXh0dXJlcy5jb25jYXQoW1xuICAgICAgICAgICAgICAgIGl0ZW0udGV4dHVyZURhdGEuZnJhbWUueCAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLndpZHRoIDogMSksIFxuICAgICAgICAgICAgICAgIGl0ZW0udGV4dHVyZURhdGEuZnJhbWUueSAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLmhlaWdodCA6IDEpLCBcbiAgICAgICAgICAgICAgICBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLncgLyAoKHRleHR1cmUpID8gdGV4dHVyZS53aWR0aCA6IDEpLCBcbiAgICAgICAgICAgICAgICBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLmggLyAoKHRleHR1cmUpID8gdGV4dHVyZS5oZWlnaHQgOiAxKVxuICAgICAgICBdKTtcbiAgICAgICAgZGltcyA9IGRpbXMuY29uY2F0KFtpdGVtLndpZHRoLCBpdGVtLmhlaWdodF0pO1xuICAgIH0pO1xuICAgIGdsLmRyYXdTcXVhcmVzKGluc3RhbmNlcywgZGltcywgdGV4dHVyZXMpO1xuICAgIGluc3RhbmNlcyA9IFtdO1xuICAgIHRleHR1cmVzID0gW107XG4gICAgV29ybGQuZ2V0R2VvbWV0cnkoJ2NpcmNsZScpLmZvckVhY2goZnVuY3Rpb24oaXRlbSwgaW5kZXgsIGFycmF5KSB7XG4gICAgICAgIGluc3RhbmNlcyA9IGluc3RhbmNlcy5jb25jYXQoW2l0ZW0ucG9zLngsIGl0ZW0ucG9zLnksIGl0ZW0ucG9zLnJvdCwgaXRlbS5yYWRpdXNdKTtcbiAgICAgICAgdGV4dHVyZXMgPSB0ZXh0dXJlcy5jb25jYXQoW1xuICAgICAgICAgICAgICAgIChpdGVtLnRleHR1cmVEYXRhLmZyYW1lLnggKyAoKChpdGVtLnBvc2UpID8gaXRlbS5wb3NlLnggOiAwKSAvICgoaXRlbS50ZXh0dXJlRGF0YS5wb3NlcykgPyBpdGVtLnRleHR1cmVEYXRhLnBvc2VzLnggOiAxKSkgKiBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLncpIC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUud2lkdGggOiAxKSwgXG4gICAgICAgICAgICAgICAgKGl0ZW0udGV4dHVyZURhdGEuZnJhbWUueSArICgoKGl0ZW0ucG9zZSkgPyBpdGVtLnBvc2UueSA6IDApIC8gKChpdGVtLnRleHR1cmVEYXRhLnBvc2VzKSA/IGl0ZW0udGV4dHVyZURhdGEucG9zZXMueSA6IDEpKSAqIGl0ZW0udGV4dHVyZURhdGEuZnJhbWUuaCkgLyAoKHRleHR1cmUpID8gdGV4dHVyZS5oZWlnaHQgOiAxKSwgXG4gICAgICAgICAgICAgICAgKGl0ZW0udGV4dHVyZURhdGEuZnJhbWUudyAvICgoaXRlbS50ZXh0dXJlRGF0YS5wb3NlcykgPyBpdGVtLnRleHR1cmVEYXRhLnBvc2VzLnggOiAxKSkgLyAoKHRleHR1cmUpID8gdGV4dHVyZS53aWR0aCA6IDEpLCBcbiAgICAgICAgICAgICAgICAoaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS5oIC8gKChpdGVtLnRleHR1cmVEYXRhLnBvc2VzKSA/IGl0ZW0udGV4dHVyZURhdGEucG9zZXMueSA6IDEpKSAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLmhlaWdodCA6IDEpXG4gICAgICAgIF0pO1xuICAgIH0pO1xuICAgIGdsLmRyYXdDaXJjbGVzKGluc3RhbmNlcywgdGV4dHVyZXMpO1xuXG59O1xuXG52YXIgYXBpID0ge1xuICAgIHN0ZXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAocG92ICYmIGdsLmlzTG9hZGVkKCkpIHN0ZXAoKTtcbiAgICB9LFxuICAgIGNvbm5lY3RDYW1lcmE6IGZ1bmN0aW9uKGNhbWVyYSkge1xuICAgICAgICBwb3YgPSBjYW1lcmEucG9zO1xuICAgIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XG4iLCJ2YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIHpvbWJpZSA9IHJlcXVpcmUoJy4vWm9tYmllLmpzJyk7XG52YXIgbWFrZVN0YXJ0T3B0aW9ucyA9IHJlcXVpcmUoJy4vbWFrZVN0YXJ0T3B0aW9ucy5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG4vL3ZhciB3b3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIHNwYXduZXIgPSBiYXNlRW50aXR5KCk7XG4gICAgbWFrZVN0YXJ0T3B0aW9ucyhzcGF3bmVyKTtcbiAgICBtYWtlR2VvbWV0cnkoc3Bhd25lciwgJ2NpcmNsZScpO1xuICAgIHZhciB0aW1lciA9IERhdGUubm93KCk7XG4gICAgdmFyIHNwYXduaW5nID0gb3B0aW9ucy5zdGFydDtcbiAgICB2YXIgc3Bhd25Db3VudCA9IG9wdGlvbnMuc3Bhd25Db3VudDtcbiAgICB2YXIgbGFzdFNwYXduID0gRGF0ZS5ub3coKTtcbiAgICBzcGF3bmVyLnN0YXJ0T3B0aW9ucyh7XG4gICAgICAgIHN0YXJ0OiBvcHRpb25zLnN0YXJ0LFxuICAgICAgICBzcGF3bkNvdW50OiBvcHRpb25zLnNwYXduQ291bnQsXG4gICAgICAgIGludGVydmFsOiBvcHRpb25zLmludGVydmFsXG4gICAgfSk7XG4gICAgXG4gICAgc3Bhd25lci5iYXNlID0gJ3NwYXduZXInO1xuICAgIHNwYXduZXIudHlwZSA9ICd6b21iaWVTcGF3bmVyJztcbiAgICBzcGF3bmVyLm1vdmUob3B0aW9ucy5wb3MpO1xuICAgIHNwYXduZXIuc3RlcChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGlmIChzcGF3bmluZykge1xuICAgICAgICAgICAgaWYgKHNwYXduQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBzcGF3bkNvdW50ID0gb3B0aW9ucy5zcGF3bkNvdW50O1xuICAgICAgICAgICAgICAgIHNwYXduaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGltZXIgPSBub3c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm93IC0gbGFzdFNwYXduID4gNTAwKSB7XG4gICAgICAgICAgICAgICAgbGFzdFNwYXduID0gbm93O1xuICAgICAgICAgICAgICAgIHdvcmxkLmxvYWRJdGVtcyh6b21iaWUoe3Bvczogc3Bhd25lci5wb3N9KSk7XG4gICAgICAgICAgICAgICAgc3Bhd25Db3VudC0tO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobm93IC0gdGltZXIgPiBvcHRpb25zLmludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgc3Bhd25pbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3Bhd25lcjtcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0ge1wiZnJhbWVzXCI6e1wiYnVsbGV0XCI6e1wiZnJhbWVcIjp7XCJ4XCI6NDUzLFwieVwiOjkyMixcIndcIjoyMDEsXCJoXCI6NDZ9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MjAxLFwiaFwiOjQ2fSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MjAxLFwiaFwiOjQ2fX0sXCJtYWNoaW5lZ3VuXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MCxcInlcIjo5MjIsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAsXCJoXCI6MTUwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwLFwiaFwiOjE1MH19LFwicGlzdG9sXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MTUxLFwieVwiOjkyMixcIndcIjoxNTAsXCJoXCI6MTUwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MCxcImhcIjoxNTB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAsXCJoXCI6MTUwfX0sXCJwbGF5ZXJcIjp7XCJmcmFtZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwMCxcImhcIjoyODB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwMCxcImhcIjoyODB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjI4MH19LFwic2hvdGd1blwiOntcImZyYW1lXCI6e1wieFwiOjMwMixcInlcIjo5MjIsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAsXCJoXCI6MTUwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwLFwiaFwiOjE1MH19LFwid2FsbFwiOntcImZyYW1lXCI6e1wieFwiOjQ1MyxcInlcIjo5NjksXCJ3XCI6MTAwLFwiaFwiOjEwMH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxMDAsXCJoXCI6MTAwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTAwLFwiaFwiOjEwMH19LFwiem9tYmllMVwiOntcImZyYW1lXCI6e1wieFwiOjAsXCJ5XCI6MTc2MCxcIndcIjoxNTAwLFwiaFwiOjU2MH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAwLFwiaFwiOjU2MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MDAsXCJoXCI6NTYwfX0sXCJ6b21iaWUyXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MCxcInlcIjoyODEsXCJ3XCI6MTUwMCxcImhcIjo2NDB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwMCxcImhcIjo2NDB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjY0MH19LFwiem9tYmllM1wiOntcImZyYW1lXCI6e1wieFwiOjAsXCJ5XCI6MTYzNCxcIndcIjoxNTAwLFwiaFwiOjY4Nn0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAwLFwiaFwiOjY4Nn0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MDAsXCJoXCI6Njg2fX19LFwibWV0YVwiOntcImFwcFwiOlwiaHR0cHM6Ly93d3cubGVzaHlsYWJzLmNvbS9hcHBzL3NzdG9vbC9cIixcInZlcnNpb25cIjpcIkxlc2h5IFNwcml0ZVNoZWV0IFRvb2wgdjAuOC40XCIsXCJpbWFnZVwiOlwic3ByaXRlc2hlZXQucG5nXCIsXCJzaXplXCI6e1wid1wiOjE1MDAsXCJoXCI6MjMyMH0sXCJzY2FsZVwiOjF9fTtcbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgbWFrZVZpc2libGUgPSByZXF1aXJlKCcuL21ha2VWaXNpYmxlLmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIHNxdWFyZSA9IGJhc2VFbnRpdHkoKTtcbiAgICBtYWtlR2VvbWV0cnkoc3F1YXJlLCAnc3F1YXJlJyk7XG4gICAgbWFrZVZpc2libGUoc3F1YXJlKTtcbiAgICBzcXVhcmUuc2V0RGltZW5zaW9ucyh7d2lkdGg6IG9wdGlvbnMud2lkdGgsIGhlaWdodDogb3B0aW9ucy5oZWlnaHR9KTtcbiAgICBzcXVhcmUubW92ZShvcHRpb25zLnBvcyk7XG4gICAgc3F1YXJlLmJhc2UgPSAnc3F1YXJlJztcbiAgICBzcXVhcmUudHlwZSA9ICd0aWxlJztcbiAgICBzcXVhcmUuY29sbGlkZSA9IGZ1bmN0aW9uKCkge307XG5cbiAgICByZXR1cm4gc3F1YXJlO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuXG4gICAge2VudGl0eTogJ3Rlc3QnLCBwb3M6IHt4OiAtNDAwLCB5OiAtNDA1LCByb3Q6IDB9fSxcbiAgICB7ZW50aXR5OiAndGVzdCcsIHBvczoge3g6IC00MDAsIHk6IC00MDUsIHJvdDogMH19XG4gICAgLy97ZW50aXR5OiAnd2FsbCcsIHBvczoge3g6IC00NTAsIHk6IC00NTAsIHJvdDogMH0sIGRpbToge3c6IDMwMCwgaDogMzAwfX0sXG4gICAgLy97ZW50aXR5OiAnc3F1YXJlJywgcG9zOiB7eDogLTEyNTAsIHk6IC0xMjUwLCByb3Q6IDQ1fSwgZGltOiB7dzogMjUwMCwgaDogMjUwMH19XG5cbiAgICAvKntlbnRpdHk6ICdUaWxlJywgcG9zOiB7eDogMjUwMCwgeTogMjUwMH0sIHdpZHRoOiA1MDAwLCBoZWlnaHQ6IDUwMDAsIHBhdGg6ICcuL2ltZy9iYWNrZ3JvdW5kLmpwZyd9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDAsIHk6IDM5MDAsIHJvdDogMH0sIHdpZHRoOiAxMDAsIGhlaWdodDogMjYwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogMCwgeTogMTEwMCwgcm90OiAwfSwgd2lkdGg6IDEwMCwgaGVpZ2h0OiAyMjAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiAyNTAwLCB5OiAwLCByb3Q6IDB9LCB3aWR0aDogNTAwMCwgaGVpZ2h0OiAxMDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDI1MDAsIHk6IDUwMDAsIHJvdDogMH0sIHdpZHRoOiA1MDAwLCBoZWlnaHQ6IDEwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogNTAwMCwgeTogMjUwMCwgcm90OiAwfSwgd2lkdGg6IDEwMCwgaGVpZ2h0OiA1MDAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvY2FyMS5wbmcnLCBwb3M6IHt4OiAzMDAsIHk6IDMwMCwgcm90OiAyfSwgd2lkdGg6IDIwMCwgaGVpZ2h0OiAzMDB9LFxuICAgIHtlbnRpdHk6ICdab21iaWUnLCBpbWc6IDIsIHBvczoge3g6IDE5MDAsIHk6IDE3MDAsIHJvdDogMH19XG4qL1xuXTtcblxuXG4iLCJ2YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG52YXIgbWFrZVNvbGlkID0gcmVxdWlyZSgnLi9tYWtlU29saWQuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIG9iaiA9IGJhc2VFbnRpdHkoKTtcbiAgICBvYmoucmFkaXVzID0gMTA7XG4gICAgbWFrZUdlb21ldHJ5KG9iaiwgJ2NpcmNsZScpO1xuICAgIG1ha2VTb2xpZChvYmopO1xuICAgIG9iai5iYXNlID0gJ29iaic7XG4gICAgb2JqLnR5cGUgPSAndGVzdCc7XG4gICAgb2JqLm1vdmUob3B0aW9ucy5wb3MpO1xuICAgIG9iai5jb2xsaWRlID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIHJldHVybiBvYmo7XG59O1xuXG4iLCJ2YXIgc3ByaXRlcyA9IHJlcXVpcmUoJy4vc3ByaXRlcy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjaGFyYWN0ZXI6IHtcbiAgICAgICAgem9tYmllOiB7IFxuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLnpvbWJpZTIuZnJhbWUsXG4gICAgICAgICAgICBwb3Nlczoge1xuICAgICAgICAgICAgICAgIHg6IDYsXG4gICAgICAgICAgICAgICAgeTogNCxcbiAgICAgICAgICAgICAgICBzbGlkZXM6IFs2LCA1LCAyLCAzXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6b21iaWUyOiB7IFxuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLnpvbWJpZTIuZnJhbWUsXG4gICAgICAgICAgICBwb3Nlczoge1xuICAgICAgICAgICAgICAgIHg6IDYsXG4gICAgICAgICAgICAgICAgeTogMixcbiAgICAgICAgICAgICAgICBzbGlkZXM6IFs2LCA1XVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6b21iaWUzOiB7IFxuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLnpvbWJpZTMuZnJhbWUsXG4gICAgICAgICAgICBwb3Nlczoge1xuICAgICAgICAgICAgICAgIHg6IDYsXG4gICAgICAgICAgICAgICAgeTogMixcbiAgICAgICAgICAgICAgICBzbGlkZXM6IFs2LCA1XVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBwbGF5ZXI6IHsgXG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMucGxheWVyLmZyYW1lLFxuICAgICAgICAgICAgcG9zZXM6IHtcbiAgICAgICAgICAgICAgICB4OiA2LFxuICAgICAgICAgICAgICAgIHk6IDIsXG4gICAgICAgICAgICAgICAgc2xpZGVzOiBbNiwgNV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgcHJvamVjdGlsZToge1xuICAgICAgICBidWxsZXQ6IHtcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy5idWxsZXQuZnJhbWVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc3F1YXJlOiB7XG4gICAgICAgIHRpbGU6IHtcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy53YWxsLmZyYW1lXG4gICAgICAgIH0sXG4gICAgICAgIHdhbGw6IHtcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy53YWxsLmZyYW1lXG4gICAgICAgIH0sXG4gICAgICAgIGRvb3I6IHtcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy53YWxsLmZyYW1lXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHdlYXBvbjoge1xuICAgICAgICBndW46IHtcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy5waXN0b2wuZnJhbWVcbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCJ2YXIgc3F1YXJlID0gcmVxdWlyZSgnLi9zcXVhcmUuanMnKTtcbnZhciBtYWtlU29saWQgPSByZXF1aXJlKCcuL21ha2VTb2xpZC5qcycpO1xudmFyIG1ha2VWaXNpYmxlID0gcmVxdWlyZSgnLi9tYWtlVmlzaWJsZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgIHdhbGwgPSBzcXVhcmUob3B0aW9ucyk7XG4gICAgbWFrZVZpc2libGUod2FsbCk7XG4gICAgd2FsbC5vblRvcCA9IHRydWU7XG4gICAgbWFrZVNvbGlkKHdhbGwpO1xuICAgIHdhbGwudHlwZSA9ICd3YWxsJztcblxuICAgIHJldHVybiB3YWxsO1xufTtcbiIsInZhciBtYWtlVmlzaWJsZSA9IHJlcXVpcmUoJy4vbWFrZVZpc2libGUuanMnKTtcbnZhciBtYWtlSW52ZW50b3J5ID0gcmVxdWlyZSgnLi9tYWtlSW52ZW50b3J5LmpzJyk7XG52YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3ZWFwb24gPSBiYXNlRW50aXR5KCk7XG4gICAgbWFrZUdlb21ldHJ5KHdlYXBvbiwgJ2NpcmNsZScpO1xuICAgIG1ha2VTb2xpZCh3ZWFwb24pO1xuICAgIG1ha2VWaXNpYmxlKHdlYXBvbik7XG4gICAgbWFrZUludmVudG9yeSh3ZWFwb24pO1xuICAgIHdlYXBvbi5iYXNlID0gJ3dlYXBvbic7XG4gICAgd2VhcG9uLnJhZGl1cyA9ICcxMCc7XG4gICAgd2VhcG9uLmNvb2xEb3duID0gNTtcbiAgICB3ZWFwb24uY29uc29saWRhdGVJbnZlbnRvcnkgPSB0cnVlO1xuICAgIHdlYXBvbi5jb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgc3dpdGNoIChjb2xsaWRlci50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdwbGF5ZXInOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdlYXBvbjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBtYXRyaXhTdGFjayA9IHJlcXVpcmUoJy4vbWF0cml4U3RhY2suanMnKTtcbnZhciBnZXQgPSByZXF1aXJlKCcuL2dldC5qcycpO1xubWF0cml4U3RhY2sgPSBuZXcgbWF0cml4U3RhY2soKTtcblxudmFyIGdsLCBkcmF3U3F1YXJlcywgZHJhd0NpcmNsZXMsIHNldFVwQ2FtZXJhLCB0ZXh0dXJlLCBjaXJjbGVWZXJ0U2hhZGVyLCBzcXVhcmVWZXJ0U2hhZGVyLCBjaXJjbGVGcmFnU2hhZGVyLCBzcXVhcmVGcmFnU2hhZGVyLCBpc0xvYWRlZDtcbnZhciBjYW52YXNTcGFjZSA9IHt9O1xudmFyIGFzc2V0cyA9IDA7XG5jYW52YXNTcGFjZS53aWR0aCA9IDMwMDA7XG5jYW52YXNTcGFjZS5oZWlnaHQgPSAxNTAwO1xuXG52YXIgbG9hZGVkQXNzZXQgPSBmdW5jdGlvbigpIHtcbiAgICBhc3NldHMrKztcbiAgICBpZiAoYXNzZXRzID09PSA1KSBsb2FkZWQoKTtcbn07XG5cbmdldCgnLi4vZ2xzbC9jaXJjbGUudmVydCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBjaXJjbGVWZXJ0U2hhZGVyID0gZGF0YTtcbiAgICBsb2FkZWRBc3NldCgpO1xufSk7XG5cbmdldCgnLi4vZ2xzbC9zcXVhcmUudmVydCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBzcXVhcmVWZXJ0U2hhZGVyID0gZGF0YTtcbiAgICBsb2FkZWRBc3NldCgpO1xufSk7XG5cbmdldCgnLi4vZ2xzbC9jaXJjbGUuZnJhZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBjaXJjbGVGcmFnU2hhZGVyID0gZGF0YTtcbiAgICBsb2FkZWRBc3NldCgpO1xufSk7XG5cbmdldCgnLi4vZ2xzbC9zcXVhcmUuZnJhZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBzcXVhcmVGcmFnU2hhZGVyID0gZGF0YTtcbiAgICBsb2FkZWRBc3NldCgpO1xufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgbG9hZGVkQXNzZXQoKTtcbn0pO1xuXG52YXIgbG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaXNMb2FkZWQgPSB0cnVlO1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XG4gICAgY2FudmFzLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCBjYW52YXNTcGFjZS53aWR0aCk7XG4gICAgY2FudmFzLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgY2FudmFzU3BhY2UuaGVpZ2h0KTtcbiAgICBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpO1xuICAgIHZhciBleHQgPSBnbC5nZXRFeHRlbnNpb24oXCJBTkdMRV9pbnN0YW5jZWRfYXJyYXlzXCIpOyAvLyBWZW5kb3IgcHJlZml4ZXMgbWF5IGFwcGx5IVxuXG5cblxuICAgIC8vIEdldCBBIFdlYkdMIGNvbnRleHRcbiAgICAvKiogQHR5cGUge0hUTUxDYW52YXNFbGVtZW50fSAqL1xuXG5cbiAgICAvLyBzZXR1cCBHTFNMIHByb2dyYW1cbiAgICB2YXIgY2lyY2xlc1Byb2dyYW0gPSB3ZWJnbFV0aWxzLmNyZWF0ZVByb2dyYW1Gcm9tU291cmNlcyhnbCwgW2NpcmNsZVZlcnRTaGFkZXIsIGNpcmNsZUZyYWdTaGFkZXJdKTtcbiAgICB2YXIgc3F1YXJlc1Byb2dyYW0gPSB3ZWJnbFV0aWxzLmNyZWF0ZVByb2dyYW1Gcm9tU291cmNlcyhnbCwgW3NxdWFyZVZlcnRTaGFkZXIsIHNxdWFyZUZyYWdTaGFkZXJdKTtcblxuICAgIC8vIGxvb2sgdXAgd2hlcmUgdGhlIHZlcnRleCBkYXRhIG5lZWRzIHRvIGdvLlxuICAgIHZhciBjaXJjbGVQb3NpdGlvbkxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oY2lyY2xlc1Byb2dyYW0sIFwiYV9wb3NpdGlvblwiKTtcbiAgICB2YXIgY2lyY2xlVGV4Y29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKGNpcmNsZXNQcm9ncmFtLCBcImFfdGV4Y29vcmRcIik7XG4gICAgdmFyIGNpcmNsZUluc3RhbmNlTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihjaXJjbGVzUHJvZ3JhbSwgXCJhX2luc3RhbmNlXCIpO1xuICAgIHZhciBjaXJjbGVUZXh0dXJlc0xvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oY2lyY2xlc1Byb2dyYW0sIFwiYV9wb3NlXCIpO1xuICAgIHZhciBzcXVhcmVQb3NpdGlvbkxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwiYV9wb3NpdGlvblwiKTtcbiAgICB2YXIgc3F1YXJlVGV4Y29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcImFfdGV4Y29vcmRcIik7XG4gICAgdmFyIHNxdWFyZUluc3RhbmNlTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJhX2luc3RhbmNlXCIpO1xuICAgIHZhciBzcXVhcmVUZXh0dXJlc0xvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwiYV9wb3NlXCIpO1xuICAgIHZhciBzcXVhcmVEaW1zTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJhX2RpbVwiKTtcblxuICAgIC8vIGxvb2t1cCB1bmlmb3Jtc1xuICAgIHZhciBjaXJjbGVDYW1lcmFNYXRyaXhMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihjaXJjbGVzUHJvZ3JhbSwgXCJ1X2NhbWVyYU1hdHJpeFwiKTtcbiAgICB2YXIgY2lyY2xlQ2FudmFzRGltc0xvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKGNpcmNsZXNQcm9ncmFtLCBcInVfY2FudmFzRGltc1wiKTtcbiAgICB2YXIgc3F1YXJlQ2FtZXJhTWF0cml4TG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwidV9jYW1lcmFNYXRyaXhcIik7XG4gICAgdmFyIHNxdWFyZUNhbnZhc0RpbXNMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJ1X2NhbnZhc0RpbXNcIik7XG4gICAgdmFyIHNxdWFyZVRleHR1cmVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJ1X3RleHR1cmVcIik7XG4gICAgdmFyIGNpcmNsZVRleHR1cmVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihjaXJjbGVzUHJvZ3JhbSwgXCJ1X3RleHR1cmVcIik7XG5cbiAgICB2YXIgZGltc0J1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBkaW1zQnVmZmVyKTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgWzAsIDAsIDBdLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICB2YXIgdGV4dHVyZUJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0ZXh0dXJlQnVmZmVyKTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgWzAsIDAsIDBdLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICB2YXIgaW5zdGFuY2VCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgaW5zdGFuY2VCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBbMCwgMCwgMF0sIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAvLyBDcmVhdGUgYSBidWZmZXIuXG4gICAgdmFyIHBvc2l0aW9uQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBvc2l0aW9uQnVmZmVyKTtcblxuICAgIHZhciBwb3NpdGlvbnMgPSBbXG4gICAgICAgIC0uNSwgLS41LFxuICAgICAgICAtLjUsIC41LFxuICAgICAgICAuNSwgLS41LFxuICAgICAgICAuNSwgLS41LFxuICAgICAgICAtLjUsIC41LFxuICAgICAgICAuNSwgLjVcbiAgICBdO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucyksIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgIC8vIENyZWF0ZSBhIGJ1ZmZlciBmb3IgdGV4dHVyZSBjb29yZHNcbiAgICB2YXIgdGV4Y29vcmRCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4Y29vcmRCdWZmZXIpO1xuXG4gICAgLy8gUHV0IHRleGNvb3JkcyBpbiB0aGUgYnVmZmVyXG4gICAgdmFyIHRleGNvb3JkcyA9IFtcbiAgICAgICAgMCwgMCxcbiAgICAgICAgMCwgMSxcbiAgICAgICAgMSwgMCxcbiAgICAgICAgMSwgMCxcbiAgICAgICAgMCwgMSxcbiAgICAgICAgMSwgMVxuICAgIF07XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGV4Y29vcmRzKSwgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgLy8gY3JlYXRlcyBhIHRleHR1cmUgaW5mbyB7IHdpZHRoOiB3LCBoZWlnaHQ6IGgsIHRleHR1cmU6IHRleCB9XG4gICAgLy8gVGhlIHRleHR1cmUgd2lsbCBzdGFydCB3aXRoIDF4MSBwaXhlbHMgYW5kIGJlIHVwZGF0ZWRcbiAgICAvLyB3aGVuIHRoZSBpbWFnZSBoYXMgbG9hZGVkXG4gICAgZnVuY3Rpb24gbG9hZEltYWdlQW5kQ3JlYXRlVGV4dHVyZUluZm8odXJsKSB7XG4gICAgICAgIHZhciB0ZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleCk7XG4gICAgICAgIC8vIEZpbGwgdGhlIHRleHR1cmUgd2l0aCBhIDF4MSBibHVlIHBpeGVsLlxuICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIDEsIDEsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsXG4gICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoWzAsIDAsIDI1NSwgMjU1XSkpO1xuXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLlJFUEVBVCk7XG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLlJFUEVBVCk7XG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUX01JUE1BUF9ORUFSRVNUKTtcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xuXG4gICAgICAgIHZhciB0ZXh0dXJlSW5mbyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiAxLCAgIC8vIHdlIGRvbid0IGtub3cgdGhlIHNpemUgdW50aWwgaXQgbG9hZHNcbiAgICAgICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgICAgIHRleHR1cmU6IHRleCxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGV4dHVyZUluZm8ud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICB0ZXh0dXJlSW5mby5oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlSW5mby50ZXh0dXJlKTtcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1nKTtcbiAgICAgICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xuICAgICAgICB9KTtcbiAgICAgICAgaW1nLnNyYyA9IHVybDtcblxuICAgICAgICByZXR1cm4gdGV4dHVyZUluZm87XG4gICAgfTtcblxuICAgIHRleHR1cmUgPSBsb2FkSW1hZ2VBbmRDcmVhdGVUZXh0dXJlSW5mbygnLi9pbWcvc3ByaXRlc2hlZXQucG5nJyk7XG5cbiAgICBzZXRVcENhbWVyYSA9IGZ1bmN0aW9uKHBvdikge1xuICAgICAgICB2YXIgb3J0aG8gPSBtNC5vcnRob2dyYXBoaWMoMCwgY2FudmFzU3BhY2Uud2lkdGgsIGNhbnZhc1NwYWNlLmhlaWdodCwgMCwgLTEsIDEpO1xuICAgICAgICBnbC51c2VQcm9ncmFtKHNxdWFyZXNQcm9ncmFtKTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihzcXVhcmVDYW1lcmFNYXRyaXhMb2NhdGlvbiwgZmFsc2UsIG9ydGhvKTtcbiAgICAgICAgZ2wudW5pZm9ybTJmKHNxdWFyZUNhbnZhc0RpbXNMb2NhdGlvbiwgY2FudmFzU3BhY2Uud2lkdGggLyAyIC0gcG92LngsIGNhbnZhc1NwYWNlLmhlaWdodCAvIDIgLSBwb3YueSk7XG4gICAgICAgIGdsLnVzZVByb2dyYW0oY2lyY2xlc1Byb2dyYW0pO1xuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KGNpcmNsZUNhbWVyYU1hdHJpeExvY2F0aW9uLCBmYWxzZSwgb3J0aG8pO1xuICAgICAgICBnbC51bmlmb3JtMmYoY2lyY2xlQ2FudmFzRGltc0xvY2F0aW9uLCBjYW52YXNTcGFjZS53aWR0aCAvIDIgLSBwb3YueCwgY2FudmFzU3BhY2UuaGVpZ2h0IC8gMiAtIHBvdi55KTtcbiAgICB9O1xuXG4gICAgZHJhd1NxdWFyZXMgPSBmdW5jdGlvbihpbnN0YW5jZXMsIGRpbXMsIHRleHR1cmVzKSB7XG5cbiAgICAgICAgZ2wudXNlUHJvZ3JhbShzcXVhcmVzUHJvZ3JhbSk7XG5cbiAgICAgICAgdmFyIGluc3RhbmNlQ291bnQgPSBpbnN0YW5jZXMubGVuZ3RoIC8gMztcbiAgICAgICAgaW5zdGFuY2VzID0gbmV3IEZsb2F0MzJBcnJheShpbnN0YW5jZXMpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgaW5zdGFuY2VCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgaW5zdGFuY2VzLCBnbC5EWU5BTUlDX0RSQVcsIDAsIGluc3RhbmNlcy5sZW5ndGgpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzcXVhcmVJbnN0YW5jZUxvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzcXVhcmVJbnN0YW5jZUxvY2F0aW9uLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDEyLCAwKTtcbiAgICAgICAgZXh0LnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShzcXVhcmVJbnN0YW5jZUxvY2F0aW9uLCAxKTsgXG5cbiAgICAgICAgZGltcyA9IG5ldyBGbG9hdDMyQXJyYXkoZGltcyk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBkaW1zQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRpbXMsIGdsLkRZTkFNSUNfRFJBVywgMCwgZGltcy5sZW5ndGgpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzcXVhcmVEaW1zTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNxdWFyZURpbXNMb2NhdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCA4LCAwKTtcbiAgICAgICAgZXh0LnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShzcXVhcmVEaW1zTG9jYXRpb24sIDEpOyBcblxuICAgICAgICB0ZXh0dXJlcyA9IG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZXMpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4dHVyZUJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0ZXh0dXJlcywgZ2wuRFlOQU1JQ19EUkFXLCAwLCB0ZXh0dXJlcy5sZW5ndGgpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzcXVhcmVUZXh0dXJlc0xvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzcXVhcmVUZXh0dXJlc0xvY2F0aW9uLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDE2LCAwKTtcbiAgICAgICAgZXh0LnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShzcXVhcmVUZXh0dXJlc0xvY2F0aW9uLCAxKTsgXG5cbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBvc2l0aW9uQnVmZmVyKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc3F1YXJlUG9zaXRpb25Mb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc3F1YXJlUG9zaXRpb25Mb2NhdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleGNvb3JkQnVmZmVyKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc3F1YXJlVGV4Y29vcmRMb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc3F1YXJlVGV4Y29vcmRMb2NhdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgICAgICBnbC51bmlmb3JtMWkoc3F1YXJlVGV4dHVyZUxvY2F0aW9uLCAwKTtcblxuICAgICAgICBleHQuZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKGdsLlRSSUFOR0xFUywgMCwgNiwgaW5zdGFuY2VDb3VudCk7XG5cbiAgICB9O1xuXG4gICAgZHJhd0NpcmNsZXMgPSBmdW5jdGlvbihpbnN0YW5jZXMsIHRleHR1cmVzKSB7XG5cbiAgICAgICAgZ2wudXNlUHJvZ3JhbShjaXJjbGVzUHJvZ3JhbSk7XG5cbiAgICAgICAgdmFyIGluc3RhbmNlQ291bnQgPSBpbnN0YW5jZXMubGVuZ3RoIC8gNDtcbiAgICAgICAgaW5zdGFuY2VzID0gbmV3IEZsb2F0MzJBcnJheShpbnN0YW5jZXMpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgaW5zdGFuY2VCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgaW5zdGFuY2VzLCBnbC5EWU5BTUlDX0RSQVcsIDAsIGluc3RhbmNlcy5sZW5ndGgpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShjaXJjbGVJbnN0YW5jZUxvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihjaXJjbGVJbnN0YW5jZUxvY2F0aW9uLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDE2LCAwKTtcbiAgICAgICAgZXh0LnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShjaXJjbGVJbnN0YW5jZUxvY2F0aW9uLCAxKTsgXG5cbiAgICAgICAgdGV4dHVyZXMgPSBuZXcgRmxvYXQzMkFycmF5KHRleHR1cmVzKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleHR1cmVCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGV4dHVyZXMsIGdsLkRZTkFNSUNfRFJBVywgMCwgdGV4dHVyZXMubGVuZ3RoKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoY2lyY2xlVGV4dHVyZXNMb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoY2lyY2xlVGV4dHVyZXNMb2NhdGlvbiwgNCwgZ2wuRkxPQVQsIGZhbHNlLCAxNiwgMCk7XG4gICAgICAgIGV4dC52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUoY2lyY2xlVGV4dHVyZXNMb2NhdGlvbiwgMSk7IFxuXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwb3NpdGlvbkJ1ZmZlcik7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGNpcmNsZVBvc2l0aW9uTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGNpcmNsZVBvc2l0aW9uTG9jYXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0ZXhjb29yZEJ1ZmZlcik7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGNpcmNsZVRleGNvb3JkTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGNpcmNsZVRleGNvb3JkTG9jYXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cblxuICAgICAgICBnbC51bmlmb3JtMWkoY2lyY2xlVGV4dHVyZUxvY2F0aW9uLCAwKTtcblxuICAgICAgICBcbiAgICAgICAgZXh0LmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShnbC5UUklBTkdMRVMsIDAsIDYsIGluc3RhbmNlQ291bnQpO1xuXG4gICAgfTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZHJhd0NpcmNsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkcmF3Q2lyY2xlcy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH0sXG4gICAgZHJhd1NxdWFyZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkcmF3U3F1YXJlcy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH0sXG4gICAgc2V0VXBDYW1lcmE6IGZ1bmN0aW9uKHBvdikge1xuICAgICAgICBzZXRVcENhbWVyYShwb3YpO1xuICAgIH0sXG4gICAgaXNMb2FkZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gaXNMb2FkZWQ7XG4gICAgfSxcbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGdsLnZpZXdwb3J0KDAsIDAsIGNhbnZhc1NwYWNlLndpZHRoLCBjYW52YXNTcGFjZS5oZWlnaHQpO1xuICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9LFxuICAgIG1hdHJpeDogbWF0cml4U3RhY2ssXG4gICAgZ2V0VGV4dHVyZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXh0dXJlO1xuICAgIH0sXG4gICAgY2FudmFzRGltZW5zaW9uczoge1xuICAgICAgICB4OiBjYW52YXNTcGFjZS53aWR0aCxcbiAgICAgICAgeTogY2FudmFzU3BhY2UuaGVpZ2h0XG4gICAgfVxufTtcbiIsInZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIGxldmVsID0ge307XG5sZXZlbC5nYW1lID0gcmVxdWlyZSgnLi9sZXZlbC5qcycpO1xubGV2ZWwudGVzdCA9IHJlcXVpcmUoJy4vdGVzdC1sZXZlbC5qcycpO1xudmFyIEVudGl0aWVzID0gcmVxdWlyZSgnLi9nZXRFbnRpdGllcy5qcycpO1xudmFyIGNpcmNsZXMgPSBbXTtcbnZhciBzcXVhcmVzID0gW107XG52YXIgcG9pbnRzID0gW107XG52YXIgeHMgPSBbXTtcblxudmFyIGdldCA9IHJlcXVpcmUoJy4vZ2V0LmpzJyk7XG5cbnZhciB3b3JsZCA9IFtdO1xudmFyIG5ld0l0ZW1zID0gW107XG52YXIgdW5pdmVyc2FsRGVjb3JhdG9ycyA9IFtdO1xudmFyIGxldmVsTWV0YWRhdGEgPSB7fTtcblxudmFyIGFwaSA9IHtcbiAgICBnZXRPYmpCeU5hbWU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkLnJlZHVjZShmdW5jdGlvbihhY2MsIGl0ZW0pIHsgaWYgKGl0ZW0uZ2V0T2JqTmFtZSgpID09PSBuYW1lKSByZXR1cm4gaXRlbTsgfSwgbnVsbCk7XG4gICAgfSxcbiAgICBzZXRMZXZlbE1ldGFkYXRhOiBmdW5jdGlvbihuZXdEYXRhKSB7XG4gICAgICAgIGZvciAodmFyIHZhbCBpbiBuZXdEYXRhKSB7XG4gICAgICAgICAgICBsZXZlbE1ldGFkYXRhW3ZhbF0gPSBuZXdEYXRhW3ZhbF07XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnRzLmVtaXQoJ3VwZGF0ZUxldmVsTmFtZScpO1xuICAgIH0sXG4gICAgZ2V0TGV2ZWxNZXRhZGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBsZXZlbE1ldGFkYXRhO1xuICAgIH0sXG4gICAgZGVjb3JhdGVBbGxJdGVtczogZnVuY3Rpb24oZGVjb3JhdG9yKSB7XG4gICAgICAgIHdvcmxkLmZvckVhY2goZnVuY3Rpb24oaXRlbSkgeyBkZWNvcmF0b3IoaXRlbSk7IH0pO1xuICAgICAgICB1bml2ZXJzYWxEZWNvcmF0b3JzLnB1c2goZGVjb3JhdG9yKTtcbiAgICB9LFxuICAgIHVubG9hZFdvcmxkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgd29ybGQuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnVubG9hZCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYXBpLnNldExldmVsTWV0YWRhdGEoe1xuICAgICAgICAgICAgaWQ6IG51bGwsXG4gICAgICAgICAgICBuYW1lOiBudWxsXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgbG9hZExldmVsOiBmdW5jdGlvbihsZXZlbElkLCBjYWxsYmFjaykge1xuICAgICAgICBhcGkudW5sb2FkV29ybGQoKTtcbiAgICAgICAgZ2V0KCcuL2xldmVscy8nICsgbGV2ZWxJZCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgYXBpLmxvYWRJdGVtcyhKU09OLnBhcnNlKGRhdGEuZGF0YSkpO1xuICAgICAgICAgICAgYXBpLnN0ZXAoKTtcbiAgICAgICAgICAgIGFwaS5zZXRMZXZlbE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBkYXRhLm5hbWUsXG4gICAgICAgICAgICAgICAgaWQ6IGRhdGEuaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgYXBpLnNvcnRJdGVtcygpO1xuICAgIH0sXG4gICAgbG9hZEl0ZW1zOiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICBcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgICAgICAgICAgaXRlbXMgPSBbaXRlbXNdO1xuICAgICAgICB9XG5cbiAgICAgICAgaXRlbXMgPSBpdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdmFyIGVudGl0eSA9IGl0ZW07XG4gICAgICAgICAgICBpZiAoIWVudGl0eS50eXBlKSBlbnRpdHkgPSBFbnRpdGllc1tpdGVtLmVudGl0eV0oaXRlbSk7XG4gICAgICAgICAgICBlbnRpdHkubG9hZCgpO1xuICAgICAgICAgICAgdW5pdmVyc2FsRGVjb3JhdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGRlY29yYXRvcikge1xuICAgICAgICAgICAgICAgIGRlY29yYXRvcihlbnRpdHkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZW50aXR5O1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3SXRlbXMgPSBuZXdJdGVtcy5jb25jYXQoaXRlbXMpO1xuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMSkgcmV0dXJuIGl0ZW1zO1xuICAgICAgICByZXR1cm4gaXRlbXNbMF07XG4gICAgfSxcbiAgICBnZXRJdGVtczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3b3JsZC5zbGljZSgpO1xuICAgIH0sXG4gICAgZ2V0SXRlbUJ5SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiB3b3JsZC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0uaWQgPT09IGlkKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSlbMF07XG4gICAgfSxcbiAgICBnZXRJdGVtc0J5VHlwZTogZnVuY3Rpb24odHlwZSkge1xuICAgICAgICByZXR1cm4gd29ybGQuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChpdGVtLnR5cGUgPT09IHR5cGUpIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZUl0ZW06IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHdvcmxkID0gd29ybGQuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKGl0ZW0uaWQgIT09IGlkKSByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgICAgIGV2ZW50cy5lbWl0KCdlbnRpdHlDb3VudCcpO1xuICAgIH0sXG4gICAgZ2V0WHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4geHM7XG4gICAgfSxcbiAgICB1cGRhdGVOZXdJdGVtczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdvcmxkID0gd29ybGQuY29uY2F0KG5ld0l0ZW1zKTtcbiAgICAgICAgYXBpLnNvcnRJdGVtcygpO1xuICAgICAgICBpZiAobmV3SXRlbXMubGVuZ3RoKSBldmVudHMuZW1pdCgnZW50aXR5Q291bnQnKTtcbiAgICAgICAgbmV3SXRlbXMgPSBbXTtcbiAgICB9LFxuICAgIHN0ZXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcGkudXBkYXRlTmV3SXRlbXMoKTtcbiAgICAgICAgeHMgPSBbXTtcbiAgICAgICAgeXMgPSBbXTtcbiAgICAgICAgbmV3SXRlbXMgPSBbXTtcbiAgICAgICAgY2lyY2xlcyA9IFtdO1xuICAgICAgICBzcXVhcmVzID0gW107XG4gICAgICAgIHBvaW50cyA9IFtdO1xuICAgICAgICB3b3JsZC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsgXG4gICAgICAgICAgICBpZiAoaXRlbS5nZW9tZXRyeSA9PT0gJ2NpcmNsZScgJiYgaXRlbS52aXNpYmxlKSBjaXJjbGVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICBpZiAoaXRlbS5nZW9tZXRyeSA9PT0gJ3NxdWFyZScgJiYgaXRlbS52aXNpYmxlKSBzcXVhcmVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICBpZiAoaXRlbS5nZW9tZXRyeSA9PT0gJ3BvaW50JyAmJiBpdGVtLnZpc2libGUpIHBvaW50cy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgaXRlbS5jb2xsaXNpb25EYXRhID0ge307XG4gICAgICAgICAgICBpdGVtLnN0ZXAuY2FsbChpdGVtKTsgXG4gICAgICAgICAgICBpZiAoaXRlbS5nZW9tZXRyeSAmJiBpdGVtLnNvbGlkICYmICFpdGVtLmluQ29udGFpbmVyKCkpIHhzID0geHMuY29uY2F0KGl0ZW0uQUFCQi54cyk7XG4gICAgICAgIH0pO1xuICAgICAgICBhcGkuc29ydEl0ZW1zKCk7XG4gICAgICAgIHhzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIChhLnZhbCAtIGIudmFsKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzb3J0SXRlbXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3b3JsZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLm9uVG9wO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldEdlb21ldHJ5OiBmdW5jdGlvbihnZW9tZXRyeSkge1xuICAgICAgICBpZiAoZ2VvbWV0cnkgPT09ICdjaXJjbGUnKSByZXR1cm4gY2lyY2xlcztcbiAgICAgICAgaWYgKGdlb21ldHJ5ID09PSAnc3F1YXJlJykgcmV0dXJuIHNxdWFyZXM7XG4gICAgICAgIGlmIChnZW9tZXRyeSA9PT0gJ3BvaW50JykgcmV0dXJuIHBvaW50cztcbiAgICB9LFxuICAgIGdldEFsbEl0ZW1zU29ydGVkQnlHZW9tZXRyeTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbc3F1YXJlcywgY2lyY2xlcywgcG9pbnRzXTtcbiAgICB9LFxuICAgIGdldEVudGl0eVR5cGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVudGl0aWVzID0gW107XG4gICAgICAgIGZvciAodmFyIGVudGl0eSBpbiBFbnRpdGllcykge1xuICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZW50aXRpZXM7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
