var User = require('./user');
var Cart = require('./shoppingcart');
var Product = require('./product');
var Order = require('./order');
var bcryptjs = require('bcryptjs');

Model = {}

Model.getProducts = function () {
    return Product.find();
}

Model.signup = function (name, surname, address, birth, email, password) {
    return User.findOne({ email: email })
        .then(function (user) {
            if (!user) {
                var cart = new Cart({
                    items: [],
                    qty: 0,
                    total: 0,
                    subtotal: 0,
                    tax: 0
                });
                var user = new User({
                    email: email,
                    password: bcryptjs.hashSync(password, bcryptjs.genSaltSync(10)),
                    name: name,
                    surname: surname,
                    birthDate: birth,
                    address: address,
                    shoppingCart: cart
                });
                return cart.save().then(() => { return user.save(); })
            } else {
                return null;
            }
        });
}

Model.purchase = function (userid, date, address, cardOwner, cardNumber) {
    return Model.getUserByIdWithCartAndOrder(userid)
        .then((user) => {
            var order = null;
            if (user && user.shoppingCart.qty > 0) {
                var order = new Order({
                    number: new Date().getTime(),
                    date: date,
                    address: address,
                    cardOwner: cardOwner,
                    cardNumber: cardNumber,
                    subtotal: user.shoppingCart.subtotal,
                    total: user.shoppingCart.total,
                    tax: user.shoppingCart.tax,
                    items: user.shoppingCart.items
                });
                user.orders.push(order);
                user.shoppingCart.items = [];
                return order.save()
                    .then(function () {
                        return user.save()
                    })
                    .then(function () {
                        Model.updateShoppingCart(user);
                    })
                    .then(function () {
                        return order;
                    });
            }
            return null;
        });
}

Model.getUserByIdWithOrders = function (userid) {
    return User.findById(userid).populate({ path: "orders" });
}

Model.getUserByIdWithCart = function (userid) {
    return User.findById(userid).populate({ path: "shoppingCart" });
}

Model.getUserByIdWithCartAndOrder = function (userid) {
    return User.findById(userid).populate({ path: "orders shoppingCart" });
}

Model.getOrders = function (userid) {
    return User.getUserByIdWithOrders(userid)
        .then((user) => {
            if (user) {
                return user.orders;
            }
            return null;
        })
        .catch(function (errors) { 
            console.error(errors); 
            return null; 
        });
}

Model.getOrder = function (number, userid) {
    return Model.getUserByIdWithOrders(userid)
        .then((user) => {
            if (user) {
                for (order of user.orders) {
                    if (number == order.number) {
                        return order;
                    }
                }
            }
            return null;
        });
}

Model.getUserById = function (userid) {
    return User.findById(userid);
}

Model.getUserCartQty = function (userid) {
    return User.findById(userid)
        .populate({ path: "shoppingCart", select: 'qty' })
}

Model.getProductById = function (pid) {
    return Product.findById(pid);
}

Model.buy = function (uid, pid) {
    return Promise.all([Model.getProductById(pid), Model.getUserByIdWithCart(uid)])
        .then(function (results) {
            var product = results[0];
            var user = results[1];
            if (user && product) {
                var item;
                for (var i = 0; i < user.shoppingCart.items.length; i++) {
                    if (user.shoppingCart.items[i].product == pid) {
                        item = user.shoppingCart.items[i];
                        user.shoppingCart.items.remove(item);
                    }
                } if (!item) {
                    item = { qty: 0 };
                }
                item.qty++;
                item.product = product._id;
                item.title = product.title;
                item.price = product.price;
                item.total = item.qty * item.price;
                user.shoppingCart.items.push(item);
                return Model.updateShoppingCart(user)
                    .then(function () {
                        return user.shoppingCart;
                    });
            } else {
                return null;
            };
        }).catch(function (errors) { 
            console.error(errors); 
            return null; });
}

Model.updateShoppingCart = function (user) {
    user.shoppingCart.qty = 0;
    user.shoppingCart.subtotal = 0;
    for (var i = 0; i < user.shoppingCart.items.length; i++) {
        user.shoppingCart.qty = user.shoppingCart.qty + user.shoppingCart.items[i].qty;
        user.shoppingCart.subtotal = user.shoppingCart.subtotal + user.shoppingCart.items[i].total;
    }
    user.shoppingCart.tax = user.shoppingCart.subtotal * 0.21;
    user.shoppingCart.total = user.shoppingCart.subtotal + user.shoppingCart.tax;
    return user.shoppingCart.save()

}

Model.getCartByUserId = function (uid) {
    return Model.getUserByIdWithCart(uid)
        .then(function (user) {
            if (user) {
                return user.shoppingCart;
            } else {
                return null;
            }
        })
}

Model.removeOne = function (uid, pid) {
    return Promise.all([Model.getUserByIdWithCart(uid), Model.getProductById(pid)])
        .then(function (results) {
            var user = results[0];
            var product = results[1];
            if (!product || !user) return null;
            for (var i = 0; i < user.shoppingCart.items.length; i++) {
                if (user.shoppingCart.items[i].product == pid) {
                    var item = user.shoppingCart.items[i];
                    item.qty = item.qty - 1;
                    if (user.shoppingCart.items[i].qty < 1)
                        user.shoppingCart.items.splice(i, 1);
                    else {
                        item.price = product.price;
                        item.total = item.qty * item.price;
                    }
                }
            }
            return Model.updateShoppingCart(user);
        });

}

Model.removeAll = function (uid, pid) {
    return Promise.all([Model.getUserByIdWithCart(uid), Model.getProductById(pid)])
        .then(function (results) {
            var user = results[0];
            var product = results[1];
            if (!product || !user) return null;
            for (var i = 0; i < user.shoppingCart.items.length; i++) {
                if (user.shoppingCart.items[i].product == pid) {
                    user.shoppingCart.items.splice(i, 1);
                }
            }
            return Model.updateShoppingCart(user);
        });
}

Model.get = function (userid) {
    return User.find(userid).populte({ path: "ShoppingCart" });
}
module.exports = Model;