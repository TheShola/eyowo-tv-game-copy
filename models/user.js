let pin = "1234",
    userlist = {},
    load = (user) =>{
        //replace with redis interaction
        let u = userlist[user];
        if(!!u) return u;
        u = new User(user);
        userlist[user]= u;
        return u;
       },
    clearusers = () =>{
        userlist = {};
    };
class User{
    constructor(phone){
        this.load(phone);
    }

    load(phone){
        //in memory for now but this is where we interact with redis
        this.phone = phone;
        this.deathEpochs = [];
        this.lifePurchaseEpochs = [];
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

    update(){
        //this is where we make any changes and then save to redis
    };

    incrscore(delta){
        if(delta ==undefined) this.score++;
        else this.score+=delta;
    }

    login(password){
        this.eyowoToken = "****";
        //this.authorized will be set based on interaction with the eyowo API. We'll sort the details later
        this.authorised = password==pin;
        return this.authresponse();
    };

    authresponse(){
        return { "authorised" : this.authorised, "token" : this.gettoken() };
    };

    gettoken(){
        if(!!this.token) return this.token;
        else if( this.authorised ) return this.generateToken();
        return null;
    };

    didattemptongoing(){
        this.attemptedOngoing = true;
    };

    didrespondcorrectly(i, delta){
        this.correctepochs.push[i];
        this.incrscore(delta);
    }

    didfailquestion(index){
        this.isAlive = false;
        this.limbo = true;
        this.deathEpochs.push(index);
    };

    didtimeout(i){
        this.timeoutepochs.push(i);
        this.isAlive = false;
        this.limbo = false;
    }

    didwinpayout(i, amount){
        this.payouts[i] = amount;
    }

    didpurchaselife(index){
        this.lifePurchaseEpochs.push(index);
        this.isAlive = true;
        this.limbo = false;
    };

    finalkill(index){
        this.deathEpochs.push(index);
        this.isAlive = false;
        this.limbo = false;
    };


    generateToken(){
        //write code to generate random token
        return '*****';
    };

    //info
    status(){
        if(this.isAlive && !this.limbo) return "Alive";
        else if(!this.isAlive && this.limbo) return "Pending";
        else if(this.isAlive && this.limbo) return "Pending";
        else return "Dead";
    }

    isDead(){
        return this.status() == "Dead";
    }

    isPending(){
        return this.status == "Pending";
    }

    isAlive(){
        return this.status =="Alive";
    }

    finalDeathIndex(){
        return this.isAlive ? -1 : this.lifePurchaseEpochs[ this.lifePurchaseEpochs.length -1];
    };

    hasPurchasedLife(){
        return this.lifePurchaseEpochs.length != 0;
    };

    numLivesPurchased(){
        return this.lifePurchaseEpochs.length;
    };

    numDeaths(){
       return this.deathEpochs.length;
    };
}

module.exports = {load, clearusers};
