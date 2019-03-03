let routestrings = require('../config/routedefinitions.js'),
    path = require('path'),
    partials = path.join( __dirname + '/partials/'),
    getpath = (file) => {return path.join(partials+file+'.html')},
    password ="12345",
    authenticated = true,
    quiz = require('../models/quiz.js');
class routes{

    constructor(eh){
        // this.EventHandler = EventHandler;
        // we have to explicitly pass the event handler to each function because the scope of
        // "this" changes within the callback... it might make more sense to proimisify it for
        // readability, but this should work for now... actually, we can just bind this.


        this.router = (require('express')).Router();
        this.router.get(routestrings.root, (req, res, next) => this.root(req, res, eh));
        this.router.get(routestrings.start, (req, res, next) => this.start(req, res, eh));
        this.router.get(routestrings.next, (req, res, next) => this.next(req, res, eh));
        this.router.get(routestrings.restart, (req, res, next) => this.restart(req, res, eh));
        this.router.get(routestrings.broadcastanswer, (req, res) => this.broadcastanswer(req, res, eh));

        // this.router.post(routestrings.auth, (req, res, next) => this.auth(req, res, eh));
        // this.router.use((req, res, next) => this.middleware(req, res, next, eh));
        this.router.get(routestrings.favicon, (req, res, next) => this.favicon(req, res, eh));
        //this.router.get(routestrings.logout, (req, res, next) => this.logout(req, res, eh));
        this.router.get(routestrings.stats, (req, res, next) => this.stats(req, res, eh));
        ////add new routes above here
        // this.router.route(routestrings.catchall)
        //     .all( (req, res, next) => this.catchall(req, res, eh));
    };

    getRouter(){
        return this.router;
    };

    middleware(req, res , next, eh) {
        if(!authenticated) res.status(300).sendFile(getpath('adminauth'));
        else next();
    };

    restart(req, res, eh){
        eh.restart();
        res.redirect(routestrings.root);
    }

    auth(req, res, eh){
        authenticated = req.body.code ==password;
        res.redirect(routestrings.root);
    }
    
    logout(req, res, eh){
        authenticated = false;
        quiz.restart();
        eh.endgame();
        res.redirect(routestrings.root);
    }

    favicon(req, res, eh){
        res.redirect(308,'https://www.eyowo.com/uploads/favicons/favicon-32x32.png');
    }

    async stats(req, res, eh){
        // res.status(200).sendFile(getpath('stats'));
        let livestats = await eh.getStats()
        res.send(livestats);
    };

    root(req, res, eh){
        // res.status(200).sendFile(getpath('root'));
        res.status(200).send(`<a href='/start'> start game</a>`);
    };

    async broadcastanswer(req, res, eh){
            eh.broadcastAnswer();

            var currentQuestion = eh.quiz.getCurrentQuestionBackend() !== undefined ? JSON.parse(eh.quiz.getCurrentQuestionBackend()) : "";

            var elapsedTime = Math.floor((eh.clock.epochLength - eh.clock.elapsedTime()) / 1e3);
            var returnLoopQuestions = (i, x) => {
               return currentQuestion.responses[i][x]
            }
            res.status(200).send(`

            <style>
            div{
                padding: 15px
            }
            td{
                border: 1px solid #ddd;
                padding: 10px 15px ;
            }th {
                vertical-align: bottom;
                border-bottom: 2px solid #ddd;   
            }
            .button{
                padding: 10px 15px;
                background: #ffce00;
                border-radius:5px; 
                text-decoration: none;
                color: #000000;
                margin: 5px 10px 5px 0px
            }
            .button:hover{
                box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
            }
            </style>
            <script>
            window.onload = function() {
            var timeleft = Number(${elapsedTime});
            var downloadTimer = setInterval(function () {
                document.getElementById("countdown").innerHTML = timeleft + " seconds remaining";
                timeleft -= 1;
                if (timeleft <= 0)
                    clearInterval(downloadTimer);
                    (timeleft==0)? document.getElementById("countdown").innerHTML = "Go to next question":null;
            }, 1000);
      
        }
            </script>
            <div>
                 <p>      
                    <a href='/next' class="button">Next Question</a>
                    <a href='/broadcastanswer' class="button">Broadcast Answer</a></p>
                     <a href='/restart' class="button">Restart</a></p>
                                 <pre>
                                <h2>Current question: ${currentQuestion.text}</code>
                               <table>
                               <thead>
                               </thead>
                                <tbody>
                                 <tr>
                               <td> ${returnLoopQuestions(0, 'option')}</td>
                               <td> ${returnLoopQuestions(0, 'value')}</td>
                                </tr>
                                <tr>
                                <td> ${returnLoopQuestions(1, 'option')}</td>
                                <td> ${returnLoopQuestions(1, 'value')}</td>
                                 </tr>
                                 <tr>
                                 <td> ${returnLoopQuestions(2, 'option')}</td>
                                 <td> ${returnLoopQuestions(2, 'value')}</td>
                                  </tr>
                                  <tr>
                                 <td> ${returnLoopQuestions(3, 'option')}</td>
                                 <td> ${returnLoopQuestions(3, 'value')}</td>
                                  </tr>
                                  
                            </tbody>
                        </table>
                              <h3>The Correct Answer: ${currentQuestion.correct}</h3>
                                </pre>
                                </div>
        `);
    }

