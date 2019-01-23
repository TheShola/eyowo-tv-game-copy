let keypress = require('keypress'),
    print = (str) =>{
        str = str==undefined ? "": str;
        console.log(`\n${str}`);
    },
    welcome=()=>print("Welcome to the test suite!"),
    instr=()=>print(`press Enter to run the next test \n
press c then Enter at any point to cancel\n`),
    starstring = "*".repeat(12),
    testdivide = (msg) => {print(starstring + msg + starstring )},
    teststart = ()=> testdivide("A TEST IS STARTING"),
    testend = ()=>  testdivide("ALL TESTS HAVE RUN"),
    done =() => testdivide("Done"),
    selectiontype = (t) => {
        t==1 ?
            print("you have chosen sequential testing") :
            print("You have chosen to select which tests to run")
    },
    cancelChosen = () => print("You have chosen to cancel tests"),
    exit = ()=> {  process.exit(0);};

class Test{
    constructor(name, runnable){
        this.name = name;
        this.runnable = runnable;                                                              ;
    }

    run(){
        teststart();
        console.log(starstring.repeat(4))
        console.log(`now running test "${this.name}"`);
        console.log(starstring.repeat(4))
        this.runnable();
    }
}

class TestArray{
    constructor(){
        this.tests = [];
        this.curr = 0;
    }

    add(test){
        this.tests.push(test);
    }

    get(i){
        return this.tests[i];
    }

    listTests(){
        return this.tests.reduce(
            (sum, value, index , arr) => {
                let name = `Test ${index +1}: `;
                if ( index < arr.length -1) return `${sum}${name}${value.name}\n`;
                else return  `${sum}${name}${value.name}\n`;
            },
            "List of tests to run\n" );
    }

    resetIter(){
        this.curr = 0;
    }

    hasnext(){
        return this.curr < this.size();
    }

    next(){
        let {value,}  = this._sub().next();
        return value;
    }

    *_sub(){
        while(this.hasnext()) yield  this.tests[this.curr++];
    }

    isempty(){
        return this.tests.length ==0;
    }

    size(){
        return this.tests.length;
    }

    progress(){
        print( `We have run ${this.curr} tests there are ${this.size() - this.curr} tests left` );
    }
}


class TestRunner{

    constructor(testinit, cleanup){
        this.tests = new TestArray() ;
        this.testinit = testinit == undefined ? ()=>{console.log('')}: testinit;
        this.cleanup = cleanup == undefined ? ()=>{console.log('')}: cleanup;
    }

    run(){

        welcome();
        if( this.tests.isempty()){
            done();
            return;
        }

        print(this.tests.listTests());

        instr();

        keypress(process.stdin);
        process.stdin.on('keypress', (ch, key)=>{
            if(key.name=="c" ){
                cancelChosen();
                // this.cleanup();
                done();
                exit();
            } else if( this.tests.hasnext()){
                // this.testinit();
                this.tests.next().run();
            } else{
                // this.cleanup();
                testend();
                done();
                exit();
            }
        });
    }

    addTest(test){
        this.tests.add(test);
    }

    add(name, runnable){
        this.tests.add(new Test(name, runnable));
    }
}

module.exports = { Test, TestArray, TestRunner};
