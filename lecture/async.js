const fs = require("fs");

//비동기
fs.readFile("./readme.txt", (err, data) => {
  if (err) {
    throw err;
  }
  console.log("1번", data.toString());
});
fs.readFile("./readme.txt", (err, data) => {
  if (err) {
    throw err;
  }
  console.log("2번", data.toString());
});
fs.readFile("./readme.txt", (err, data) => {
  if (err) {
    throw err;
  }
  console.log("3번", data.toString());
});
fs.readFile("./readme.txt", (err, data) => {
  if (err) {
    throw err;
  }
  console.log("4번", data.toString());
});

//함수 수정하여 비동기처리(비효율+문제가 발생 할 수 있음)
let data = fs.readFileSync("./readme.txt");
console.log("1번", data.toString());
data = fs.readFileSync("./readme.txt");
console.log("2번", data.toString());
data = fs.readFileSync("./readme.txt");
console.log("3번", data.toString());
data = fs.readFileSync("./readme.txt");
console.log("4번", data.toString());
