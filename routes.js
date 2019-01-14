let routestrings = require('./config/routedefinitions.js'),
    path = require('path'),
    partials = path.join( __dirname + '/partials/'),
    getpath = (file) => {return path.join(partials+file+'.html')},
    password ="12345",
    authenticated = false,
    quiz = require('./models/quiz.js');

class routes{

    constructor(eh){
        // this.EventHandler = EventHandler;
        // we have to explicitly pass the event handler to each function because the scope of
        // "this" changes within the callback... it might make more sense to proimisify it for
        // readability, but this should work for now


        this.router = (require('express')).Router();
        this.router.post(routestrings.auth, (req, res, next) => this.auth(req, res, eh));
        this.router.use((req, res, next) => this.middleware(req, res, next, eh));
        this.router.get(routestrings.favicon, (req, res, next) => this.favicon(req, res, eh));
        this.router.get(routestrings.root, (req, res, next) => this.root(req, res, eh));
        this.router.get(routestrings.next, (req, res, next) => this.next(req, res, eh));
        this.router.get(routestrings.logout, (req, res, next) => this.logout(req, res, eh));
        this.router.get(routestrings.stats, (req, res, next) => this.stats(req, res, eh));
        this.router.get(routestrings.restart, (req, res, next) => this.restart(req, res, eh));
        //add new routes above here
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
        quiz.restart();
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

    stats(req, res, eh){
        res.status(200).sendFile(getpath('stats'));
    }

    root(req, res, eh){
        res.status(200).sendFile(getpath('root'));
    };

    next(req, res, eh){
        if(quiz.hasnext()) {
            eh.broadcastNextQuestion();
            res.status(200).sendFile(getpath('next'));
        } else {
            res.status(200).sendFile(getpath('logout'));
        }
    };

    catchall(req, res, next, eh){
        res.status(404).sendFile(getpath('404'));
    };
}
module.exports = routes;
