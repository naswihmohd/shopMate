var db = require ('../config/connection')
var collection= require ('../config/collection')
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');


module.exports={

    getUser:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:new ObjectId(id)}).then((user)=>{
                resolve(user)
            })
        })
    },
    getAllUsers:()=>{
        return new Promise((resolve,reject)=>{
            var users=db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    }
    
}