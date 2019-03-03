let e = require('../config/eventdefinitions.js');
let m = require('../config/msgdefinitions.js');
let GameClock = require('../models/gameclock');

class EventHandler{

    constructor(io){
        this.io = io;
        this.stats = io.of('/stats');
        this.listen();
        this.statsup();
        this.quiz =require('../models/quiz.js');
        this.cc = 0;
        this.tc = 0;
    };

    listen(){
        this.io.on(e.connection, (socket) =>{

            // socket.use( (packet, next) => this.middleware(packet, next ));
            this.handleNewConnection(socket);
            socket.on(e.checkanswer, data => this.handleCheckAnswer(socket, data));
            //SA Additions
            socket.on(e.disconnect, data => this.handleEndConnection(socket, data));
            socket.on(e.ping, data => this.handlePing(socket, data));
        });
    };

    statsup(){
        this.stats.on('connection', (socket)=>{
            --this.tc;
            this.stats.emit('update', this.getstats());
            this.stats.on('update', (data)=> {
                this.updateStats();
            });
        });
    }


    endgame(){
     this.broadcast(e.endgame, "ended");
    }
    // handlers

    middleware(packet, next){
        next();
    }

    handleNewConnection(socket){
        console.log(` ${socket.id} has connected, connection count ${++this.cc}`);
        ++this.tc;
        this.updateStats();
        this.unicast(socket, e.awaitquestion , this.quiz.isstarted());
    };

    handleEndConnection(socket, data){
        console.log(` ${socket.id} has disconnected, connection count ${--this.cc}`);
    };

    broadcastNextQuestion(){
        let nextquestion = this.quiz.next();
        nextquestion.done ?
            this.broadcast(e.endgame, ""):
            this.broadcast(e.question, nextquestion);
    };

    handleCheckAnswer(socket, data){
        console.log(` ${socket.id} has requested an answer check, connection count ${this.cc}`);
        data = this.objectify(data);
        let iscorrect = this.quiz.isCorrect(data.index, data.answer);
        iscorrect?
        this.unicast(socket, e.answercorrect, iscorrect):
        this.unicast(socket, e.answerwrong, iscorrect);
    };

    handlePing(socket, data){
        console.log(`ping from ${socket.id}, connection count ${this.cc}`);
        this.unicast(socket, e.pong, "pong");
    }


    //utility functiono: move these over to their own file

    getstats(){
        if(this.quiz.hasnext()){
        return `
<table class="tg">
  <tr>
    <th class="tg-0lax">Number</th>
    <th class="tg-0lax">${this.quiz.getCurrentQuestion().index +1 }</th>
  </tr>
  <tr>
    <td class="tg-0lax">Question</td>
    <td class="tg-0lax">${this.quiz.getCurrentQuestion().text}</td>
  </tr>
  <tr>
    <td class="tg-0lax">Correct Answer</td>
    <td class="tg-0lax">${this.quiz.getCurrentQuestion().correct}</td>
  </tr>
  <tr>
    <td class="tg-0lax">Users currently playing</td>
    <td class="tg-0lax">${this.cc - 1}</td>
  </tr>
  <tr>
    <td class="tg-0lax">Total Logins</td>
    <td class="tg-0lax">${this.tc}</td>
  </tr>
</table>
        `;} else {
           // return "<p><a href='/restart'> restart quiz </a></p>";
           return "";
        }
    }

    unicast(socket, event, message){
        this.io.to(socket.id).emit(event, this.envelope(message));
    }

    broadcast( event, message){
        this.io.emit(event, this.envelope(message));
    }

    objectify(string){
        return JSON.parse(string);
    }

    envelope(payload){
        return JSON.stringify({ 'msg' : payload });
    }

    updateStats(){
        this.stats.emit('update', this.getstats());
    }
}

module.exports = EventHandler;
