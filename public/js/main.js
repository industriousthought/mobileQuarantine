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






