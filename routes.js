let routestrings = require('./config/routedefinitions.js'),
    path = require('path'),
    partials = path.join( __dirname + '/partials/'),
    getpath = (file) => {return path.join(partials+file+'.html')},
    password ="12345",
    authenticated = true,
    quiz = require('./models/quiz.js');
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

        // this.router.post(routestrings.auth, (req, res, next) => this.auth(req, res, eh));
        // this.router.use((req, res, next) => this.middleware(req, res, next, eh));
        this.router.get(routestrings.favicon, (req, res, next) => this.favicon(req, res, eh));
        //this.router.get(routestrings.logout, (req, res, next) => this.logout(req, res, eh));
        this.router.get(routestrings.stats, (req, res, next) => this.stats(req, res, eh));
        ////add new routes above here
        this.router.route(routestrings.catchall)
            .all( (req, res, next) => this.catchall(req, res, eh));
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

    next(req, res, eh){
        if(quiz.hasnext()) {
            eh.broadcastNextQuestion();
            res.status(200).send(`<a href='/next'>next question</a>
                                <br/>
                                <a href='/restart'>restart</a>
                                <br/>
                                 <pre>
                                 Current Question:
                                <code>${eh.quiz.getCurrentQuestionBackend()}</code>
                                </pre>
                                <br/>
                                <pre>
                                Next Question:
                                <code>${eh.quiz.getNextQuestionBackend()} </code>
                                </pre>
        `);
            // res.status(200).sendFile(getpath('next'));
        } else {
            res.status(200).sendFile(getpath('logout'));
        }
    };

    start(req, res, eh){
        eh.start();
        res.status(200).send(`<a href='/next'>next question</a>
                                <br/>
                                <a href='/restart'>restart</a>
                                <br/>
                                 <pre>Current Question:
                                <code>${eh.quiz.getCurrentQuestionBackend()}</code>
                                </pre>

                                <br/>
                                <pre>Next Question:
                                <code>${eh.quiz.getNextQuestionBackend()} </code>
                                </pre>
                         `)
    }

    catchall(req, res, next, eh){
        res.status(404).sendFile(getpath('404'));
    };
}
module.exports = routes;
