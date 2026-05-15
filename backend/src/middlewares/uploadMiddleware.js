import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";


const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =
      process.env.UPLOAD_PATH || path.resolve(process.cwd(), "../shared_data/cv");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const cvFileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF and Word documents are allowed."), false);
  }
};

export const uploadCV = multer({
  storage: cvStorage,
  fileFilter: cvFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});


/**
 * Use memoryStorage so we can manually write the file to shared_data/video
 * after we have the answerId to build a deterministic filename.
 */
export const uploadAnswerVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "video/webm",
      "video/mp4",
      "video/quicktime",
      "video/x-matroska",
      "video/ogg",
      "application/octet-stream", // some browsers send webm as this
    ];
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      file.originalname.match(/\.(webm|mp4|mov|mkv|ogv)$/i)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid video file type: ${file.mimetype}. Accepted: webm, mp4, mov, mkv, ogv.`
        ),
        false
      );
    }
  },
});
