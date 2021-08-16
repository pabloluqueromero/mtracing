var express = require('express');
var logger = require('morgan');
var path = require('path');
var favicon = require('serve-favicon');
var model = require("./model/model.js");
var app = express();
var cookieParser = require("cookie-parser");
var mongoose = require("mongoose");
var uri = 'mongodb://localhost/mtracing';
const passport = require('passport');
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const secretKey = 'your_jwt_secret';
const bcryptjs = require('bcryptjs');
const User = require('./model/user');
const jwt = require('jsonwebtoken');


mongoose.Promise = global.Promise;

var db = mongoose.connection;
db.on('connecting', function () { console.log('Connecting to ', uri); });
db.on('connected', function () { console.log('Connected to ', uri); });
db.on('disconnecting', function () { console.log('Disconnecting from ', uri); });
db.on('disconnected', function () { console.log('Disconnected from ', uri); });
db.on('error', function (err) { console.error('Error ', err.message); });

//Setting localstrategy
passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
    function (email, password, cb) {
        return User.findOne({ email }).select('email password name surname')
            .then(function (user) {
                if (!user) {
                    return cb({ message: 'Email not found' }, false);
                }
                if (!bcryptjs.compareSync(password, user.password)) {
                    return cb({ message: 'Incorrect password' }, false);
                }
                // null for the error cb should have shape name(error,user)
                return cb(null, user);
            })
            .catch(function (err) { console.error('ERR STGY', err); cb(err) });
    }
));

//Containes encrypted version of the user id
passport.use(new JWTStrategy({ jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), secretOrKey: secretKey },
    function (jwtPayload, cb) {
        return cb(null, { _id: jwtPayload.id });
    }
));

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//JSON parsing & cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Setting logger
app.use(logger('dev'));

//Public folder
app.use(express.static(path.join(__dirname, 'public')));

//Setting favicon
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

//HTTP GET /api/products
app.get('/api/products/', function (req, res) {
    return model.getProducts()
        .then((products) => {
            res.json(products);
        });
});
//HTTP POST /api/users/signin
app.post('/api/users/signin', function (req, res, next) {
    return passport.authenticate('local', { session: false },
        function (err, user, info) {
            if (err || !user) { console.error(err, user); return res.status(401).json(err); }
            return req.logIn(user, { session: false }, function (err) {
                if (err) { res.status(401).send(err); }
                useridFromToken(req, res);
                return res.json(user);
            });
        })(req, res);
});

function useridFromToken(req, res) {
    if (req.user) {
        //Stores token in a cookie, uses jwt.signin for encryption id retrieved from the token
        res.cookie('token', jwt.sign({ id: req.user._id }, secretKey, { expiresIn: 60 }));
        return req.user._id;
    } else {
        // res.cookie.removeOne('token'); -> Not a function
        res.clearCookie('token');
        return null;
    }
}
//HTTP POST /api/users/signup
app.post('/api/users/signup', function (req, res, next) {
    model.signup(req.body.name, req.body.surname, req.body.address, req.body.birth, req.body.email, req.body.password)
        .then((user) => {
            if (user) {
                return res.json(user);
            }
            else {
                return res.status(401).send({ message: "The email already exists" });
            }
        })
});


/*
* Because of the custom messages that I had defined for previous deliverables, if the passport authentication mechanism denies 
* access because either no user is signed in or the token has expired we need the javascript throws an error because the message element
* does not exists. Two possible solutions are: 
*           -Adopt the same approach as with the sign in and use the callback to handle the error. However this implies that we need to 
*               also adapt the useridFromToken.
*           - Use the parameter failWithError that automatically passes the request to a handler that takes 4 parameters (error,request,response,next).
*             This approach requires less changes and so this is the one I will implement from now on.
*
*/
//HTTP GET /api/profile
app.get('/api/users/profile',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res) {
        var userid = useridFromToken(req, res);
        model.getUserByIdWithCartAndOrder(userid)
            .then(function (user) {
                if (user) {
                    return res.json(user);
                } else {
                    return res.status(500).send({
                        message: 'No user found'
                    });
                }
            });
    });
