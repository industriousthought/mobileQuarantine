

module.exports = function(obj) {
    var startOptions = {};
    obj.startOptions = function(options) {
        if (!options) return startOptions;
        for (var option in options) {
            startOptions[option] = options[option];
        }
    };
};
