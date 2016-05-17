var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({secret: 'This is a secret', maxAge: 10000}));

//Global... for now
var sess;
app.get('/', 
function(req, res) {
  if (req.session.isLoggedIn) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/create', 
function(req, res) {
  if (req.session.isLoggedIn) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/links', 
function(req, res) {
  if (req.session.isLoggedIn) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  console.log(req.session);
    //are they a user?  
  db.knex('users')
    .where({username: username})
    .then(function(result) {
      //yes --> validate credentials
      if (result.length) {
        console.log(result);
        if (util.hash(result[0], password) || req.session.isLoggedIn) {
          console.log('username and password is authenticated. results =========>', result);
          req.session.isLoggedIn = true;
          res.redirect('/');
        } else {
          res.redirect('/login');
          console.log('Nope, wrong credentials. Please try again!');  
        }
      } else {
        console.log('This should run if non-existent user');
        res.redirect('/signup');
      }
    });
});

app.post('/signup', function(req, res) {
  console.log('Request Body ==========>', req.body);

  db.knex('users')
    .where({username: req.body.username})
    .then(function(user) {
      if (user.length === 0) {
        new User({ username: req.body.username, password: req.body.password}).fetch().then(function(found) {
          if (found) {
            console.log('Existing user!! =============>', found);
            res.redirect('/');
            // res.status(200).send(found.attributes);
          } else {
            Users.create({
              username: req.body.username,
              password: req.body.password
            })
            .then(function(newUser) {
              console.log('Redirecting after creating a brand new user!! ==========>');
              req.session.isLoggedIn = true;
              res.redirect('/');
              // res.status(200).send(newUser);
            });
          }
        });
      } else {
        res.redirect('/login');
      }
    });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      console.log('THIS IS CATCHALL REDIRECT ROUTE TO / ========');
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
