const { odd, even } = require("./var.js");

function checkOddOrEvev(number) {
  if (number % 2) {
    return odd;
  } else {
    return even;
  }
}

exports.module = checkOddOrEvev;
