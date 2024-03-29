let loaduser = require('./user.js').load,
    util = require('util'),
    clearusers = require('./user.js').clearusers,
    register = require('./user.js').register,
    e = require('../config/eventdefinitions.js'),
    m = require('../config/msgdefinitions.js'),
    debug = true,
    print = (msg, data)  => {
        debug ?
            !!data ?
            console.log( `SERVER : `  +msg + JSON.stringify(data)) :
            console.log( `SERVER : `  +msg):
            "";
    },
    socketclient ="socketclient",
    httpclient = "httpclient",
    //general socket utils
    extractId = (id) => {
        let sp = id.split("#");
        return sp[sp.length -1];
    },
    convertnsp = (namespace, socket) => {return `${namespace.name}#${extractId(socket.id)}`},
    unicast = (socket, event, message)=> {
        print(`unicasting  ${event} to client ${socket.id}` );
        socket.emit(event, envelope(message));
    },
    unicastToNamespace = (namespace, socket, event, message) => {
        print(`unicasting  ${event} with  ${message} to client ${socket.id} via ${namespace.name}`);
        print("new destination id of client", convertnsp(namespace, socket));
        namespace.to(convertnsp(namespace, socket)).emit(event, envelope(message));
    },
    broadcast = ( nsp , event, message) => {
        print(`now broadcasting ${event} to all clients on ${nsp.name}`);
        nsp.emit(event, envelope(message))
    },
    objectify = (string) => {return JSON.parse(string)},
    envelope = (payload) => {return JSON.stringify({ 'msg' : payload })},
    deenvelope = (payload)=> { return JSON.parse(payload[1]) },
    epochlength = 10,//60
    isprepayoutquestion = (index) => ((index + 2) % 5) == 0,
    ispayoutquestion = (index) => ((index+1) % 5) == 0,
    lifecost = 10000,
    payout = 50000,
    adinterval = 5000,
    gamekey = "game",
    gamenamespace = gamekey+":",
    generateGameKey = (i) => {return gamenamespace+i},
    db = require('./redis-async.js');


class Game{

    constructor(io){
        print("now constructing game");
        this.io = io;
        this.infonamespace = '/info';
        this.viewnamespace ='/view';
        this.infoupdates = io.of(this.infonamespace);
        this.viewupdates = io.of(this.viewnamespace);
        this.listenforallevents();
        this.listenforinfoupdates();
        this.listenforviewupdates();
        this.quiz = require('./quiz.js');
        this.clock = new(require('./gameclock.js'))(this.quiz.size, epochlength);
        this.started = false;
        this.id;
        this.setGameId();
        // setInterval( (game, socket) => { game.broadcastAdverts(socket) }, 5000,this);
    };

    setGameId(){
        print("setting game id");
        db.generateId(gamekey).then( (id) =>{
            this.id = generateGameKey(id);
            db.setObj( this.id , {
                "lifecost" : lifecost,
                "payout"  : payout,
                "id" : this.id
            });
        } );
    }

    listenforallevents(){
        print("now listening for all events");
        this.io.use((packet, next) => this.socketmiddleware(packet, next));
        this.io.on(e.connection, (socket) =>{
        });
    };

    listenforinfoupdates(){
        print("now listening for information events");
        this.infoupdates.on(e.connection, socket=>{
            print("info socket connected");
            socket.use((packet, next) => this.infomiddleware(socket, packet, next));
            // socket.on(e.login , data => this.handlelogin(socket, data, socketclient));
            // socket.on(e.register , data => this.handleregister(socket, data, socketclient));
            socket.on(e.declareself, data => this.handledeclareself(socket, data, socketclient));
            socket.on(e.checkanswer, data => this.handlecheckanswer(socket, data, socketclient));
            socket.on(e.buylife, data => this.handlebuylife(socket, data, socketclient));
            socket.on(e.questiontimedout, data => this.handlequestiontimeout(socket, data, socketclient));
            socket.on(e.lifetimedout, data => this.handlelifetimeout(socket, data, socketclient));
            socket.on(e.pinresults, data => this.handlepinresults(socket, data, socketclient));
        });
    };

    listenforviewupdates(){
        print("now listening for view events");
        this.viewupdates.on(e.connection, socket =>{
            print("view socket connected");
            socket.use((packet, next) => this.viewmiddleware(socket, packet, next));
            socket.on(e.ping, data => this.handleping(socket, data, socketclient));
            socket.on(e.disconnect, data => this.handledisconnect(socket, data, socketclient));
        });
    };