   next(req, res, eh) {
        if (quiz.hasnext()) {

            eh.broadcastNextQuestion();

            var currentQuestion = eh.quiz.getCurrentQuestionBackend() !== undefined ? JSON.parse(eh.quiz.getCurrentQuestionBackend()) : "";


            var elapsedTime = Math.floor((eh.clock.epochLength - eh.clock.elapsedTime()) / 1e3);
            var returnLoopQuestions = (i, x) => {
               return currentQuestion.responses[i][x]
            }
            res.status(200).send(`

            <style>
            div{
                padding: 15px
            }
            td{
                border: 1px solid #ddd;
                padding: 10px 15px ;
            }th {
                vertical-align: bottom;
                border-bottom: 2px solid #ddd;   
            }
            .button{
                padding: 10px 15px;
                background: #ffce00;
                border-radius:5px; 
                text-decoration: none;
                color: #000000;
                margin: 5px 10px 5px 0px
            }
            .button:hover{
                box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
            }
            </style>
            <script>
            window.onload = function() {
            var timeleft = Number(${elapsedTime});
            var downloadTimer = setInterval(function () {
                document.getElementById("countdown").innerHTML = timeleft + " seconds remaining";
                timeleft -= 1;
                if (timeleft <= 0)
                    clearInterval(downloadTimer);
                    (timeleft==0)? document.getElementById("countdown").innerHTML = "Go to next question":null;
            }, 1000);
      
        }
            </script>
            <div>
                 <p>      
                    <a href='/next' class="button">Next Question</a>
                    <a href='/broadcastanswer' class="button">Broadcast Answer</a></p>
                     <a href='/restart' class="button">Restart</a></p>
                     
                                 <pre>
                                <h2>Current question: ${currentQuestion.text}</code>
                               <table>
                               <thead>
                               </thead>
                                <tbody>
                                 <tr>
                               <td> ${returnLoopQuestions(0, 'option')}</td>
                               <td> ${returnLoopQuestions(0, 'value')}</td>
                                </tr>
                                <tr>
                                <td> ${returnLoopQuestions(1, 'option')}</td>
                                <td> ${returnLoopQuestions(1, 'value')}</td>
                                 </tr>
                                 <tr>
                                 <td> ${returnLoopQuestions(2, 'option')}</td>
                                 <td> ${returnLoopQuestions(2, 'value')}</td>
                                  </tr>
                                  <tr>
                                 <td> ${returnLoopQuestions(3, 'option')}</td>
                                 <td> ${returnLoopQuestions(3, 'value')}</td>
                                  </tr>
                                  
                            </tbody>
                        </table>
                              <h3>The Correct Answer: ${currentQuestion.correct}</h3>
                                </pre>
                                </div>
        `);
            // res.status(200).sendFile(getpath('next'));
        } else {
            res.status(200).sendFile(getpath('logout'));
        }
    };
    start(req, res, eh) {
        eh.start();
        res.status(200).send(`<div>
                                <p>To broadcast the first question, please click begin</p>
                                <p><a href='/next'>BEGIN</a>
                                <a href='/restart'>RESTART</a> </p>  
                                </div>                
                         `)
    }

    // catchall(req, res, next, eh){
    //     res.status(404).sendFile(getpath('404'));
    // };
}
module.exports = routes;
