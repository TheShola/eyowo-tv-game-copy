let port = (require('../config/config.js')).port,
    url = 'http://localhost:'+"9898",
    server = require('http').Server(),
    ioServer = (require('socket.io'))(server),
    game = new (require('../models/game.js'))(ioServer),
    io = require('socket.io-client'),
    socket = io(url),
    infonsp = url+'/info',
    viewnsp = url+'/view',
    info = io(infonsp),
    view = io(viewnsp),
    e = require('../config/eventdefinitions.js'),
    locked = true;

server.listen(port);



let catchall = function(interceptor){
    let _onevent = this.onevent;
    this.onevent = function(packet){
        interceptor(packet, ()=>{
            _onevent.call(this, packet);
        });
    };
};

info.__catchall =catchall;
view.__catchall = catchall;
socket.__catchall = catchall;


class UserModel {
    constructor(){
        this.user = "+2348164639898";
        this.authpin = "1234";
        this.nonauthpin ="1212345";
        this.failedLogins = 0;
        this.token;
        this.authorised = false;
    }
    getpin(p) {
        return p? this.authpin : this.nonauthpin;
    }

    reinit(){
        this.failedLogins = 0;
        this.token = true;
        this.authorised = false;
    }

    loginpayload(ptype){
        return {"user":  user.user, "pin" : this.getpin(ptype) }
    }
}


let user = new UserModel(),

    reinit= ()=>{
        user.reinit();
        locked = true;
        game.reinit();
        print("reinitializing for next test");
    },
    mkprint = msg =>{ return msg.reduce((a,b)=> a+", "+JSON.stringify(msg), "") },

    print = (msg, ...data) => {
        var line = (new Error).stack.split("\n")[4],
            index = line.indexOf("at "),
            line = line.slice(index+2, line.length);
        !!data ?
            console.log(`CLIENT: ${line} :` + msg+ " "+mkprint(data)) :
            console.log(`CLIENT: ${line} :` + msg)},
    package = msg => { return  { "msg" : msg, "user" : user.user , "token":user.token }; },

    depackage = pack => { return  JSON.parse(pack).msg },

    infosend = (event, payload) =>{
        print("sending info event: " + event)
        info.emit(event, package(payload));
    },

    viewsend = (event, payload) =>{
        print("sending view event: " + event)
        view.emit(event, package(payload));
    },
    displayview = (data) => {
        if(!locked){
            data = depackage(data);
            print("view to display page with message "+data);
        }else{
            print("client has been locked out");
        }
    };

module.exports = { game, info, view,
    user, reinit, locked,displayview,
    print, infosend , viewsend, depackage};
