class quiz{
    constructor(){
        // this.client = (require('redis')).createClient();
        let sq = require('../sq2.json');
        this.frontend = sq.frontend;
        this.backend = sq.backend;
        this.size = this.backend.length;
        this.curr = -1;
    }



    * _sub(){
        while(this.hasnext()){
            //this runs infinitely, remove modulus to return to normal
            // let index = (this.curr%this.size).toString();
            this.curr++;
            let index = (this.curr).toString();//normal version
            let toyield = this.frontend.quiz[index];
            toyield.index = this.curr;
            yield toyield;
        }
    }

    next(){
        return this._sub().next();
    }

    isstarted(){
        return this.curr != -1;
    }


    hasnext(){
        return this.curr < this.size-1;// comment this and uncomment this for infinite behaviour
        // return true; // disable this and uncomment the previous line to return to normal behaviour
    }

    isCorrect(index, answer){
        return this.backend.quiz[index].correct == answer;
    }

    restart(){
        this.curr = -1;
    }

    getquestionat(index){
        return this.backend.quiz[index];
    }

    getCurrentQuestionBackend(){
        return JSON.stringify( this.backend.quiz[this.curr] , null, 2);
    }

    getNextQuestionBackend(){
     return JSON.stringify( this.backend.quiz[this.curr+1] , null, 2);
    }

    getCurrentQuestion(){
        let toreturn =  this.backend.quiz[this.curr];
        if(typeof toreturn !== 'undefined'){
            toreturn.index = this.curr;
            return toreturn;
        } else{
            return {
                "index" : "-1",
                "text"  : "",
                "correct" : "na"
            }
        }
    }
}

module.exports = new quiz();

