import multer from "multer";

// Store file in memory (not disk) before upload to cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
