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
