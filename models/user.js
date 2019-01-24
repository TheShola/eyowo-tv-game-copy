let userspace="user:",
    userlist = {},
    clearusers = () =>{
        userlist = {};
    },
    load = async(user, gid) =>{
        //replace with redis interaction
        let u = userlist[user];
        if(!!u) return u;
        u = new User(user);
        userlist[user]= u;
        return u;
    },
    login = require('./eyowoservice.js').login,
    purchase = require('./eyowoservice.js').purchase,
    payout = require('./eyowoservice.js').payout,
    print = (tp) => console.log("USER : " + tp);


class User{
    constructor(phone){
        this.load(phone);
    }

    async load(phone){
        //in memory for now but this is where we interact with redis
        print("loading current status from database");
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
    };

    async update(){
        //this is where we make any changes and then save to redis
        print("Saving changes to database");
    };

    incrscore(delta){
        if(delta ==undefined) this.score++;
        else this.score+=delta;
    }

    async login(password){
        print(`logging in ${this.phone} with ${this.password}`);
        // let loginresponse = await login(this.phone, password);
        let [authstatus, reason, token] = await login(this.phone, password);
        this.authorised = authstatus;
        this.token = token;
        await this.update();
        return [authstatus, reason, token];
    };

    async didattemptongoing(){
        this.attemptedOngoing = true;
        await this.update();
    };

    async didrespondcorrectly(i, delta){
        this.correctepochs.push[i];
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
