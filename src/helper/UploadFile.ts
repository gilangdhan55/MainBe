import path from "path";
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

export { UploadAbsent };
