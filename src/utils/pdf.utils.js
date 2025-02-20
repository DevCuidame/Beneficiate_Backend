const fs = require("fs");
const path = require("path");

async function buildPDF(fileName, folder, base64) {
  try {
    if (!base64 || typeof base64 !== "string") {
      throw new Error("El PDF en Base64 es inválido o no está definido");
    }

    const match = base64.match(/^data:application\/pdf;base64,/);
    if (!match) {
      throw new Error("Formato de Base64 no válido para PDF");
    }

    const decoding = base64.replace(/^data:application\/pdf;base64,/, "");

    const buffer = Buffer.from(decoding, "base64");
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error("El PDF supera el tamaño máximo de 10MB");
    }

    const uploadPath = process.env.PDF_UPLOAD_PATH || "src/uploads";
    const directoryPath = path.join(uploadPath, folder);
    const filePath = path.join(directoryPath, fileName);

    await fs.promises.mkdir(directoryPath, { recursive: true });
    await fs.promises.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    throw new Error("Error al construir el PDF: " + error.message);
  }
}

async function deletePDF(filePath) {
  try {
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);
  } catch (error) {
    throw new Error("Error al eliminar el PDF: " + error.message);
  }
}

module.exports = {
  buildPDF,
  deletePDF,
};
