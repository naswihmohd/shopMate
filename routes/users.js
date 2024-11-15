var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers')
const Razorpay = require('razorpay');

var instance = new Razorpay({ key_id: 'rzp_test_OWUsO8dxhDkzv1', key_secret: 'K1xoTA4YYldonRt3y1uDrXrk' })

const varifylog=(req,res,next)=>{
  if(req.session.userloggedIn){
    next();
  }else{
    res.redirect('/login')
  }
}

const varifyOrder=async(req,res,next)=>{
  let count= await userHelpers.cartCount(req.session.user._id)
  if(count!=0){
   next()
  }else{
   res.redirect('/')
  }
 }


/* GET home page. */
router.get('/', async function (req, res, next) {
var user=req.session.user
products = await productHelpers.getallProducts()
let cartCount=null;
if (user){
  cartCount= await userHelpers.cartCount(user._id)
}
  res.render('user/index',{user,cartCount,products});
});

router.get('/shopping', async function (req, res, next) {
  var user=req.session.user
  let cartCount=null;
  if (user){
    cartCount= await userHelpers.cartCount(user._id)
  }
  products = await productHelpers.getallProducts()
  res.render('user/shopping', { products,user,cartCount });
})

router.get('/shop', async function (req, res, next) {
  var user=req.session.user
  products = await productHelpers.getallProducts()
  res.render('user/shop', { products ,user});
});

router.get('/login', (req, res) => {
  res.render('user/login')
})

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  console.log('data',req.body)
  userHelpers.doSignup(req.body, (response) => {
    req.session.userloggedIn = true;
    req.session.user = response.user;
    res.redirect('/');
  })
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userloggedIn = true;
      req.session.user = response.user;
      res.redirect('/')
    } else {
      req.session.logErr = "Invalid Username or Password";
      res.redirect('/login');
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.destroy();
  res.redirect('/')
})

router.get('/profile',(req,res)=>{
  user=req.session.user;
  console.log('use',user)
  res.render('user/profile',{user})
})

router.get('/edit-profile',(req,res)=>{
  user=req.session.user;
  res.render('user/edit-profile',{user})
})

router.post('/edit-profile',(req,res)=>{
  user=req.session.user;
  userHelpers.updateProfile(user._id,req.body).then(()=>{
    res.redirect('/profile')
    if(req.files.Image){
      let image= req.files.Image
      image.mv('./public/user-images/'+user._id+".jpg");
    }
  })
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log('id',req.params.id)
  userHelpers.addCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.get('/cart',varifylog, async function (req, res, next) {
  user=req.session.user;
  let products= await userHelpers.getCartProduct(user._id)
  let totalAmount=0;
  let count=await userHelpers.cartCount(user._id)
 
  if(count!=0){
   totalAmount= await userHelpers.getTotalAmount(user._id)
  }
   res.render('user/cart',{products,user,totalAmount})
});

router.post('/change-quantity',(req,res,next)=>{

  userHelpers.changeQuantity(req.body).then(async(response)=>{
    response.totalAmount=await userHelpers.getTotalAmount(req.body.userId)
    res.json(response)
  })
})

router.post('/remove-products',(req,res,next)=>{
  userHelpers.removeProducts(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/chackout',varifylog,varifyOrder, async(req,res)=>{
  let user=req.session.user
  let totalAmount=await userHelpers.getTotalAmount(req.session.user._id)
  let products= await userHelpers.getCartProduct(user._id)
  res.render('user/chackout',{user,products,totalAmount})
})

router.post('/chackout', async(req,res)=>{
  let products= await userHelpers.getProductsList(req.body.userId)
  let totalAmount=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalAmount).then(async(orderId)=>{
    if(req.body['payment-method']=='COD'){
      res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorPay(orderId,totalAmount).then((response)=>{
        res.json(response)
      })
    }
  })
})

router.get('/order-success',varifylog,(req,res)=>{
  let user=req.session.user;
  res.render('user/order-success',{user})
})

router.get('/ordered-list',varifylog,async(req,res)=>{
  let user=req.session.user;
  let orderedList=await userHelpers.getOrderList(user._id)
  res.render('user/ordered-list',{orderedList,user})
})

router.get('/ordered-products/:id',varifylog, async (req,res)=>{
  let user=req.session.user;
  let orderProducts=await userHelpers.getOrderProducts(req.params.id)
  console.log(orderProducts)
  res.render('user/ordered-products',{orderProducts,user})
})

router.post('/varify-payment',(req,res)=>{
  userHelpers.varifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
      console.log('success')
     
    })
  }).catch((err)=>{
    res.json({status:false})
    console.log(err)
  })
  
  })


router.get('/about', function (req, res, next) {
  res.render('user/about');
});

router.get('/contact', function (req, res, next) {
  res.render('user/contact');
});

module.exports = router;
