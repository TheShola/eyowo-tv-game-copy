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
        <p> welcome to the eyowotv api   <a href="/next"> click to broadcast a question</a></p>
    `)
});


app.get('/next', (req, res) =>{
    EventHandler.broadcastNextQuestion();
    res.end('<p> a question has been broadcast <a href="/next">click to broadcast the next question</a> </p>');
});


app.get('/reveal', (req, res)=> {

});

app.get('*', function(req, res){
    res.status(404).send(`
    <html>
    <head><meta name="viewport" content="width=device-width, minimum-scale=0.1"></head>
    <body>
    <div stlye ="margin: auto; width: 50%; border: 3px solid green; padding: 10px;">
    <marquee behavior="alternate" direction="left">Oh no! a monkey has stolen this route</marquee>
    <marquee behavior ="alternate" direction="right"  scrollamount="20">
    <img style="display: block; margin-left: auto; margin-right: auto; height:70%;" src="https://i.imgur.com/1HPuAa2.gif">
    </marquee>
    </div>
    </body>
    </html>
    `);
});



http.listen(config.port, () => {
    console.log('listening on port '+ config.port);
});

