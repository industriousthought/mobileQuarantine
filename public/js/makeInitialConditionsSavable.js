
module.exports = function(obj) {
    obj.getInitialConditions = function() {
        var initialConditions = {
            entity: obj.type,
            pos: {
                x: obj.pos.x,
                y: obj.pos.y,
                rot: obj.pos.rot
            },
        };
        if (obj.geometry && obj.geometry === 'circle') {
            initialConditions.radius = obj.radius;
        }
        if (obj.geometry && obj.geometry === 'square') {
            initialConditions.width = obj.width;
            initialConditions.height = obj.height;
        }
        if (obj.type === 'door') {
            initialConditions.openPos = obj.openPos;
            initialConditions.closePos = obj.closePos;
            initialConditions.opened = obj.opened;
        }
        var startOptions;
        if (obj.startOptions) {
            startOptions = obj.startOptions();
            for (var option in startOptions) {
                initialConditions[option] = startOptions[option];
            }
        }
        return initialConditions;
    };
};
