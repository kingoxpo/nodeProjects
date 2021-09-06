const router = require('express').Router();

function loginCheck(req, res, next){
    if (req.user){
      next()
    } else {
      res.send('로그인 해주세요.')    
    }
  }

// router.use('/game',loginCheck); // 특정 router에만 check할 수 있음
router.use(loginCheck); // 모든 router에 check할 수 있음

router.get('/order-history', function(req, res){
    res.send('order-history page');
});

router.get('/wishlist', function(req, res){
    res.send('wishlist page');
});

module.exports = router;