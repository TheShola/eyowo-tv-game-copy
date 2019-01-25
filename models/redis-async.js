let redis = require('redis'),
    client = redis.createClient(),
    {promisify} = require('util'),
    get = promisify(client.get).bind(client),
    exists = promisify(client.exists).bind(client),
    incr = promisify(client.incr).bind(client),
    hmget = promisify(client.hmget).bind(client),
    hmset = promisify(client.hmset).bind(client),
    hget = promisify(client.hget).bind(client),
    hset = promisify(client.hset).bind(client),
    rpush = promisify(client.rpush).bind(client),
    hincrby = promisify(client.hincrby).bind(client),
    generateId =  async (key)=>{
    let id;
    try{
        id  = await incr(key);
    } catch(e) {
        console.log(e);
    }
    return id;
    },

    setObj = async(key, obj)=>{
        let res;
        try{
            res = await hmset(key, obj);
        }catch(e){
            console.log(e);
        }
        return res == "OK";
    },
    getObj = async (key)=>{
        let res;
        try{
            res = await  hmget(key);
        } catch(e) {
            console.log(e);
        }
        return res;
    },
    getId = getObj,

    getObjField = async (key, field)=>{
        let res;
        try{
            res = await hget(key, field);
        } catch(e){
            console.log(e);
        }
        return res;
    },
    setObjField = async(key, field, value)=>{
        let res;
        try{
            res = await hset(key, field, value);
        }catch(e){
            console.log(e);
        }
        return res;
    },
    has = async(key) =>{
        let res;
        try{
            res = await exists(key);
        }catch(e){
            console.log(e);
        }
        return res;
    },
    append = async(key, val)=>{
        let res ;
        try{
            res = await rpush(key, val);
        } catch(e){
            console.log(e);
        }
        return res;
    },
    incrObjField = async(key, field, delta)=>{
        let res;
        try{
            res = await hincrby(key, field, delta);
        } catch(e){
            console.log(e);
        }
        return res;
    },
    addOne = async(key) =>{
        let res;
        try{
            res = await incr(key)
        } catch(e){
            console.log(e);
        }
        return res;
    };

module.exports = { generateId, incrObjField, append, has, setObjField, getObjField, setObj, getObj, getId }