    //middleware
    socketmiddleware(socket, next){
        print('socket middleware hit');
        next();
    };

    async infomiddleware(socket, packet, next){
        let [event, contents ] = packet;
        print('information channel middleware is processing event ' + event);
        print("packet contents ", contents);

        // if(event == e.register){
        //     next();
        // }
        // else if(event == e.login){
        //     next();
        //}else{
            let [wasloaded, user] = await loaduser(contents.user, this.id);


            print("the user was loaded successfully", wasloaded)
            print("the current user is ", user);
            contents.user = user;

            if(user.attemptedOngoing){
                print('client is attempting to join an ongoing game, reject client');
                this.unicastGameHasStarted(socket);
            }

            // else if(!user.authorised){
            //     print('client has not been authorised, reject client');
            //     this.unicastLockViewSocket(socket);
            // }

            else if(user.status() == "Dead"){
                print('client who has lost is attempting to reconnect');
                this.unicastLockViewSocket(socket);
            }

            else{
                print("has passed all exceptions, passing to specfic handler")
                next();
            }
        //}
        // if(this.clock.isRunning) next();
        //in the else case, unicast the network timed out message
    };

    viewmiddleware(socket, packet, next){
        print('view channel is processing event '+ packet[0]);
        print("packet contents ", packet[1]);
        print('client socket id', socket.id);
    };

    //statistics
    //
    async getStats(){
        return await db.getObj(this.id);
    }
    getpayout(){
        return "500";
    };

    //event handlers

    //socket specific event handlers
    handledisconnect(socket, data){
        print('handle disconnect');
    };

    handleping(socket, ping){ 
        print('handle ping');
    };

    async handleregister(socket, data, clienttype){
        let {user, pin} = data.msg;
        print("handling registration for user");
        print("username is ", user);
        print("password is ", pin );

        await register(user, pin);

        // if else to check status of logged in and lock client based on failure to register
        this.handlelogin(socket, data, clienttype);

    }


    //general event handlers
    async handlelogin(socket, data, clienttype){
        //instantiate user and add to user array
        print("the requesting client is a ", clienttype);
        print('logging in user: ', data.msg);
        let [wasloaded, user] = await loaduser(data.msg.user,this.id);
        let [authorised , reason ,requirespin] = await user.login(data.msg.pin);
        console.log(authorised, reason, requirespin);

        if(!authorised) {
            print('user was not logged in');
            print("locking view socket for user:",user);
            this.unicastLockViewSocket(socket);
            this.unicastLoginResponse( socket, {authorised, reason, requirespin});
        }else{
            print('user was logged in');
            if(!requirespin){
                print("unlocking view socket for user:",user);
                this.unicastUnlockViewSocket(socket);
                this.unicastLoginResponse( socket, {authorised, reason, requirespin});
            } else{
                print("user must authenticate Eyowo");
                this.unicastUnlockViewSocket(socket);
                this.unicastRequiresPin(socket, reason);
            }
        }
    };

    async handlepinresults(socket, data, clienttype){
        print("this is the received data", data);
        let pin = data.msg,
            user = data.user;

        let results = await user.authEyowo(pin);
        results = results[0];
        console.log(results);
        if(results.success){
            unicastToNamespace(this.viewupdates,socket, e.declareself, "" );
        } else{
            this.unicastRequiresPin(socket, "The user pin was wrong");
            user.sendToken();
        }

    }



    handledeclareself(socket, data, clienttype){
        let user = data.user;
        print('handling declare self');
        print("the requesting client is a ", clienttype);
        if(!this.started){
            print("the client should wait for the game to start");
            this.unicastAwaitQuestion(socket, "The game will be starting soon");}
        else{
            print('client is attempting to join an ongoing game, reject client');
            user.didattemptongoing();
            this.unicastGameHasStarted(socket);
        }
    };

