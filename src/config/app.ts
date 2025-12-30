// Application configuration
export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  uploadPath: process.env.UPLOAD_PATH || "./uploads",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  downloadLinkExpiryMinutes: parseInt(process.env.DOWNLOAD_LINK_EXPIRY_MINUTES || "15"), // 15 minutes default
};

