
var db = require('../config/connection');
var collection = require('../config/collection');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const Razorpay = require('razorpay');

var instance = new Razorpay({ key_id: 'rzp_test_OWUsO8dxhDkzv1', key_secret: 'K1xoTA4YYldonRt3y1uDrXrk' })


module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(() => {
                let user = db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
                resolve(user);
            })
        })
    },

    doLogin: (userData) => {
        let loginStatus = false;
        let response = {}

        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response)

                    } else {
                        console.log('failed')
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },

    addCart: (proId, useId) => {
        prodId = new ObjectId(proId)
        userId = new ObjectId(useId)

        let prdObj = {
            item: prodId,
            quantity: 1

        }

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: userId })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: userId, 'products.item': prodId }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then(() => {
                        resolve()
                    })

                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: userId }, {
                        $push: { products: prdObj }
                    }).then((response) => {
                        resolve(response)
                    })
                }

            } else {
                let cartObj = {
                    user: userId,
                    products: [prdObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }

        })
    },

    cartCount: (userId) => {
        useId = new ObjectId(userId)

        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: useId })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    getCartProduct: (useId) => {
        userId = new ObjectId(useId)

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: userId }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    changeQuantity: (data) => {
        count = parseInt(data.count)
        quantity = parseInt(data.quantity)


        return new Promise((resolve, reject) => {

            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(data.cart) }, {
                    $pull: { products: ({ item: new ObjectId(data.product) }) }
                }).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(data.cart), 'products.item': new ObjectId(data.product) }, {
                    $inc: { 'products.$.quantity': count }
                }).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },

    removeProducts: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cart) }, {
                $pull: { products: ({ item: new ObjectId(details.product) }) }
            }).then((response) => {
                resolve({ remove: true })
            })
        })
    },

    getTotalAmount: (userId) => {


        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                deliveryDetails: {
                    firstName: order.firstName,
                    lastName: order.lastName,
                    companyName: order.companyName,
                    Address: order.Address,
                    Place: order.Place,
                    Post: order.Post,
                    District: order.District,
                    Country: order.Country,
                    Pincode: order.Pincode,
                    Mobile: order.Mobile,
                    Email: order.Email,
                },
                userId: new ObjectId(order.userId),
                products: products,
                totalAmount: total,
                paymentMethod: order['payment-method'],
                status: status,
                Date: new Date
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((data) => {
                resolve(data.insertedId)
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) })
            })
        })

    },

    getProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            resolve(cart.products)
        })
    },

    getOrderList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orderedList = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: new ObjectId(userId) }).toArray()
            resolve(orderedList)
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: new ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(products)
        })
    },

    updateProfile:(proId,profile)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:new ObjectId(proId)},{
                $set:{
                    Name:profile.Name,
                    Address:profile.Address,
                    Country:profile.Country,
                    Profession:profile.Profession,
                    Mobile:profile.Mobile,
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    generateRazorPay: (orderId,totalAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalAmount*100,
                currency: "INR",
                receipt: ""+orderId
            };
            instance.orders.create(options,function(err,order){
                if(order){
                resolve(order)
                }else{
                    console.log(err)
                }
            })
        })
    },

    varifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto=require('crypto');
            var hmac=crypto.createHmac('sha256','K1xoTA4YYldonRt3y1uDrXrk');

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')

            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    
    changePaymentStatus:(orderId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderId)},{
                $set:{
                    status:'Placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }
}

