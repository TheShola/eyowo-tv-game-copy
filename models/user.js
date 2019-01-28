let userspace="user:",
    userlist = {},
    clearusers = () =>{
        userlist = {};
    },
    db = require('./redis-async.js'),
    load = async(user, gid) =>{
        //replace with redis interaction
        if ( ! await db.has( userspace+user )){
            await db.setObj(userspace+user, {
                "phone" : user
            });
        };

        let u;
        if( await db.objHas(gid,userspace+user)){
            u = User.prototype.load( gid, userspace+user);
        } else{
            u = new User(user, gid);
        }

        return u;
    },
    login = require('./eyowoservice.js').login,
    purchase = require('./eyowoservice.js').purchase,
    payout = require('./eyowoservice.js').payout,
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

    async login(password){
        print(`logging in ${this.phone} with ${password}`);
        // let loginresponse = await login(this.phone, password);
        let [authstatus, reason, token] = await login(this.phone, password);
        this.authorised = authstatus;
        this.token = token;
        await this.update();
        print(this.__repr);
        return [authstatus, reason, token];
    };

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
        await payout(this.phone, this.token, amount);
        this.payouts[i] = amount;
        await this.update();
    }

    async didpurchaselife(index, amount){
        let [success, reason] = await purchase(this.phone, this.token, amount);
        if(success){
            this.lifePurchaseEpochs[index] = amount;
            this.isAlive = true;
            this.limbo = false;
            await this.update();
        } else{
            print(reason);
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

module.exports = {load, clearusers};
