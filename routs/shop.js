const router = require('express').Router();


router.get('/shop/shirts', function(req,res){
    res.send('It`s a shirt-selling page')
})
  
router.get('/shop/trousers', function(req,res){
    res.send('It`s a trouser-selling page')
})

module.exports = router;