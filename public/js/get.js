
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

