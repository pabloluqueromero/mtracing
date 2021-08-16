var mongoose = require('mongoose');
var User = require('./user');
var Cart = require('./shoppingcart');
var Product = require('./product');
var Order = require('./order');
var uri = 'mongodb://localhost/mtracing';
var bcryptjs = require('bcryptjs');

var cart = new Cart({
    items: [],
    qty: 0,
    total: 0,
    subtotal: 0,
    tax: 0
});

var user = new User({
    email: 'pablo@gmail.com',
    password: 'admin',
    name: 'Pablo',
    surname: 'Luque',
    birthDate: "1997-06-19T00:00:00.000Z",
    address: 'ESII, UCLM',
    shoppingCart: cart
});
user.password = bcryptjs.hashSync('admin', bcryptjs.genSaltSync(10));


var products = [
    new Product({
        title: 'Benelli BN 125',
        image: 'benelli-bn-125.jpg',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla in eros odio. Morbi porta suscipit lectus sagittis ultrices. Praesent at dignissim erat. Etiam lacinia dolor ac velit volutpat hendrerit. Cras consequat vestibulum turpis eu lacinia. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam id purus pharetra, feugiat odio in, efficitur nisi. Quisque blandit erat non urna pulvinar, ac faucibus augue congue. Aliquam erat volutpat. Donec ornare ultrices risus non posuere. Nullam ac finibus dolor. Sed fermentum accumsan lobortis. Maecenas sed dui in dui scelerisque ultrices ut id diam. Suspendisse lobortis pellentesque tortor et varius.',
        price: 2499,
        colours: ['red', 'black', 'white']
    }), new Product({
        title: 'Yamaha MT 125',
        image: 'yt125.jpg',
        description: ` Quisque vehicula, sem sit amet semper ullamcorper, velit odio ullamcorper risus, eu scelerisque risus
    nisi a arcu. Nullam accumsan ullamcorper massa, sed laoreet magna condimentum non. Fusce viverra diam
    ut eros euismod tincidunt. Donec convallis diam at libero ultrices, id interdum lectus viverra. Sed
    mollis arcu nec quam bibendum dictum. Ut vel nulla mattis, venenatis arcu a, blandit purus.
    `,
        price: 5495,
        colours: ['black', 'white']
    }), new Product({
        title: 'KTM Duke',
        image: 'ktmduke.jpg',
        description: ` Quisque vehicula, sem sit amet semper ullamcorper, velit odio ullamcorper risus, eu scelerisque
    risus  nisi a arcu. Nullam accumsan ullamcorper massa, sed laoreet magna condimentum non. Fusce viverra
    diam ut eros euismod tincidunt. Donec convallis diam at libero ultrices, id interdum lectus viverra. Sed
    mollis arcu nec quam bibendum dictum. Ut vel nulla mattis, venenatis arcu a, blandit purus. Nulla id
    blandit   turpis. In sollicitudin quis risus sit amet vehicula.`,
        price: 4995,
        colours: ['orange', 'white']
    }), new Product({
        title: 'Keeyway RKF 125',
        image: 'keeway-rkf-125.jpg',
        description: ` Etiam vitae ipsum vel purus faucibus luctus. Vivamus sem neque, suscipit at aliquam in, iaculis sed
        elit. Donec velit libero, ultrices laoreet posuere et, pellentesque vel nibh. Integer iaculis, arcu
        euismod faucibus mollis, lorem mauris molestie orci, vel mollis velit est sed sem. Fusce elementum
        nulla
        tellus, in accumsan leo venenatis sit amet. Cras hendrerit lacus nec facilisis bibendum. Maecenas
        convallis nunc nec dui luctus, quis semper velit faucibus. Sed sit amet tristique mauris, eu gravida
        felis. Aenean rutrum et erat quis luctus. Donec varius cursus auctor.`,
        price: 2995,
        colours: ['black', 'white']
    }), new Product({
        title: 'Yamaha R125',
        image: 'yr125.jpg',
        description: `  Suspendisse sed congue ipsum. Nullam fermentum lectus nulla, euismod posuere nisl egestas vel.
        Aenean
        pellentesque blandit cursus. Fusce eget erat sed lectus mattis mattis. Vestibulum auctor, nisi quis
        rutrum luctus, nunc nibh vehicula sem, vel vehicula nunc orci non neque. Praesent vitae tempor
        velit. In
        ex quam, cursus nec felis nec, suscipit bibendum nisl. Vestibulum pellentesque facilisis magna, ac
        tincidunt dolor pellentesque eu. Maecenas sit amet consequat sem, et ultricies sem. Donec
        pellentesque,
        mi sed faucibus vulputate, tortor lacus bibendum dui, sit amet pretium ex orci id dui. Vestibulum a
        odio
        vel leo dapibus fringilla. Proin non lectus urna.`,
        price: 3459,
        colours: ['black']
    }), new Product({
        title: 'Ducati Scrambler',
        image: 'ducati-scrambler.jpg',
        description: ` Etiam vitae ipsum vel purus faucibus luctus. Vivamus sem neque, suscipit at aliquam in, iaculis sed
        elit. Donec velit libero, ultrices laoreet posuere et, pellentesque vel nibh. Integer iaculis, arcu
        euismod faucibus mollis, lorem mauris molestie orci, vel mollis velit est sed sem. Fusce elementum
        nulla
        tellus, in accumsan leo venenatis sit amet. Cras hendrerit lacus nec facilisis bibendum. Maecenas
        convallis nunc nec dui luctus, quis semper velit faucibus. Sed sit amet tristique mauris, eu gravida
        felis. Aenean rutrum et erat quis luctus. Donec varius cursus auctor.`,
        price: 11795,
        colours: ['white']
    })
];

var db = mongoose.connection;
db.on('connecting', function () { console.log('Connecting to ', uri); });
db.on('connected', function () { console.log('Connected to ', uri); });
db.on('disconnecting', function () { console.log('Disconnecting from ', uri); });
db.on('disconnected', function () { console.log('Disconnected from ', uri); });
db.on('error', function (err) { console.error('Error ', err.message); });
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(function () { return Cart.deleteMany() })
    .then(function () { return User.deleteMany() })
    .then(function () { return Order.deleteMany() })
    .then(function () { return Product.deleteMany() })
    .then(function () { return cart.save() })
    .then(function () { return user.save() })
    .then(function () { return Product.insertMany(products); })
    .then(function () { mongoose.disconnect(); })
    .catch(function (err) { console.error('Error ', err.message); })
