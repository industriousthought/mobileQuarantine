const mongoose = require('mongoose').set('debug', true);
const Level = require('../models/Level');
const uuid = require('uuid/v1');


exports.getAllLevels = (req, res, next) => {
    var output = [];
    var events = 2;
    const done = () => {
        events--;
        console.log('events... ' + events);
        if (!events) res.send(JSON.stringify(output));
    };
    if (req.user) {
        Level.find({owner: req.user.id}, (err, levels) => {
            //assert.equal(null, err);
            if (err) return console.log(JSON.stringify(err));
            output = output.concat(levels);
            done();
        });
    } else {
        done();
    }
    Level.find({snapshot: true}, (err, levels) => {
        //assert.equal(null, err);
        if (err) return console.log(JSON.stringify(err));
        output = output.concat(levels);
        done();
    });
};

exports.saveLevel = (req, res, next) => {
    if (req.user) {
        var id = uuid();
        console.log(req.body.id);
        const level = new Level({
            owner: req.user.id,
            id: id,
            name: req.body.name,
            entities: req.body.data
        });
        if (req.body.id === 'undefined' || req.body.id === 'null') {
            console.log('newlevel!!!!!' + JSON.stringify(req.body));
            level.$__save({}, (err) => {
                if (err) {
                    console.log(JSON.stringify(err));
                    return next(err);
                } else {
                    console.log('new level saved!');
                    res.send({
                        levelName: level.name,
                        id: id,
                        msg: 'Saved new level'
                    });
                }
            });
        } else {
            console.log('existinglevel!');
            Level.update({ id: req.body.id, owner: req.user.id }, {
                owner: req.user.id,
                id: id,
                name: req.body.name,
                entities: req.body.data
            }, {}, (err, level) => {
                if (err) { return next(err); }
                if (level) {
                    console.log('saved!');
                    res.send({
                        levelName: level.name,
                        id: id,
                        msg: 'Updated existing level'
                    });
                }
            });
        }
    } else {
        res.send({response: 'no_user'});
    }
};

exports.getLevel = (req, res, next) => {
  Level.findOne({ id: req.params.levelId }, (err, level) => {
    if (err) { return next(err); }
    if (level.snapshot || (req.user && req.user.id === level.owner)) {
      return res.send(JSON.stringify({
          data: level.entities,
          id: level.id,
          name: level.name
      }));
    }

  });
};

exports.postPublishLevel = (req, res, next) => {

    console.log('publishing...')
  Level.findOne({ owner: req.user.id, id: req.body.levelId }, (err, level) => {
        var id = uuid();
        if (err) return console.log(JSON.stringify(err));
        const newLevel = new Level({
            owner: req.user.id,
            id: id,
            name: level.name,
            snapshot: true,
            entities: level.entities
        });
        newLevel.$__save({}, (err) => {
            if (err) {
                console.log(JSON.stringify(err));
                return next(err);
            } else {
                console.log('level cloned');
                console.log(JSON.stringify(newLevel));
                console.log(JSON.stringify(level));
                res.send(JSON.stringify({
                    name: level.name,
                    id: id
                }));
            }
        });
  });
};

exports.postDeleteLevel = (req, res, next) => {
    console.log(JSON.stringify(req.body));
    Level.findOne({ owner: req.user.id, id: req.body.levelId }).remove((err, value) => {
        if (err) return console.log(JSON.stringify(err));
        console.log(JSON.stringify(value));
        res.send(JSON.stringify(value));
  });
};
