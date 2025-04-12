
const multiparty = require("multiparty");
const fs = require("fs");
const mammoth = require("mammoth");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const form = new multiparty.Form();
  const data = await new Promise((resolve, reject) => {
    form.parse(event, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

  const filePath = data.files.file[0].path;
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value
    .replace(/\(([^()]+)\)/g, '<span class="highlight">($1)</span>')
    .replace(/\[([^\[\]]+)\]/g, '<span class="title">[$1]</span>');

  fs.writeFileSync("/tmp/latest.html", html);
  return { statusCode: 200, body: "Arquivo processado." };
};
