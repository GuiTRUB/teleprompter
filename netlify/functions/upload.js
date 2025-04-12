const fs = require("fs");
const path = require("path");
const multiparty = require("multiparty");
const mammoth = require("mammoth");
const stream = require("stream");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    const bufferChunks = [];

    form.on("part", (part) => {
      if (!part.filename) {
        part.resume();
        return;
      }

      part.on("data", (chunk) => {
        bufferChunks.push(chunk);
      });

      part.on("end", async () => {
        try {
          const docxBuffer = Buffer.concat(bufferChunks);
          const result = await mammoth.convertToHtml({ buffer: docxBuffer });
          const html = result.value;

          if (!html || html.trim() === "") {
            return resolve({
              statusCode: 200,
              body: JSON.stringify({ message: "Letra vazia após conversão." }),
            });
          }

          const finalPath = "/tmp/latest.html";
          fs.writeFileSync(finalPath, html, "utf8");

          return resolve({
            statusCode: 200,
            body: JSON.stringify({ message: "Letra salva com sucesso." }),
          });
        } catch (err) {
          console.error("❌ Erro ao processar .docx:", err);
          return resolve({
            statusCode: 500,
            body: `Erro ao processar: ${err.message}`,
          });
        }
      });
    });

    form.on("error", (err) => {
      console.error("Erro no multiparty:", err);
      resolve({
        statusCode: 500,
        body: "Erro no processamento do formulário.",
      });
    });

    const buffer = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);

    form.parse(readable, event.headers);
  });
};