const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorite = require('../models/favorite');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
    .get(cors.cors, (req, res, next) => {
        Favorite.find({})
            .populate('dishes')
            .populate('user')
            .then((favorites) => {
                res.status(200).json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .post(authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then((favorite) => {
                if (favorite != null) {
                    for (let i = 0; i < req.body.length; i++) {
                        if (favorite.dishes.includes(req.body[i]._id)) {
                            console.log("Already exists ", req.body[i]._id);
                        }
                        else {
                            favorite.dishes.push(req.body[i]);
                        }
                    }
                    favorite.save()
                        .then((favorite) => {
                            res.status(200).json(favorite);
                        }, (err) => next(err));
                } else {
                    Favorite.create({ user: req.user._id })
                        .then((favorite) => {
                            for (let i = 0; i < req.body.length; i++) {
                                if (favorite.dishes.includes(req.body[i]._id)) {
                                    console.log("Already exists ", req.body[i]._id);
                                }
                                else {
                                    favorite.dishes.push(req.body[i]);
                                }
                            }
                            favorite.save()
                                .then((favorite) => {
                                    Favorite.findById(favorite._id)
                                        .then((favorite) => {
                                            console.log('Favorites of User Created', favorite);
                                            res.status(200).json(favorite);
                                        })
                                })
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('Put operation not supported on /favorites');
    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        //Using deleteMany because remove is deprecated
        Favorite.findOneAndRemove({ user: req.user._id })
            .then((resp) => {
                res.status(200).json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

//DishId part

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/' + req.params.dishId);
    })

    .post(authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then((favorite) => {
                if (favorite != null) {

                    if (favorite.dishes.includes(req.params.dishId)) {
                        console.log("Already exists");
                    }
                    else {
                        favorite.dishes.push(req.params.dishId);
                    }

                    favorite.save()
                        .then((favorite) => {
                            res.status(200).json(favorite);
                        }, (err) => next(err));
                } else {
                    Favorite.create({ user: req.user._id })
                        .then((favorite) => {
                            favorite.dishes.push(req.params.dishId);
                            favorite.save()
                                .then((favorite) => {
                                    Favorite.findById(favorite._id)
                                        .then((favorite) => {
                                            console.log('Favorites of User Created', favorite);
                                            res.status(200).json(favorite);
                                        })
                                })
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('Put operation not supported on /favorites/' + req.params.dishId);
    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

        Favorite.findOne({ user: req.user._id })
            .then((favorite) => {
                if (favorite.dishes.includes(req.params.dishId)) {
                    console.log("Sí lo encuentra ");
                    favorite.dishes = favorite.dishes.filter(function (value, index, arr) { return value != req.params.dishId; })
                    favorite.save()
                        .then((favorite) => {
                            Favorite.findById(favorite._id)
                                .then((favorite) => {
                                    res.status(200).json(favorite);
                                })
                        });
                }
                else {
                    res.status(200).json({ message: 'There is no dish identified with: ' + req.params.dishId });
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });



module.exports = favoriteRouter;