let readline = require('readline');
class GameClock{


    constructor(epochs, epochlength){
        this.epochs = epochs;
        this.epochLength = epochlength*1e3;
        this.currEpoch = -1;
        this.startTime;
        this.deadline;
        this.ih;
    }

    tick(){
        this.advanceEpoch();
        this.beginEpoch();
    }

    advanceEpoch(){
       return this.currEpoch ;
    }

    beginEpoch(){
        this.startTimer();
    }

    getCurrEpoch(){
        return this.currEpoch;
    }

    isCurrEpoch(i){
        return i == this.currEpoch;
    }

    elapsedTime(){
       let re = this.isrunning?
            process.hrtime(this.startTime)[0]: 0;
        return re;
    }

    startTimer(){
        this.startTime = new Date;
        this.deadline = new Date(this.startTime.valueOf() +this.epochLength);
    }


    printElapsed(delay){
        this.ih = setInterval( (clock)=> {
            if(this.isRunning()){
                readline.clearLine(process.stdout);
                process.stdout.write(
                    `CLOCK : ${ "..".repeat(Math.floor(this.elapsedTime()/1e3)%5)}:`+
                    `${Math.floor((this.epochLength - this.elapsedTime())/1e3)}\r`);
            }else{
                readline.clearLine(process.stdout);
                process.stdout.write("CLOCK :\n Countdown complete\n");
                clearInterval(clock.ih);
            }},1000, this);
    }

    isRunning(){
        if(!!this.deadline) return new Date().valueOf() < this.deadline.valueOf();
        else false;
    }

    elapsedTime(){
        return new Date() - this.startTime;
    }
}

module.exports = GameClock;
