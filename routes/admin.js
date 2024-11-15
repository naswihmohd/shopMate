var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers')
var adminHelpers=require('../helpers/admin-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getallProducts().then((products) => {
    res.render('admin/all-products', { products, admin: true });
  })
});

router.get('/add-products', function (req, res, next) {
  res.render('admin/add-products', { admin: true });
});

router.post('/add-products', (req, res) => {
  console.log(req.body)

  productHelpers.addProduct(req.body, (id) => {
    const image = req.files.Image

    image.mv('./public/product-images/' + id + '.jpg', (err, data) => {
      if (!err) {
        res.render('admin/add-products', { admin: true });
      } else {
        console.log(err);
      }
    })
  })

})

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin",)

  })

})

router.get('/edit-product/:id', async (req, res) => {
  var product = await productHelpers.getProduct(req.params.id)
  res.render('admin/edit-product', { product, admin: true })
})

router.post('/edit-product/:id', (req, res) => {

  let Id = req.params.id;

  productHelpers.updateProduct(Id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + Id + ".jpg");
    }

  })

})

router.get('/all-orders', async (req, res) => {
  var orders = await productHelpers.getAllOrders()
  console.log('^^^', orders)
  res.render('admin/all-orders', { orders, admin: true })
})

router.get('/view-order-products/:id', async (req, res) => {
  var orderProducts = await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products', { orderProducts, admin: true })
})

router.get('/user-profile/:id', async (req, res) => {
  var user = await adminHelpers.getUser(req.params.id)
  res.render('admin/user-profile', {user})
})

router.get('/all-users', async(req,res)=>{
  var user= await adminHelpers.getAllUsers()
  res.render('admin/all-users',{user})
})



module.exports = router;