    async handlecheckanswer(socket, data, clienttype){
        let question = data.msg,
            user = data.user;

        print("the requesting client is a ", clienttype);
        print('handle check answer');
        print("Question contents ",question);
        print("the current user is", user);
        print("is the question sent the current question?", question);
        print("this the clock running", this.clock.isRunning());

        if(question.index == this.quiz.curr && this.clock.isRunning()){
            print("the answer arrived in time");
            let iscorrect = this.quiz.isCorrect(question.index, question.answer);
            //let iscorrect = question.answer; 

            if(iscorrect){
                print("client provided the correct answer");
                await user.didrespondcorrectly(question.index, question.index+1);//check that the user was actually saved

                if(ispayoutquestion(question.index)){
                    print("The client has won a payout");
                    user.didwinpayout(question.index, payout);//check that the payout was actually made, not doing this yet

                    this.unicastVictory(socket, this.getpayout());
                }else{
                    this.unicastIsCorrect(socket);
                }

            } else{
                if(isprepayoutquestion(question.index)){
                    print("client was wrong right before a payout");
                    await user.finalkill(question.index);
                    this.unicastHasLost(socket);
                    print("client to be locked out");
                    this.unicastLockViewSocket(socket);
                } else{
                    print("client was wrong, but can be revivied");
                    await user.didfailquestion(question.index);

                    this.unicastBuyALife(socket, { "index" : question.index, "amount" : lifecost });
                }
            }

        } else {
            print("the answer arrived too late");
            await user.didtimeout(question.index);
            this.unicastNetworkTimeoout(socket);
        }
    };

    async handlebuylife(socket, data, clienttype){
        let user = data.user,
            index = data.msg.index;

        print('handle buy life');
        print("the requesting client is a ", clienttype);
        print("the current user is", user);

        print("is the clock running?", this.clock.isRunning());
        print("is this the right index?", index == this.quiz.curr);

        if(this.clock.isRunning() && (index == this.quiz.curr)){
            print("the request arrived in time");
            let purchase = await user.didpurchaselife(index, lifecost);

            print(purchase);
            this.unicastHasBoughtLife(socket, "Your purchase was successful");
            // this.unicastAwaitQuestion(socket, "Your purchase was successful");
        }else{
            print("the request arrived too late");
            this.unicastNetworkTimeoout(socket);
        }
    };

    async handlequestiontimeout(socket, data, clienttype){
        let user = data.user,
            index = data.msg.index;

        print('handle question timeout');
        print("the requesting client is a ", clienttype);
        //keep track of where the user timed out
        //
        await user.didtimeout(index);

        if(index == this.quiz.curr && this.clock.isRunning() && !ispayoutquestion(index)){
            print("user didn't answer in time but can be revived");
            this.unicastBuyALife(socket, { "index" : index, "amount" : lifecost });
        }else if( ispayoutquestion(index)){
            print("user did not answer in time on a payout question. They lose automatically");
            user.finalkill(index);
            this.unicastNetworkTimeoout(socket);
        }else{
            print("user did not answer in the time and has missed the deadline");
            user.finalkill(index);
            this.unicastNetworkTimeoout(socket);
        }
    };

    handlelifetimeout(socket, data, clienttype){
        print('handle life timeout');
        print("the requesting client is a ", clienttype);
        let user = data.user,
            index = data.msg.index;

        print("user did not answer in the time and has missed the deadline");
        user.finalkill(index);
        this.unicastNetworkTimeoout(socket);
    };


    //admin router response functions
    broadcastNextQuestion(){
        if(!this.clock.isRunning() && this.started){
            let nextquestion = this.quiz.next();
            if(nextquestion.done){
                print("there are no more questions to broadcast");
                broadcast(this.infoupdates, e.endgame, "congratulations");
            }
            else{
                print('broadcasting next question');
                this.clock.advanceEpoch();
                broadcast(this.viewupdates, e.question, nextquestion.value);
                this.clock.beginEpoch();
                this.clock.printElapsed();
            }
        }else if(!this.started){
            print('You must start the game before broadcasting any questions');
        }else{
            print("Still accepting responses to the last question");
        }
    };

    //broadcast answer
    broadcastAnswer(){
        
        if(!this.clock.isRunning()){
            let currentQuestion = this.quiz.getCurrentQuestionBackend() !== undefined ? JSON.parse(this.quiz.getCurrentQuestionBackend()) : "";
            print("broadcasting answer " , currentQuestion.correct);
            broadcast(this.infoupdates, e.broadcastanswer, currentQuestion.correct);
            broadcast(this.viewupdates, e.broadcastanswer, currentQuestion.correct);

        }
        
    }

    broadcastAdverts(){
        broadcast(this.viewupdates, e.advert, "advert");
    }

