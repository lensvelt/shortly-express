var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,

  defaults: {
    salt: null
  },

  hash: function (model, passwordAttempt) {
    var username = model.attributes.username;
    var password = model.attributes.password;
    console.log(model.attributes);

    //Handles hashing for Sign Up
    console.log('signup', password, !model.attributes.salt);
    if (!model.attributes.salt) {
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);
      model.set('password', hash);
      model.set('salt', salt);
      return true;
    }
    //Handles Hashing for Login
    var salt = model.attributes.salt;
    var hash = bcrypt.hashSync(passwordAttempt, salt);
    return password === hash;
  },

  initialize: function() {
    this.on('creating', this.hash);
  }
});

module.exports = User;

// var bcrypt = require(bcrypt);
// ...
// app.post('/login', function(request, response) {
 
//     var username = request.body.username;
//     var password = request.body.password;
//     var salt = bcrypt.genSaltSync(10);
//     var hash = bcrypt.hashSync(password, salt);
//     var userObj = db.users.findOne({ username: username, password: hash });
     
//     if(userObj){
//         request.session.regenerate(function(){
//             request.session.user = userObj.username;
//             response.redirect('/restricted');
//         });
//     }
//     else {
//         res.redirect('login');
//     }
 
// });
