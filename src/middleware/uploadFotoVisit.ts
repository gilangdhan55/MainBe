import multer from "multer";
import fs from "fs";
import path from "path";


const uploadDir = path.join(__dirname, "../../uploads/absen");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file (bisa ke folder 'uploads' atau memori)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const username = req.body.username || "unknown"; // Default kalau username kosong
        const userDir = path.join(uploadDir, username); // Contoh: uploads/absen/SPG004/

        // Buat folder jika belum ada
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir); // Simpan di folder user masing-masing
    },
    filename: (req, file, cb) => {
        const username = req.body.username || "unknown";
        const now = new Date();
        const dateStr = now
            .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) // Pastikan pakai zona waktu lokal
            .replace(/[^\d]/g, "") // Ambil hanya angka (250321095128)
            .slice(0, 12); // Potong sesuai format PHP (6 digit tanggal + 6 digit jam)

        const fileExt = path.extname(file.originalname); // Ambil ekstensi
        cb(null, `${username}_${dateStr}${fileExt}`); // Contoh: SPG004_250321095128.jpg
    },
});

// Middleware multer
const uploadImg = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("File harus berupa foto (JPG, PNG, WEBP)!"));
        }
        cb(null, true);
    },
});


export default uploadImg;
