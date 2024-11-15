const {MongoClient} =require('mongodb')

const state={
    db:null
}

const url= 'mongodb://127.0.0.1:27017';
const client= new MongoClient(url);
const dbname='Shopping-Cart'

const connect= async(cb)=>{
    try{
        await client.connect();
        const dbs=client.db(dbname)
        state.db=dbs;
        return cb();
    }catch(err){
        return cb(err)
    }
}
const get =()=>state.db

module.exports={connect,get}