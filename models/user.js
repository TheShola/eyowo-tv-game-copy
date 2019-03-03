let userspace="user:",
    userlist = {},
    clearusers = () =>{
        userlist = {};
    },
    db = require('./redis-async.js'),
    register = async(user, password)=>{
        let res;
        if ( await !db.has( userspace+user )){
                res = await db.setObj(userspace+user, {
                    "phone" : user,
                    "password" : password
            });
        };
        return res;
    },
    load = async(user, gid) => {
        print(`now loading ${userspace+user}`);     
        if(await db.has(userspace+user)){
            print("user exists in db");
            let u;
            if( await db.objHas(gid,userspace+user)){
                u = await User.prototype.load( gid, userspace+user);
                print(u.__repr());
            } else{
                u = await new User(user, gid);
                print(u.__repr());
                let token = await getObjField(userspace+user, "accessToken");

                u.token =token; 
                await u.update();
                // console.log("user token",u.token);
            }
            return [true,u];
        } else{
            print("user does not exist in db");
            return [false, null];
        }
    },
    login = require('./eyowoservice.js').login,
    purchase = require('./eyowoservice.js').purchase,
    payout = require('./eyowoservice.js').payout,
    exists = require('./eyowoservice.js').exists,
    sendToken = require('./eyowoservice.js').sendToken,
    checkbalance = require('./eyowoservice.js').checkbalance,
    print = (tp) => console.log("USER : " + tp);


class User{
    constructor(phone, gid){
        print("instantiating new user");
        this.gid = gid;
        this.phone = phone;
        this.deathEpochs = [];
        this.lifePurchaseEpochs = {};
        this.timeoutepochs = [];
        this.correctepochs = [];
        this.eyowoToken = "";
        this.limbo = false;
        this.isAlive = true;
        this.authorised = false;
        this.attemptedOngoing=false;
        this.score = 0;
        this.token;
        this.payouts = {};
        this.update();
    }

    async load(gid, key){
        // this.update();
        print(`loading ${key} from the db for ${gid}`);
        let user = await db.getObjField(gid, key);
        print(`loaded ${user} from db`);
        let ob = JSON.parse(user);
        for( let k in ob) this[k] = ob[k];
        this.token = await getObjField(userspace+this.phone, "accessToken");
        console.log(this.token);
        return this;
    };

    async update(){
        //this is where we make any changes and then save to redis
        print("Saving changes to database");
        await db.setObjField(this.gid, userspace+this.phone, this.__repr());
    };

  __repr() {
    let toret = Object.getOwnPropertyNames(this).reduce((a, b) => {
      a[b] = this[b];
      return a;
    }, {});
      return JSON.stringify(toret);
  }

    incrscore(delta){
        if(delta ==undefined) this.score++;
        else this.score+=delta;
    }

    async sendToken(){
        print("sending out the token for", this.phone);
        return sendToken(this.phone);
    }

    async login(password){
        print(this.__repr());
        print(`logging in ${this.phone} with ${password}`);
        // let loginresponse = await login(this.phone, password);
        console.log(userspace+this.phone); 
        let matches = await db.getObj(userspace+this.phone);
        matches = matches.password;
        if(password == matches){ //this is terrible and insecure. 
            let accountExists = await exists(this.phone);
            print("does the account exist with eyowo? "+ accountExists);
            if(accountExists){
                let balcheck =  0 < await this.checkbalance();
                if (balcheck) {
                    this.authorised = true;
                    await this.update();
                    return [true, "you have been successfully logged in", false];
                } else {
                    this.sendToken();
                    this.authorised = true;
                    await this.update();
                    return [true, "you need to reauthenticate your eyowo account",true];
                }
            } else{
                return [false, "you do not have an eyowo account", false];
            }

        }else {
            return [false, "Your username or password does not match our records", false];
        };
    }

    async authEyowo(password){
           let authstatus = await login(this.phone, password);
            this.authorised = authstatus.success;
            if(authstatus.success){
                await setObjField(userspace+this.phone, "accessToken", authstatus.data.accessToken);
                await setObjField(userspace+this.phone, "refreshToken", authstatus.data.refreshToken);
                let reason = authstatus.message;
                this.token = authstatus.data.accessToken;
                await this.update();
                print(this.__repr());
                return [authstatus, reason, authstatus.data.accessToken];
            } else{
                let reason = authstatus.error;
                return [authstatus, reason, ""];
            }
    };

    async checkbalance(){
        print(this.__repr());
        let result = await checkbalance(this.phone, this.token);
        return result;
    }

    async hasbalance(level){
        return level < await this.checkbalance();
    }

    async didattemptongoing(){
        this.attemptedOngoing = true;
        await this.update();
    };

    async didrespondcorrectly(i, delta){
        console.log(i, delta);
        this.correctepochs.push(i);
        console.log(this.correctepochs)
        this.incrscore(delta);
        await this.update();
    };

    async didfailquestion(index){
        this.isAlive = false;
        this.limbo = true;
        this.deathEpochs.push(index);
        await this.update();
    };

    async didtimeout(i){
        this.timeoutepochs.push(i);
        this.isAlive = false;
        this.limbo = false;
        await this.update();
    }

    async didwinpayout(i, amount){
        let transaction = await payout(this.phone, amount);
        if(transaction.success){
            this.payouts[i] = { "amount" : amount, "reference" : transaction.data.transaction.reference};
            await this.update();
            return [transaction.success, transaction.message];
        }else{
            return [transaction.success, transaction.error];
        }
    }

    async didpurchaselife(index, amount){
        let transaction  = await purchase(this.token, amount);
        if(transaction.success){
            this.lifePurchaseEpochs[index] = { "amount" : amount, "reference" : transaction.data.transaction.reference };
            await this.update();
            return [transaction.success, transaction.message];
        }else{
            return [transaction.success, transaction.error];
        }
    };

    async finalkill(index){
        this.deathEpochs.push(index);
        this.isAlive = false;
        this.limbo = false;
        await this.update();
    };

    //info
    async status(){
        if(this.isAlive && !this.limbo) return "Alive";
        else if(!this.isAlive && this.limbo) return "Pending";
        else if(this.isAlive && this.limbo) return "Pending";
        else return "Dead";
    }

    async isDead(){
        return this.status() == "Dead";
    }

    async isPending(){
        return this.status == "Pending";
    }

    async isAlive(){
        return this.status =="Alive";
    }

    async finalDeathIndex(){
        return this.isAlive ? -1 : this.lifePurchaseEpochs[ this.lifePurchaseEpochs.length -1];
    };

    async hasPurchasedLife(){
        return this.lifePurchaseEpochs.length != 0;
    };

    async numLivesPurchased(){
        return this.lifePurchaseEpochs.length;
    };

    async numDeaths(){
       return this.deathEpochs.length;
    };
}

module.exports = {load, register, clearusers};
