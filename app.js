let app = require('express')(),
    bodyparser = require('body-parser'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    // EventHandler = new (require('./lib/EventHandler.js'))(io),
    Game = new(require('./models/game.js'))(io),
    router = new (require('./routes.js'))(Game).getRouter(),
    config = require('./config/config.js');



    app.use(bodyparser.urlencoded({ extended: false }));
    app.use(router);


http.listen(config.port, () => {
    // console.log('listening on port '+ config.port);
});

