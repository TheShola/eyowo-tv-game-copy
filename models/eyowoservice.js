let accept =["2348033021938", "2348055025977", "2348034086111"],
    authfail = ["you do not have an eyowo account", "your passcode was wrong"],
    balancefail = ["insufficient funds","user has sufficient balance for purchase"],
    purchasefail = ["transaction failed", "transaction succeeded"],
    pass = "1234",
    ok = "ok",
    token = "****",
    randbool = () => {return Math.random() >= 0.5},
    boolint = (bool) =>{return bool? 1 : 0},
    print = (tp) => console.log("EYOWO SERVICE: " + tp),

    checkbalance = async(username, token, price) =>{
        print(` checking if ${username} has sufficient balance`);
        let hasbalance = true,//randbool(),
            message = balancefail[boolint(hasbalance)];
        print(message);
        return[hasbalance, message];
    },

    login = async(username, pin, price) =>{
        let correctuser = accept.includes(username);
        let correctpin = pin==pass;
        print(username , pin);
        if(correctuser & correctpin){
            print("eyowo account exists");
            let [hasbalance, message] = await checkbalance(username, pin, price);
            if(hasbalance){
                print("logged in successfully");
                return [true, ok ,token]; //true and the token
            }else{
                return[hasbalance, message,"" ];
            }
        }else{
            print("log in failed");
            print( authfail[boolint(correctpin)]);
            return [false, authfail[boolint(correctpin)] , ""];
        }
    },

    purchase = async(username, token, amount) => {
        print(`${username} would like to purchase a life at ${amount}`);
        let [hasbalance, message] = await checkbalance(username, token, amount);
        if(hasbalance){
            let success = true;
            print( `${success ? "success" : "failure" }`);
            return [success, purchasefail[boolint(success)]];
        }
        else{
            return[hasbalance, message];
        }
    },

    payout = async(username, token, amount)=> {
        print(`Payment of ${amount} has been made to ${username}`);
    };

module.exports = {login, purchase, payout};
