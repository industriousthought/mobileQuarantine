const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const connection = mongoose.createConnection('mongodb://localhost:27017/quarantine');

const levelSchema = new mongoose.Schema({
  id: {type: String, unique: true },
  snapshot: false,
  name: String,
  owner: String,
  entities: String
}, { timestamps: true });

/**
 * Password hash middleware.
 */
levelSchema.pre('save', function save(next) {
    /*
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
  */
});


const Level = mongoose.model('Level', levelSchema);

module.exports = Level;
