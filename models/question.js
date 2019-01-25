let questionidkey = "questionid",
    questionnamespace = "question:",
    db = require('./redis-async.js');


class Question{

    constructor(){

    }

    async add( text, responses correct){
        //validations on input should be run here
        let id =  questionnamespace + await db.getId(questionidkey);

        

    };

    async get(){

    };

    async getId(){

    };

}
