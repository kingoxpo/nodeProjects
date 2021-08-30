const { request,response } = require("express");
const express = require("express");
const app = express();
app.use(express.urlencoded({extended: true})) 
const MongoClient = require("mongodb").MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static(__dirname + '/public'));
const methodOverride = require('method-override')
app.use(methodOverride('_method'))


var db;

MongoClient.connect("mongodb+srv://aiden:tnsqhr8516@cluster0.lowzd.mongodb.net/todoapp?retryWrites=true&w=majority", { useUnifiedTopology: true }, (err, client)=>{
  if(err) return console.error('MongoDB 연결 실패', err);
    
    db = client.db("todoapp");

    app.listen(8080, ()=>{
      console.log("listening on 8080");
    });
  }
);

// app.get('/', function(request, response){
//   response.sendFile(__dirname + '/views/index.ejs')
// })
// app.get('/write', function(request, response){
//   response.sendFile(__dirname + '/views/write.ejs')
// })

app.get('/', (request, response)=>{
  response.render('index.ejs')
});

app.get('/write', (request, response)=>{
  response.render('write.ejs')
});

// ▼ 누군가 form에서 /add로 post 요청을 하면 (request.body에 게시물 데이터를 가져옴)
app.post('/add', (request, response)=>{ 
  // console.log(request.body.title);
  // console.log(request.body.date);
  // response.send('전송완료');
  response.redirect('/list')
  // ▼ DB의 counter라는 콜렉션의 postNumber를 찾음.(게시물개수에 따라 1증가 시키는 파일)
  db.collection("counter").findOne({ name: 'postNumber'}, (err,result)=>{ 
    console.log(result.totalPost)
    const totalPostNumber = result.totalPost;

    // ▼ post컬렉션에 게시물이 추가되면 게시물당 _ID를 totalPostNumber로 1씩 증가시키고 제목, 날짜 오브젝트를 추가함
    db.collection("post").insertOne({ _id: totalPostNumber + 1, TITLE: request.body.title, DATE: request.body.date}, (err, result)=>{ 
      console.log("saved!");
      // ▼ counter라는 콜렉션에 있는 totalPost라는 항목 또한 1씩 증가시킴(그래야 다음 게시물을 작성할때 counter의 콜렉션에 추가된 개수를 참고하여 ID에 1씩 증가시킴)
      db.collection("counter").updateOne({name: 'postNumber'}, { $inc : {totalPost:1} }, (err,result)=>{ //
        if(err){return console.log('totalPost 연결 실패',err)}
      })
    });
  })
});

app.get('/list', (request, response)=>{
  db.collection('post').find().toArray((err,result)=>{
    console.log(result);
    response.render('list.ejs', {posts : result});
  });  
})

app.delete('/delete', (request,response)=>{
  console.log(request.body)
  request.body._id = parseInt(request.body._id)
  // 삭제버튼을 클릭하면 서버에 해당 글을 삭제요청 함
  db.collection('post').deleteOne(request.body, (err,result)=>{
    console.log(err,'삭제완료');
    response.status(200).send({message : '성공했습니다.'});
  })
})

app.get('/detail/:id', (request,response)=>{
  db.collection('post').findOne({_id: parseInt(request.params.id)},(err, result)=>{        
      if (!result) {
        response.status(500).send({massage : '해당 페이지는 없습니다.'});
        return;
      }
      response.render('detail.ejs', {data : result})
    })
});

app.get('/edit/:id', (request, response)=>{
  db.collection('post').findOne({_id: parseInt(request.params.id)}, (err,result)=>{
    if (!result) {
      response.status(500).send({massage : '해당 페이지는 없습니다.'});
      return;
    }
    response.render('edit.ejs', { post: result})
  })
});

app.put('/edit', (request, response)=>{
  // 폼에 담긴 제목, 날짜데이터를 가지고 db.collection에 업데이트함
  db.collection('post').updateOne({_id: parseInt(request.body.id)}, {$set : {TITLE: request.body.title, DATE: request.body.date}}, function(err,result){
    if (!result) {
      response.status(500).send({message: '연결에 실패했습니다.'});
      return;      
    }
    console.log("수정완료");
    response.redirect('/list')
  })
});


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : 'secret-code', resave : true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (request,response)=>{
  response.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), (request,response)=>{
  response.redirect('/')
})

app.get('/mypage', loginCheck, function(request,response){
  response.render('mypage.ejs')
})

function loginCheck(request, response, next){
  if (request.user){
    next()
  } else {
    response.send('로그인 해주세요.')
  }
}


passport.use(new LocalStrategy({
  usernameField: 'emailId',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (enteredId, enteredPw, done) {
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

passport.serializeUser(function(user,done){
  done(null, user.id)
});
passport.deserializeUser(function(아이디, done){
  done(null, {})
});

app.get('/fail', (request, response)=>{
  response.send({message : "일시적으로 오류가 발생했습니다. 다시 접속바랍니다."})
});