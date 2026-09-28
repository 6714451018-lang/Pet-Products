const Database = require("better-sqlite3");

const db = new Database("data/products.db");
console.log("✅ เปิด database สำเร็จ");

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
    )
`);
console.log("✅ สร้างตาราง products สำเร็จ");

const count = db.prepare("SELECT COUNT(*) as n FROM products").get();
console.log(`📦 มีสินค้าในตาราง: ${count.n} ตัว`);

if (count.n === 0) {
  const insert = db.prepare(
    "INSERT INTO products (name, price) VALUES (?, ?)"
  );
  insert.run("ทุเรียนหมอนทอง", 280);
  insert.run("มังคุด", 120);
  insert.run("เงาะโรงเรียน", 80);
  console.log("✅ เพิ่มข้อมูลเริ่มต้น 3 ตัว");
}

const allProducts = db.prepare("SELECT * FROM products").all();
console.log("\n📋 สินค้าทั้งหมด:");
console.log(allProducts);

const cheapProducts = db.prepare("SELECT * FROM products WHERE price < ?").all(200);
console.log("\n💰 สินค้าราคาต่ำกว่า 200:");
console.log(cheapProducts);

db.close();
console.log("\n✅ ปิด database");