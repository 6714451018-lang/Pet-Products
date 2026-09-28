const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  loadProducts,
  getProductById,
  addProduct,
  deleteProduct,
  updateProduct
} = require("./storage");
 
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
 
// ============================================
// 🖼 Multer Setup
// ============================================
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `product-${Date.now()}${ext}`;
    cb(null, filename);
  }
});
 
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
 
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error("ไฟล์ต้องเป็น jpg, png, หรือ webp เท่านั้น"));
    }
  }
});
 
// ============================================
// Routes
// ============================================
 
app.get("/api/products", (req, res) => {
  res.json(loadProducts());
});
 
app.get("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = getProductById(id);
  if (!product) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });
  res.json(product);
});
 
// POST with image upload
app.post("/api/products", upload.single("image"), (req, res) => {
  try {
    const { name, producer, price, category, contact } = req.body;
 
    if (!name || !producer || !price || !category) {
      return res.status(400).json({
        error: "กรุณาระบุ name, producer, price, category"
      });
    }
 
    // ถ้ามีรูป → เก็บ path
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
 
    const newProduct = addProduct({
      name,
      producer,
      price: Number(price),
      category,
      contact,
      image_path: imagePath
    });
 
    res.status(201).json(newProduct);
 
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
 
app.delete("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = getProductById(id);
  if (!product) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });
 
  // delete image file
  if (product.image_path) {
    // ✅ FIX: เดิมใช้ตัวแปร filePath ที่ไม่มีอยู่จริง → ReferenceError → server ส่ง HTML 500
    const imagePath = path.join(__dirname, "public", product.image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`ลบไฟล์รูปภาพ: ${imagePath}`);
    }
  }
 
  deleteProduct(id);
  res.json({ message: "ลบสำเร็จ", deleted: product });
});
 
app.put("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, producer, price, category, contact } = req.body;
 
  if (!name || !producer || !price || !category) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }
 
  const updatedProduct = updateProduct(id, {
    name, producer, price: Number(price), category, contact
  });
 
  // ✅ FIX: เดิมเช็ค !updated ซึ่งเป็นตัวแปรที่ไม่มีอยู่จริง → ReferenceError → HTML 500
  if (!updatedProduct) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });
  res.json(updatedProduct);
});
 
// ============================================
// 404 ของ API → ตอบเป็น JSON (ไม่ใช่หน้า HTML)
// ============================================
app.use("/api", (req, res) => {
  res.status(404).json({ error: `ไม่พบ endpoint: ${req.method} ${req.originalUrl}` });
});
 
// ============================================
// Error handler → ตอบเป็น JSON เสมอ
// กัน error "Unexpected token '<' ... is not valid JSON" ฝั่ง frontend
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
 
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? "ไฟล์ใหญ่เกิน 5 MB"
      : err.message;
    return res.status(400).json({ error: msg });
  }
 
  res.status(500).json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});