    start(){
        print('starting the game');
        this.started = true;
    };



    endgame(){
        print('broadcast endgame');
        broadcast(this.viewupdates, e.endgame, "game has ended");
    }

    restart(){
        print('restarting the game');
        this.quiz.restart();
        this.quiz.restart();
        clearInterval(this.clock.ih);
        this.clock = new(require('./gameclock.js'))(this.quiz.size, epochlength);
        this.started = false;
        clearusers();
        this.setGameId();
        this.endgame();
    }

    //this will never be used except for testing
    reinit(){
        if(debug){
            print("reinitializing for next test");
            this.clock = new(require('./gameclock.js'))(this.quiz.size, 60);
            this.started = false;
        }
    };


    //unicast functions

    unicastHasBoughtLife(socket, message){
        unicastToNamespace(this.viewupdates, socket, e.hasboughtlife, "Success");
        unicastToNamespace(this.infoupdates, socket, e.hasboughtlife, "Success");
        //setInterval( (game, socket) =>{
        //       game.unicastAwaitQuestion(socket);
        //}, 3000, this, socket);
    }

    unicastRequiresPin(socket, message){
        unicastToNamespace(this.viewupdates, socket, e.requirespin, message);
        unicastToNamespace(this.infoupdates, socket, e.requirespin, message);
    }


    unicastVictory(socket, message){
        unicastToNamespace(this.viewupdates, socket, e.victory, message);
        unicastToNamespace(this.infoupdates, socket, e.victory, message);
    }

    unicastNetworkTimeoout(socket){
        unicastToNamespace(this.viewupdates, socket, e.networktimedout, e.networktimedout);
        unicastToNamespace(this.infoupdates, socket, e.networktimedout, e.networktimedout);
        this.unicastLockViewSocket(socket);
    }


    unicastLoginResponse(socket, message){
        unicastToNamespace(this.infoupdates, socket, e.loggedin, message);
        unicastToNamespace(this.viewupdates, socket, e.loggedin, message);
    };

    unicastBuyALife(socket, message){
        unicastToNamespace(this.viewupdates, socket, e.buylife, message);
        unicastToNamespace(this.infoupdates, socket, e.buylife, message);
    }

    unicastIsCorrect(socket){
        unicastToNamespace(this.viewupdates, socket, e.answercorrect, m.correctanswer);
        unicastToNamespace(this.infoupdates, socket, e.answercorrect, m.correctanswer);
    }

    unicastAnswerWrong(socket){
        unicastToNamespace(this.viewupdates, socket, e.answerwrong, m.wrongaswer);
        unicastToNamespace(this.infoupdates, socket, e.answerwrong, m.wrongaswer);
    }

    unicastHasLost(socket){
        unicastToNamespace(this.viewupdates, socket, e.haslost, m.haslost);
        unicastToNamespace(this.infoupdates, socket, e.haslost, m.haslost);
    }

    unicastLockViewSocket(socket){
        // unicast(socket, e.lock, m.lockmessage);
        unicastToNamespace(this.viewupdates, socket, e.lock, m.lockmessage);
        unicastToNamespace(this.infoupdates, socket, e.lock, m.lockmessage);
    };

    unicastUnlockViewSocket(socket){
        // unicast( socket , e.unlock, m.unlockmessage);
        unicastToNamespace(this.viewupdates, socket, e.unlock, m.unlockmessage);
        unicastToNamespace(this.infoupdates, socket, e.unlock, m.unlockmessage);
    };

    unicastGameHasStarted(socket){

        unicastToNamespace(this.infoupdates, socket, e.hasstarted, m.hasstartedmessage);
        unicastToNamespace(this.viewupdates, socket, e.hasstarted, m.hasstartedmessage);
        this.unicastLockViewSocket(socket);
    };

    unicastAwaitQuestion(socket){
        unicastToNamespace(this.infoupdates, socket, e.awaitquestion, m.awaitgamemessage);
        unicastToNamespace(this.viewupdates, socket, e.awaitquestion, m.awaitgamemessage);
    }

    unicastLoginDirection(socket){
        unicastToNamespace(this.infoupdates, socket, e.login, m.tologin);
        unicastToNamespace(this.viewupdates, socket, e.login, m.tologin);
    };

    //broadcast message functions


    //util functions
}

module.exports = Game;
