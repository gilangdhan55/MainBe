import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.join(__dirname, "../../uploads/absen");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 🔥 Ganti storage ke memoryStorage()
const storage = multer.memoryStorage(); 

const uploadImg = multer({
    storage, // Ganti dari diskStorage ke memoryStorage
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
    fileFilter: (_, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("File harus berupa foto (JPG, PNG, WEBP)!"));
        }
        cb(null, true);
    },
});

export default uploadImg;
