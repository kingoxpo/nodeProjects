const odd = "홀수입니다";
const even = "짝수입니다";

exports.module = {
  odd,
  even,
};

setImmediate(() => console.log("hi"));
const hi = setInterval(() => console.log("hello"), 2000);
