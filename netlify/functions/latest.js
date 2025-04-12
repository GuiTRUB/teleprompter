
const fs = require("fs");

exports.handler = async function(event, context) {
  try {
    const html = fs.readFileSync("/tmp/latest.html", "utf8");
    return { statusCode: 200, headers: { "Content-Type": "text/html" }, body: html };
  } catch (e) {
    return { statusCode: 404, body: "Nenhuma letra encontrada." };
  }
};
