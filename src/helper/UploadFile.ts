import path from "path";
import sharp from "sharp";
import fs from "fs";
import {UploadResponseAbsen} from "../interface/VisitInterface";


const UploadAbsent = (file: Express.Multer.File, username: string): UploadResponseAbsen => {
    if (!file) return { status: false, message: "File wajib diunggah!" };

    const uploadDir = path.join(__dirname, "../../uploads/absen", username);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const now = new Date();
    const dateStr = now
        .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
        .replace(/[^\d]/g, "")
        .slice(0, 12);

    const fileExt = path.extname(file.originalname);
    const filename = `${username}_${dateStr}${fileExt}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    if(!fs.existsSync(filePath)) return { status: false, message: "File gagal diunggah!" };

    return { status: true, message: "File berhasil diunggah!", path: filePath, filename };
};

const UploadAbsentVisit = async (
    file: Express.Multer.File,
    username: string,
    customerCode: string
  ): Promise<UploadResponseAbsen> => {
    const uploadDir = path.join(__dirname, "../../uploads/absen_visit", username, "/absen_visit_mulai");
  
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  
    const now = new Date();
    const dateStr = now
      .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
      .replace(/[^\d]/g, "")
      .slice(0, 12);
   
    const filename = `${username}-${dateStr}-${customerCode}.webp`; // ubah ke jpg biar lebih mudah dikompres
    const filePath = path.join(uploadDir, filename);
  
    try {
      // Resize dan compress
      const compressedBuffer = await sharp(file.buffer)
        .resize({ width: 800 }) // resize lebar max 800px (atau bisa kamu atur)
        .jpeg({ quality: 70 }) // kompres JPEG quality 70%
        .toBuffer();
  
      fs.writeFileSync(filePath, compressedBuffer);
  
      if (!fs.existsSync(filePath)) {
        return { status: false, message: "File gagal diunggah!" };
      }
  
      return {
        status: true,
        message: "File berhasil diunggah!",
        path: filePath,
        filename,
      };
    } catch (err) {
      console.error("Upload error:", err);
      return { status: false, message: "Terjadi kesalahan saat mengolah gambar!" };
    }
  };
  

export { UploadAbsent, UploadAbsentVisit };
