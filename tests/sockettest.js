let gs = require('./test-gamestate.js'),
    game = gs.game,
    info = gs.info,
    view = gs.view,
    user =gs.user,
    reinit = gs.reinit,
    locked = gs.locked,
    print = gs.print,
    infosend = gs.infosend,
    viewsend = gs.viewsend,
    depackage = gs.depackage,
    displayview = gs.displayview,
    e = require('../config/eventdefinitions.js'),
    TestRunner = new (require('./testcontainer.js').TestRunner)(reinit,()=>{}),
    question,

    respondwithcorrectanswer = () => {
        let correct =  game.quiz.getquestionat(question.index).correct;
        infosend(e.checkanswer,
       { "index" : question.index, "answer" :correct})
    };


info.on(e.hasstarted, data => {
    data = depackage(data);
    print(data);
});

info.on(e.loggedin,  data => {
    data = depackage(data);
    user.authorised = data.authorised;
    user.token = data.token;

    if (user.authorised){
        print("user has been authorized");
        locked = false;
        infosend(e.declareself,"declaring self");
    } else if (!user.authorised && user.failedLogins++ < 1 ){
        print("user has not been authorized");
    } else {
        print("authorized user was unable to login");
    };
});

info.on(e.lock, data =>{
    data = depackage(data);
    print("the view socket will be locked", data);
    locked = true;
});

info.on(e.unlock,data => {
    data = depackage(data);
    print(data);
    locked = false;
    print("view to declare self");
    infosend(e.declareself,"declaring self");
});

view.__catchall((packet, next)=>{
    [event, payload] = packet.data;
    print(event, payload);
    if(!locked){
        print(`${event} to be presented by view. payload: `, depackage(payload));
    } else{
        print("client has been locked out");
    }
    next();
});

view.on(e.question, (data) =>{
    question = JSON.parse(data).msg;
    // console.log(question);
});

// TestRunner.add(
//     "failed log in",
//     () =>{
//         reinit();
//         infosend(e.login,user.loginpayload(false));
//     }
// );

// TestRunner.add(
//     "successful log in attempt after game start",
//     () =>{
//         reinit();
//         game.start();
//         infosend(e.login,user.loginpayload(true));
//     }
// );

// TestRunner.add(
//     "successful log in before start ",
//     () => {
//         reinit();
//         infosend(e.login,user.loginpayload(true))
//     }
// );

// TestRunner.add(
//     "broadcast and display question",
//     () => {
//         game.broadcastNextQuestion();
//     }
// );

// TestRunner.add(
//     "respond to question with correct answer",
//     ()=>{
//         respondwithcorrectanswer();
//     }
// );

//TestRunner.add() test answer question correctl

TestRunner.add("test that registration works correctly",
    () =>{
        infosend(e.register, {"username" : "08034086111", "pin" : "1234"}); 
    }
);


// setTimeout(()=>{TestRunner.run()},1000);


