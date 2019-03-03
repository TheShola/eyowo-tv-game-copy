let register = require('../models/user.js').register,
    loaduser = require('../models/user.js').load,
    debug = true,
    routestrings = require('../config/routedefinitions'),
    userspace="user:",
    db = require('../models/redis-async'),
    authrouter = 'AUTH ROUTER: ',
    print = async (msg, data)  => {
        debug ?
            !!data ?
            console.log( `AUTH ROUTER: `  +msg + JSON.stringify(data)) :
            console.log( `AUTH ROUTER: `  +msg):
            "";
    };


class routes{

    constructor(eh){
        this.eh = eh;
        this.router = (require('express')).Router();
        this.router.use(this.middleware);
        this.router.post('/register', (req, res, next) => this.handleregister(req, res, next));
        this.router.post('/login', (req, res, next) => this.handlelogin(req, res));
        this.router.post('/eyowo', (req, res, next) => this.handleEyowo(req, res));


    };

    getRouter(){
        return this.router;
    };

    async handleregister(req, res, next){
        let {user, password} = req.body,
        dbhasuser = await db.has(userspace+user) == 1; 
        await console.log(authrouter + "handling registration for user");
        await console.log(authrouter + "username is " + user);
        await console.log(authrouter + "password is " + password);
        await console.log(authrouter + 'user exists in db '+ dbhasuser);

        if (!dbhasuser) {
            await console.log(authrouter + ' user to be registered ' + user);
            if (user === null || password === null) 
            { 
                print('invalid object sent'); 
                res.status(400).send({
                    success: false,
                    msg: 'User data sent has issues'
                });
            }
            else { 
                    let result = await db.setObj(userspace+user , {
                        'phone' : user,
                        'password' : password
                    });  
                    res.status(200).send({
                        msg: "User registered successfully",
                        success: true
                    });
                    await console.log(authrouter + ' user registered successfully ' + result);
                } 
                this.handlelogin(req, res);
                next();
        }
    }

    async handlelogin(req, res){
        //instantiate user and add to user array
        let username = req.body.user,
            password = req.body.password;
        await console.log(authrouter + 'logging in user: ', username);
        let [wasloaded, user] = await loaduser(username, this.eh.id);
        await print(user);
        if (wasloaded){
        let [authorised , reason ,requirespin] = await user.login(password);

        if(!authorised) {
            print('user was not logged in');
            res.status(400).send({success: false, authorised, reason, requirespin});
            
        }else{
            print('login successful');
            if(!requirespin){
                print("unlocking view socket for user:",user);
                res.status(200).send({success: true, authorised, reason, requirespin});
            } else{
                print("user must authenticate Eyowo");
                res.status(300).send({success: false, authorised, reason, requirespin});
            }
        }
    }
    else{
        res.status(500).send({
            msg: "Internal Server Error"
        });
    }
    }

    async handleEyowo(req, res){
        let username = req.body.user;
        let password = req.body.password;
        await console.log(authrouter + 'logging in user: ', username);
        let [wasloaded, user] = await loaduser(username, this.eh.id);
        let [authstatus, reason, accessToken] = await user.authEyowo(password);
        print(`Eyowo token retrieved for user ${user}`, authstatus);
        if (authstatus){
            res.status(200).send({success: true, authstatus, reason});
        } else {
            res.status(500).send({success: false, authstatus, reason});
        }
            
    }

    middleware(req, res, next){
        let body = JSON.stringify(req.body);
        console.log(authrouter+ 'middleware '+ body);
        next();
    }

}

module.exports = routes;