var db = require ('../config/connection')
var collection= require ('../config/collection')
const { ObjectId } = require('mongodb')


module.exports={
    addProduct: (products,callback)=>{

        products.Price= parseInt(products.Price)

        db.get().collection('products').insertOne(products).then((data)=>{
            callback(data.insertedId)
        })
    },
    
    getallProducts:()=>{
        return new Promise( async (resolve,reject)=>{
           let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
           resolve(products)
        })
    },

    deleteProduct:(proId)=>{
        const prodId= new ObjectId(proId);
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:prodId}).then((response)=>{
                resolve(response)
            })
        })
    },

    getProduct:(product)=>{
        const produ=  new ObjectId(product)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:produ}).then((product)=>{
                resolve(product);
            })
        })
    },
    
    updateProduct:(proId,prdetails)=>{
        const prodId= new ObjectId(proId)
        prdetails.Price=parseInt(prdetails.Price)
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:prodId},{
                $set:{
                    Name:prdetails.Name,
                    Category:prdetails.Category,
                    Price:prdetails.Price,
                    Description:prdetails.Description
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    getAllOrders:()=>{
        return new Promise((resolve,reject)=>{
            let orders=db.get().collection(collection.ORDER_COLLECTION).find().toArray()
                resolve(orders)
        })
    }
}