const { req,res, application } = require("express");
const express = require("express");
const app = express();

const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(express.urlencoded({extended: true})) 
const MongoClient = require("mongodb").MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static(__dirname + '/public'));
const methodOverride = require('method-override')
app.use(methodOverride('_method'))


require('dotenv').config()

var db;

MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, (err, client)=>{
  if(err) return console.error('MongoDB 연결 실패', err);
    
    db = client.db("todoapp");

    http.listen(process.env.PORT, ()=>{
      console.log("listening on 8080");
    });
  }
);

// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/views/index.ejs')
// })
// app.get('/write', function(req, res){
//   res.sendFile(__dirname + '/views/write.ejs')
// })

app.get('/', (req, res)=>{
  res.render('index.ejs')
});

app.get('/write', (req, res)=>{
  res.render('write.ejs')
});

app.get('/list', (req, res) => {
  db.collection('post').find().toArray((err,result)=>{
    res.render('list.ejs', {posts : result});
  });  
})

app.get('/search', (req, res) => {
  var searchCri = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: ['TITLE','DATE'] // TITLE, DATE 둘다 찾고 싶으면 ['TITLE', 'DATE']
        }
      }
    }
    // { $sort : { _id : -1} }, // 최신순 정렬(현재 DATE 형태가 제대로 안들어가있어 _id 생성일자 순으로 정리)
    // { $limit : 10 }, // 개수표시 제한 
    // { $project : { TITLE : 1, DATE : 1, _id: 0, score: { $meta: "searchScore"} } } // 원하는 값만 보여주고싶을때 1, 비노출 0, (프로젝터 역할)
  ]

  console.log(req.query);
  db.collection('post').aggregate(searchCri).toArray((err,result)=>{
    console.log(result);
    res.render('search.ejs', {posts : result});
  })
})

app.get('/edit/:id', (req, res) => {
  db.collection('post').findOne({_id: parseInt(req.params.id)}, (err,result)=>{
    if (!result) {
      res.status(500).send({massage : '해당 페이지는 없습니다.'});
      return;
    }
    res.render('edit.ejs', { post: result})
  })
});

app.put('/edit', (req, res) => {
  // 폼에 담긴 제목, 날짜데이터를 가지고 db.collection에 업데이트함
  db.collection('post').updateOne({_id: parseInt(req.body.id)}, {$set : {TITLE: req.body.title, DATE: req.body.date}}, function(err,result){
    if (!result) {
      res.status(500).send({message: '연결에 실패했습니다.'});
      return;      
    }
    console.log("수정완료");
    res.redirect('/list')
  })
});


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : 'secret-code', resave : true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res) => {
  res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), (req,res)=>{
  res.redirect('/mypage')
})

app.get('/register', (req, res) => {  
  res.render('register.ejs');  
})

app.get('/mypage', loginCheck, (req,res)=>{
    console.log(req.user);
    res.render('mypage.ejs', {loginInfo : req.user})
});

function loginCheck(req, res, next){
  if (req.user){
    next()
  } else {
    res.send('로그인 해주세요.')    
  }
}

passport.use(new LocalStrategy({
  usernameField: 'emailId',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, (enteredId, enteredPw, done)=>{
  //console.log(enteredId, enteredPw);
  db.collection('login').findOne({id: enteredId }, (err, result)=>{
    if (err) return done(err)

    if (!result) return done(null, false, { message: '존재하지않는 아이디 입니다.' })
    if (enteredPw == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: '비밀번호가 틀렸습니다.' })
    }
  })
}));

passport.serializeUser((user,done)=>{
  done(null, user.id)
});
passport.deserializeUser((emailId, done)=>{
  db.collection('login').findOne({id : emailId}, (err,result)=>{
    done(null, result)  
  })
});
//해야할 것 - 중복체크(저장전 ID가 이미 있는지), id에 알파벳, 숫자만 들어갔는지 체크, 비번 암호화 encrypted
app.post('/register', function(req,res){
  db.collection('login').insertOne( { id : req.body.emailId, pw : req.body.pw }, function(err,result){
    res.redirect('/')
  })
})

// ▼ 누군가 form에서 /add로 post 요청을 하면 (req.body에 게시물 데이터를 가져옴)
app.post('/add', (req, res)=>{ 
  // console.log(req.body.title);
  // console.log(req.body.date);
  // res.send('전송완료');
  // ▼ DB의 counter라는 콜렉션의 postNumber를 찾음.(게시물개수에 따라 1증가 시키는 파일)
  db.collection("counter").findOne({ name: 'postNumber'}, (err,result)=>{ 
    console.log(result.totalPost)
    const totalPostNumber = result.totalPost;
    const contents = {  _id: totalPostNumber + 1, author : req.user._id, TITLE: req.body.title, DATE: req.body.date }
    // ▼ post컬렉션에 게시물이 추가되면 게시물당 _ID를 totalPostNumber로 1씩 증가시키고 제목, 날짜 오브젝트를 추가함
    db.collection("post").insertOne(contents, (err, result)=>{ 
      console.log("saved!");
      // ▼ counter라는 콜렉션에 있는 totalPost라는 항목 또한 1씩 증가시킴(그래야 다음 게시물을 작성할때 counter의 콜렉션에 추가된 개수를 참고하여 ID에 1씩 증가시킴)
      db.collection("counter").updateOne({name: 'postNumber'}, { $inc : {totalPost:1} }, (err,result)=>{ //
        if(err){return console.log('totalPost 연결 실패',err)}
      })
    });
    res.redirect('/list')
  })
});

app.delete('/delete', (req,res) => {
  console.log(req.body)
  req.body._id = parseInt(req.body._id)
  // ▼ 로그인 사용자와 작성자가 일치하는지 체크, 일치해야만 삭제가능
  const deleteData = { _id : req.body._id, author : req.user._id}
  

  // 삭제버튼을 클릭하면 서버에 해당 글을 삭제요청 함
  db.collection('post').deleteOne(deleteData, (err,result)=>{
    console.log(err,'삭제완료');
    if (result) {
      console.log(result)
      res.status(200).send({message : '성공했습니다.'});
    }
  })
})

app.get('/detail/:id', (req,res) => {
  db.collection('post').findOne({_id: parseInt(req.params.id)},(err, result)=>{        
      if (!result) {
        res.status(500).send({massage : '해당 페이지는 없습니다.'});
        return;
      }
      res.render('detail.ejs', {data : result})
    })
});

app.get('/fail', (req, res)=>{
  res.send({message : "오류가 발생했습니다. 다시 접속바랍니다."})
});

app.use('/shop', require('./routs/shop.js'));
app.use('/account/sub', require('./routs/account.js'));

const multer = require('multer');
const storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image')
  },
  filename : function(req, file, cb){
    cb(null, file.originalname)
  }
});

const path = require('path');

const upload = multer({
  storage : storage,
  filefilter : function(req, file,cb){
    const ext = path.extname(file.originalname);
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg'){
      return cb(new Error('PNG, JPG 파일만 업로드해주세요.'))
    }
    cb(null, true)
},
limits:{
  fileSize: 10240 * 10240
}
});

app.get('/upload', function(req,res){
  res.render('upload.ejs');
});

app.post('/upload', upload.array('picture', 10), function(req, res){
  res.send("업로드 완료");
});

app.get('/image/:imageName', (req, res)=>{
  res.sendFile( __dirname + '/public/image/' + req.params.imageName )
})

app.get('/chat', (req, res) => {
  res.render('chat.ejs')
});

io.on('connection', function(){
  console.log('연결되었습니다');
});