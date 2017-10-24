var getId = require('./getId.js').getId;
var events = require('./events.js');

var state;

var api = {
    getState: function() {
        return state;
    }
};

module.exports = api;

events.register('newGame', function() {
    state = 'newGame';
}, getId());
events.register('start', function() {
    state = 'start';
}, getId());
events.register('pause', function() {
    state = 'pause';
}, getId());
events.register('gameOver', function() {
    state = 'gameOver';
}, getId());

