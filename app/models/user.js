var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var util = require('../../lib/utility');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,

  defaults: {
    salt: null
  },

  

  initialize: function() {
    this.on('creating', util.hash);
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
