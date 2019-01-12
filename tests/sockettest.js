// const io = require('socket.io-client'),
//     url = 'http://localhost:'+(require('../config/config.js')).port,
//     socket = io(url),
//     e = require('../config/eventdefinitions.js'),
//     https = require('http');

//test that the initial message is received
// socket.on(e.awaitquestion, data => {
//     console.log(data);
// })

//socket.on(e.question, data => {
//    console.log(data.value);
//    let index = data.value.index;
//    for(let x of data.value.responses )socket.emit(e.checkanswer, JSON.stringify({"index" : index, "answer": x.option}));

//});


//socket.on(e.answerresult,console.log);




////test url endpoints
//(() => {
//    for(let i = 0 ; i < 15 ; i++) https.get(url+'/next' , (data, err)=>{});

//})();



