let e = require('../config/eventdefinitions.js');
let m = require('../config/msgdefinitions.js');

class EventHandler{

    constructor(io){
        this.io = io,
        this.listen();
        this.quiz = new (require('../models/quiz.js'))();
    }

    listen(){
        this.io.on(e.connection, (socket) =>{
            this.handleNewConnection(socket);
            socket.on(e.checkanswer, data => this.handleCheckAnswer(socket, data));
        });
    }

    //handlers
    handleNewConnection(socket){
        this.unicast(socket, e.awaitquestion , this.envelope("wait"));
    }


    broadcastNextQuestion(){
        let nextquestion = this.quiz.next();
        nextquestion.done ?
            this.broadcast(e.questionsterminated, this.envelope("")) :
            this.broadcast(e.question, nextquestion);
    }


    handleCheckAnswer(socket, data){
        data = this.objectify(data);
        let iscorrect = this.quiz.isCorrect(data.index, data.answer);
        this.unicast(socket, e.answerresult, this.envelope(iscorrect));
    }


    //utility functions
    unicast(socket, event, message){
        this.io.to(socket.id).emit(event, message);
    }

    broadcast( event, message){
        this.io.emit(event, message);
    }

    objectify(string){
        return JSON.parse(string);
    }

    envelope(payload){
        return JSON.stringify({ 'msg' : payload });
    }
}

module.exports = EventHandler;
