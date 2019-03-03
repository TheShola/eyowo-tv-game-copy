let accept =["2348033021938", "2348055025977", "2348034086111","2349095801772"],
    ownnumber = "2349095801772",
    authfail = ["you do not have an eyowo account", "your passcode was wrong"],
    balancefail = ["insufficient funds","user has sufficient balance for purchase"],
    purchasefail = ["transaction failed", "transaction succeeded"],
    pass = "1234",
    ok = "ok",
    token = "****",
    randbool = () => {return Math.random() >= 0.5},
    boolint = (bool) =>{return bool? 1 : 0},
    print = (tp) => console.log("EYOWO SERVICE: " + tp),
    appKey = "55294b8990be3fe82565800f8b2747b8",
    appSecret = "dc31ecefad8db612997fcebb321d93e482a8fbd7ae8a604ab2444c646f3ac0dd",
    environment = 'production',
    ownToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjNTAyY2ZmNGQyYmEzNTQwMzk2YTU5NyIsIm1vYmlsZSI6IjIzNDkwOTU4MDE3NzIiLCJpYXQiOjE1NDg3NTgyNzEsImV4cCI6MTU0ODg0NDY3MX0.tV95MpWTjlgUJN1NqBnnKCrCLaKHstTAOv-lnY9Pc9s",
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

module.exports = { login, purchase, payout, exists, sendToken, checkbalance};
