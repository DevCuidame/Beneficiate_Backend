const fs = require("fs");
const path = require("path");

async function buildImage(dir, folder, base64) {
  try {
    if (!base64 || typeof base64 !== "string") {
      throw new Error("La imagen en Base64 es inválida o no está definida");
    }

    const match = base64.match(/^data:image\/(\w+);base64,/);
    if (!match) {
      throw new Error("Formato de Base64 no válido");
    }

    const extension = match[1];
    const decoding = base64.replace(/^data:image\/\w+;base64,/, "");

    // Validar tamaño máximo (Ej: 5MB)
    const buffer = Buffer.from(decoding, "base64");
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error("La imagen supera el tamaño máximo de 10MB");
    }

    const uploadPath = process.env.IMAGE_UPLOAD_PATH || "src/uploads";
    const directoryPath = path.join(uploadPath, folder);
    const filePath = path.join(directoryPath, `${dir}`);

    await fs.promises.mkdir(directoryPath, { recursive: true });

    await fs.promises.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    throw new Error("Error al construir la imagen: " + error.message);
  }
}

async function deleteImage(filePath) {
  try {
    await fs.promises.access(filePath); 
    await fs.promises.unlink(filePath);
  } catch (error) {
    throw new Error("Error al eliminar la imagen: " + error.message);
  }
}

module.exports = {
  buildImage,
  deleteImage,
};
