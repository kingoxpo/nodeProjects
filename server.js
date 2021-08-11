const { request, response } = require("express");
const express = require("express");
const app = express();
app.use(express.urlencoded({extended: true})) 
const MongoClient = require("mongodb").MongoClient;
app.set('view engine', 'ejs')

var db;

MongoClient.connect("mongodb+srv://aiden:tnsqhr8516@cluster0.lowzd.mongodb.net/todoapp?retryWrites=true&w=majority", { useUnifiedTopology: true }, function (err, client) {
  if(err) return console.error('MongoDB 연결 실패', err);
    
    db = client.db("todoapp");

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

app.get('/write', function(request, response){
  response.sendFile(__dirname + '/write.html')
})

// ▼ 누군가 form에서 /add로 post 요청을 하면 (request.body에 게시물 데이터를 가져옴)
app.post('/add', function(request, response){ 
  // console.log(request.body.title);
  // console.log(request.body.date);
  response.send('전송완료');
  // ▼ DB의 counter라는 콜렉션의 postNumber를 찾음.(게시물개수에 따라 1증가 시키는 파일)
  db.collection("counter").findOne({ name: 'postNumber'}, function(err,result){ 
    console.log(result.totalPost)
    const totalPostNumber = result.totalPost;

    // ▼ post컬렉션에 게시물이 추가되면 게시물당 _ID를 totalPostNumber로 1씩 증가시키고 제목, 날짜 오브젝트를 추가함
    db.collection("post").insertOne({ _id: totalPostNumber + 1, TITLE: request.body.title, DATE: request.body.date},function (err, result) { 
      console.log("saved!");
      // ▼ counter라는 콜렉션에 있는 totalPost라는 항목 또한 1씩 증가시킴(그래야 다음 게시물을 작성할때 counter의 콜렉션에 추가된 개수를 참고하여 ID에 1씩 증가시킴)
      db.collection("counter").updateOne({name: 'postNumber'}, { $inc : {totalPost:1} }, function(err,result){ //
        if(err){return console.log('totalPost 연결 실패',err)}
      })
    });
  })
});

app.get('/list', function(request, response){
  db.collection('post').find().toArray(function(err,result){
    console.log(result);
    response.render('list.ejs', {posts : result});
  });  
})

app.delete('/delete', function(request,response){
  console.log(request.body)
  request.body._id = parseInt(request.body._id)
  // 삭제버튼을 클릭하면 서버에 해당 글을 삭제요청 함
  db.collection('post').deleteOne(request.body, function(err,result){
    console.log(err,'삭제완료');
    response.status(200).send({message : '성공했습니다.'});
  })
})

app.get('/detail/:id', function(request,response){
  db.collection('post').findOne({_id: parseInt(request.params.id)},function(err, result){
    response.render('detail.ejs', {data : result})
  })
});
