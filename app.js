let app = require('express')(),
    routedefinitions = require('./config/routedefinitions'),
    bodyparser = require('body-parser'),
    cors = require('cors'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    // EventHandler = new (require('./lib/EventHandler.js'))(io),
    Game = new(require('./models/game.js'))(io),
    router = new (require('./routes.js'))(Game).getRouter(),
    config = require('./config/config.js'),
    auth_routes = new (require('./routes/auth'))(Game).getRouter();
    admin_routes = new(require('./routes/admin'))(Game).getRouter(),
    // game_routes = new (require('./routes/game'))(Game).getRouter();


    app.use(bodyparser.urlencoded({ extended: false }));
    app.use(cors());
    app.use(routedefinitions.auth, auth_routes);
    app.use('/', admin_routes);
   // app.use(routedefinitions.game, game_routes);


   // app.use(router);


http.listen(config.port, () => {
    // console.log('listening on port '+ config.port);
});