//HTTP GET /api/cart
app.get('/api/cart',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res, next) {
        var uid = useridFromToken(req, res);
        model.getCartByUserId(uid)
            .then(function (cart) {
                if (cart) { return res.json(cart); }
                else {
                    return res.status(401).send({ message: 'User shopping cart not found' });
                }
            });
    });
//HTTP GET /api/cart/qty
app.get('/api/cart/qty',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res) {
        var userid = useridFromToken(req, res);
        if (!userid) {
            return res.status(401).send({
                message: 'User is not signed in'
            });
        }
        return model.getUserCartQty(userid)
            .then((userCartQty) => {
                if (userCartQty) {
                    return res.json(userCartQty);
                } else {
                    return res.status(500).send({
                        message: 'Cannot retrieve user cart quantity'
                    });
                }
            })
            .catch(function (error) {
                return res.status(500).send({ message: 'Cannot retrieve user cart quantity' })
            });
    });
//HTTP POST /api/cart/items/product/:pid
app.post('/api/cart/items/product/:pid',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res, next) {
        var pid = req.params.pid;
        var uid = useridFromToken(req, res);
        model.buy(uid, pid).then((cart) => {
            if (cart) {
                return res.json(cart);
            }
            else {
                return res.status(401).send(
                    { message: 'User or Product not found' })
            };
        });
    });
//HTTP DELETE /api/cart/items/product/:id/one
app.delete('/api/cart/items/product/:id/one',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res, next) {
        var pid = req.params.id;
        var uid = useridFromToken(req, res);
        model.removeOne(uid, pid)
            .then(function (cart) {
                if (cart) {
                    return res.json(cart);
                }
                else {
                    return res.status(500).send(
                        { message: 'User or Product not found' });
                }
            });
    });
//HTTP DELETE /api/cart/items/product/:id/all
app.delete('/api/cart/items/product/:id/all',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res, next) {
        var pid = req.params.id;
        var uid = useridFromToken(req, res);
        model.removeAll(uid, pid)
            .then(function (cart) {
                if (cart) {
                    return res.json(cart);
                }
                else {
                    return res.status(500).send(
                        { message: 'User or Product not found' }
                    );
                }
            });
    });
//As I am using the handler for profile to send the orders I do not need 
//to use the following handler to get the orders
//HTTP GET /api/orders
app.get('/api/orders',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res, next) {
        var userid = useridFromToken(req, res);
        if (!userid) {
            return res.status(401).send({
                message: 'User is not signed in'
            });
        }
        model.getOrders(userid)
            .then(function (orders) {
                if (orders) {
                    return res.json(orders);
                } else {
                    return res.status(500).send({
                        message: 'Cannot retrieve orders'
                    });
                }
            });
    });
//HTTP POST /api/orders
app.post('/api/orders',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res, next) {
        var userid = useridFromToken(req, res);
        model.purchase(userid, req.body.date, req.body.address, req.body.cardOwner, req.body.cardNumber)
            .then(function (order) {
                if (order) {
                    return res.json(order);
                }
                else {
                    return res.status(500).send({ message: "Cannot purchase the products" });
                }
            });
    });
//HTTP GET /api/orders/id/:oid, We need to add ? in case they send it empty
app.get('/api/orders/id/:oid?',
    passport.authenticate('jwt', { session: false, failWithError: true }),
    function (err, req, res, next) {
        return res.status(401).send({
            message: 'User is not signed in'
        });
    },
    function (req, res, next) {
        var userid = useridFromToken(req, res);
        var orderid = req.params.oid;
        if (!userid) {
            return res.status(401).send({
                message: 'User is not signed in'
            });
        }
        model.getOrder(orderid, userid)
            .then(function (order) {
                if (order) {
                    return res.json(order);
                } else {
                    return res.status(500).send({
                        message: 'There are no orders with that id'
                    });
                }
            });
    });


app.get(/\/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});


app.listen(3000, () => { console.log("Listening to port 3000") });