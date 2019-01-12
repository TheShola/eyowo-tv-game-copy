class quiz{
    constructor(){
        // this.client = (require('redis')).createClient();
        let sq = require('../sq.json');
        this.frontend = sq.frontend;
        this.backend = sq.backend;
        this.size = this.backend.length;
        this.curr = 0;
    }

    * _sub(){
        while(this.hasnext()){
            //this runs infinitely, remove modulus to return to normal
            // let index = (this.curr%this.size).toString();
            let index = (this.curr).toString();//normal version
            let toyield = this.frontend.quiz[index];
            toyield.index = this.curr;
            this.curr++;
            yield toyield;
        }
    }

    next(){
        return this._sub().next();
    }

    hasnext(){
        return this.curr < this.size;
        // return true; // disable this and uncomment the previous line to return to normal behaviour
    }

    isCorrect(index, answer){
        return this.backend.quiz[index].correct == answer;
    }

}

module.exports = quiz;

