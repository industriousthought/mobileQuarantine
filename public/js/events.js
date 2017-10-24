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
