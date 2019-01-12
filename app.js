let app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    EventHandler = new (require('./lib/EventHandler.js'))(io),
    config = require('./config/config.js');


app.get('/favicon.ico', (req, res) => res.status(204).send('1'));



app.get('/', (req, res) =>{
    res.send(`
        <script src="/socket.io/socket.io.js"></script>
        <script>
            var socket = io();
        </script
        <p> welcome to the eyowotv api</p>
    `)
});


app.get('/next', (req, res) => {
    EventHandler.broadcastNextQuestion();
    res.end('next question has been broadcast ');
});

app.get('/reveal', (req, res)=> {

});

app.get('*', function(req, res){
  res.send('Wild monkeys have stolen this route. Try another!', 404);
});



http.listen(config.port, () => {
    console.log('listening on port '+ config.port);
});

