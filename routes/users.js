const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/users');
const passport = require('passport');
const router = express.Router();
const authenticate = require('../authenticate');
const cors = require('./cors');

router.use(bodyParser.json());

/* GET users listing. */
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({})
    .then((users) => {
      res.status(200).json(users);
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.post('/signup', cors.corsWithOptions, (req, res, next) => {
  User.register(new User({ username: req.body.username }),
    req.body.password, (err, user) => {
      if (err) {
        res.status(500).json({ err: err });
      }
      else {
        if (req.body.firstname) {
          user.firstname = req.body.firstname;
        }
        if (req.body.lastname) {
          user.lastname = req.body.lastname;
        }
        user.save((err, user) => {
          if (err) {
            res.status(500).json({ err: err });
            return;
          }
          passport.authenticate('local')(req, res, () => {
            res.status(200).json({ success: true, status: 'Registration Succesful!', user: user })
          });
        });
      }
    });
});

router.post('/login', cors.corsWithOptions, passport.authenticate('local'), (req, res, next) => {
  const token = authenticate.getToken({ _id: req.user._id });
  res.status(200).json({ success: true, token: token, status: 'You are successfully logged in!' });
});

router.get('/logout', cors.corsWithOptions, (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    const err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
    const token = authenticate.getToken({ _id: req.user._id });
    res.status(200).json({ success: true, token: token, status: 'You are successfully logged in!' });
  }
});

module.exports = router;
