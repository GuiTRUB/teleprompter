const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return {
        statusCode: 400,
        body: "Requisição deve ser multipart/form-data",
      };
    }

    const boundary = contentType.split("boundary=")[1];
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");

    const parts = bodyBuffer.toString().split(boundary);
    const docxPart = parts.find(p => p.includes("filename=") && p.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));

    if (!docxPart) {
      console.log("❌ Arquivo .docx não encontrado no corpo da requisição.");
      return { statusCode: 400, body: "Arquivo .docx não encontrado." };
    }

    const binaryStart = docxPart.indexOf("PK");
    const docxBuffer = Buffer.from(docxPart.slice(binaryStart), "binary");

    console.log("📥 Iniciando conversão do .docx com mammoth...");
    const result = await mammoth.convertToHtml({ buffer: docxBuffer });
    const html = result.value;

    if (!html || html.trim() === "") {
      console.log("⚠️ O conteúdo HTML convertido está vazio.");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Letra vazia após conversão do .docx." }),
      };
    }

    const finalPath = "/tmp/latest.html";
    fs.writeFileSync(finalPath, html, "utf8");

    console.log("✅ Letra salva com sucesso.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Letra salva com sucesso." }),
    };
  } catch (err) {
    console.error("❌ Erro ao processar .docx:", err);
    return {
      statusCode: 500,
      body: `Erro ao processar: ${err.message}`,
    };
  }
};