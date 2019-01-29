let accept =["2348033021938", "2348055025977", "2348034086111","2349095801772"],
    ownnumber = accept[3],
    authfail = ["you do not have an eyowo account", "your passcode was wrong"],
    balancefail = ["insufficient funds","user has sufficient balance for purchase"],
    purchasefail = ["transaction failed", "transaction succeeded"],
    pass = "1234",
    ok = "ok",
    token = "****",
    randbool = () => {return Math.random() >= 0.5},
    boolint = (bool) =>{return bool? 1 : 0},
    print = (tp) => console.log("EYOWO SERVICE: " + tp),
    appKey = "3c4a30ba96bb315e836f7d6b6d726ffa",
    appSecret = "50e4e28db9e1dfba526d3cb28ddd9ff62b5f14705d63c629680914be961e1d81",
    environment = 'staging',
    ownToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjNGZiYTkyOWVmMjAxMzc4Yzc5ZjFiMyIsIm1vYmlsZSI6IjIzNDcwMzM4OTk3NzUiLCJpYXQiOjE1NDg3Mjg5NzgsImV4cCI6MTU0ODgxNTM3OH0.ZcvqcC4tHCpeF4aLj8h0XlthdrxAsI7pvXO3DA7vZDc",
    factor = 'sms',
    client =  new ((require('../lib/eyowo.js').Client))({appKey, appSecret, environment}),
    exists = async(mobile) =>{
        try{
            let exists = await client.Auth.validateUser({mobile});
            return exists.success;
        } catch(e){
            print(e);
        }
    },
    checkbalance = async(mobile, accessToken) =>{
        print(` checking the balance of ${mobile}`);
        let toret = await client.Users.getBalance( {mobile, accessToken});
        if(toret.error ==undefined) return toret.data.user.balance/100;
        else return -1;
    },
    sendToken = async(mobile) =>{
        let response = await client.Auth.authenticateUser({mobile, factor});
        return response.success;
    },
    login = async(mobile, passcode, price) =>{
            let authresponse = await client.Auth.authenticateUser({mobile, factor, passcode});
            return authresponse;
    },

    purchase = async(token, amount) => {
        print(`would like to purchase a life at ${amount}`);
        let response = await client.Users.transferToPhone({ "mobile" :ownnumber, "accessToken" : token, "amount" : amount});
        return response;
    },

    payout = async(mobile, amount)=> {
        print(`Payment of ${amount} has been made to ${mobile}`);
        let response = await client.Users.transferToPhone({mobile, "accessToken" : ownToken , amount});
        return response;
    };

module.exports = {login, purchase, payout, exists, sendToken, checkbalance};
