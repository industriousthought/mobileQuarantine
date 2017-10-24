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
