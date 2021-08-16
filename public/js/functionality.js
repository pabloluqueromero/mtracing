/*Navigation*/
function navigateTo(url, event) {
    event.preventDefault();
    history.pushState(null, '', url);
    route()
}

function route() {
    var path = location.pathname;
    var matching = null;
    console.log('Routing ', path);

    var context = {}
    context.messages = {
        success: Messages.success,
        danger: Messages.danger
    };
    Messages.clear();
    var p = Model.getUserCartQty()
        .done(function (userCartQty) { context.user = userCartQty;})
        .fail(function (error) { console.error(error.responseJSON.message)});

    if (path.match(/^\/index$/) || path.match(/^\/$/)) {
        return Model.getProducts()
            .done(function (result) { context.products = result; })
            .fail(function (error) {
                if (!context.products) {
                    context.messages.danger.push("Error while retrieving the products");
                }
            })
            .always(function () {
                return p.always(function () {
                    return render('/templates/index.hbs', '#contents', context);
                });
            });
    }
    else if (matching = path.match(/^\/cart$/)) {
        return p.always(function () {
            return Model.getCart()
                .done(function (result) {
                    if (context.user) {
                        context.user.shoppingCart = result;
                        return render('/templates/cart.hbs', '#contents', context);
                    };
                })
                .fail(function (error) {
                    context.messages.danger.push(error.responseJSON.message)
                    render('/templates/not-found.hbs', '#contents', context);
                })
        });
    }
    else if (matching = path.match(/^\/signup$/)) {
        return render('/templates/signup.hbs', '#contents', context);
    }
    else if (matching = path.match(/^\/signin$/)) {
        return render('/templates/signin.hbs', '#contents', context);
    }
    else if (matching = path.match(/^\/order\/id\/(\d*)$/)) {
        return p.always(function () {
            return Model.getOrder(matching[1])
                .done((order) => {
                    context.order = order;
                    render('/templates/order.hbs', '#contents', context)

                })
                .fail((error) => {
                    context.messages.danger.push(error.responseJSON.message);
                    render('/templates/not-found.hbs', '#contents', context);
                });

        });

    }
    else if (matching = path.match(/^\/purchase$/)) {
        return p.always(function () {
            return Model.getCart()
                .done(function (result) {
                    if (context.user) {
                        context.user.shoppingCart = result;
                        return render('/templates/purchase.hbs', '#contents', context);
                    } else {
                        context.messages.danger.push("There was an error while trying to retrieve the cart")
                        return render('/templates/not-found.hbs', '#contents', context)
                    }
                })
                .fail(function (error) {
                    context.messages.danger.push("There was an error while trying to retrieve the cart")
                    return render('/templates/not-found.hbs', '#contents', context);
                })
        });
    }
    else if (matching = path.match(/^\/profile$/)) {
        return p.always(() => {
            Model.getProfile().
                done(function (user) {
                    context.user = user;
                    render('/templates/profile.hbs', '#contents', context);
                })
                .fail(function (error) {
                    context.messages.danger.push(error.responseJSON.message);
                    render('/templates/not-found.hbs', '#contents', context);
                })
        });

    }
    else {
        render('/templates/not-found.hbs', '#contents', context);
        console.error(path + ' path not found!');
    }
}

/*******************Signout****************************/
function signout(event) {
    event.preventDefault();
    Model.signout();
    Messages.success.push("User signed out")
    navigateTo('/index', event);
}

/********************LoadContent***********************/
function render(url, container, context) {
    return $.ajax({
        url: url,
        method: 'GET'
    })
        .done(function (source) {
            var template = Handlebars.compile(source);
            var html = template(context);
            $(container).html(html);
        })
        .fail(function (error) {
            console.error('GET ', url, error)
        })
}

function loadPartial(partial, url) {
    var url = url;
    return $.ajax({
        url: url,
        method: 'GET'
    })
        .done(function (source) {
            Handlebars.registerPartial(partial, source);
        })
        .fail(function (error) {
            console.error('GET ', url, error)
        })
}

$(function () {
    $.when(
        loadPartial('navbar', '/partials/navbar.hbs'),
        loadPartial('footer', '/partials/footer.hbs'),
        loadPartial('header', '/partials/header.hbs'),
        loadPartial('messages', '/partials/messages.hbs'))
        .done(() => { route(); })
        .fail(() => console.error("Error while loading NavBar in loadPartial"));
    window.addEventListener('popstate', (event) => route(), false);

})


/********************Helpers***********************/
Handlebars.registerHelper('formatPrice', function (price) {
    return '€ ' + (Math.round(price * 100) / 100).toFixed(2);
});

Handlebars.registerHelper('formatDate', function (date) {
    if (date) {
        d = new Date(date)
        month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = '' + d.getFullYear();
        return month + "-" + day + "-" + year;
    } else {
        return ''
    }
});
