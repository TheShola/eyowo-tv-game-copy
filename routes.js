let routestrings = require('./config/routedefinitions.js'),
    path = require('path'),
    partials = path.join( __dirname + '/partials/'),
    getpath = (file) => {return path.join(partials+file+'.html')},
    password ="12345";

class routes{

    constructor(eh){
        // this.EventHandler = EventHandler;
        // we have to explicitly pass the event handler to each function because the scope of
        // "this" changes within the callback... it might make more sense to proimisify it for
        // readability, but this should work for now

        this.router = (require('express')).Router();
        this.router.use((req, res, next) => this.authenticate(req, res, next, eh));
        this.router.get(routestrings.favicon, (req, res, next) => this.favicon(req, res, eh));
        this.router.get(routestrings.root, (req, res, next) => this.root(req, res, eh));
        this.router.get(routestrings.next, (req, res, next) => this.next(req, res, eh));

        //add new routes above here
        this.router.route(routestrings.catchall)
            .all( (req, res, next) => this.catchall(req, res, eh));
    };

    getRouter(){
        return this.router;
    };

    authenticate(req, res , next, eh) {
        // console.log('Authenticate users here');
        next();
    };

    favicon(req, res, eh){
        res.status(308).send('https://www.eyowo.com/uploads/favicons/favicon-32x32.png');
    }

    root(req, res, eh){
        res.status(200).sendFile(getpath('root'));
    };

    next(req, res, eh){
        eh.broadcastNextQuestion();
        res.status(200).sendFile(getpath('next'));
    };

    catchall(req, res, next, eh){
        res.status(404).sendFile(getpath('404'));
    };
}
module.exports = routes;
