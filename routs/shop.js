const router = require('express').Router();


router.get('/cosmetics', function(req,res){
    res.send('화장품 페이지')
})
  
router.get('/luxury', function(req,res){
    res.send('럭셔리 페이지')
})

module.exports = router;