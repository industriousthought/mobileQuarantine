var lastId = 0;

var api = {
    getId: function() {
        return 'a' + lastId++;
    }
};

module.exports = api;
