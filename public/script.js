// ============================================
// script.js — OTOP Frontend
// ============================================

async function loadProducts() {
  const container = document.getElementById("products-container");
  container.innerHTML = "<p style='text-align:center;'>กำลังโหลด...</p>";

  try {
    const response = await fetch("/api/products");
    const products = await response.json();

    if (products.length === 0) {
      container.innerHTML = "<p style='text-align:center;'>ยังไม่มีผลิตภัณฑ์</p>";
      return;
    }

    container.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
    ${product.image_path ? `
      <div class="card-image">
        <img src="${product.image_path}" alt="${product.name}">
      </div>
    ` : `
      <div class="card-image no-image">
        <span>🖼️ ไม่มีรูปภาพ</span>
      </div>
    `}
    <div class="card-content">
      <div class="card-header">
        <h3>${product.name}</h3>
        <span class="category-badge">${product.category}</span>
      </div>
      <p class="producer">👥 ${product.producer}</p>
      ${product.contact ? `<p class="contact">📞 ${product.contact}</p>` : ""}
      <div class="card-footer">
    <span class="price">฿ ${product.price.toLocaleString()}</span>
    <div class="card-actions">
      <button class="edit-btn" data-id="${product.id}">✏️ แก้ไข</button>
      <button class="delete-btn" data-id="${product.id}">🗑 ลบ</button>
    </div>
  </div>
    </div>
  `;
      container.appendChild(card);
    });


    attachDeleteHandlers();
    attachEditHandlers();

  } catch (error) {
    container.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  }
}

function attachDeleteHandlers() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const productName = btn.closest(".card").querySelector("h3").textContent;

      if (!confirm(`ยืนยันลบ "${productName}"?`)) return;

      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE"
        });

        if (!response.ok) throw new Error("ลบไม่สำเร็จ");

        loadProducts();

      } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    });
  });
}

// ============================================
// Add Product Form
// ============================================
const addForm = document.getElementById("add-product-form");

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData();
  formData.append("name", document.getElementById("product-name").value);
  formData.append("producer", document.getElementById("product-producer").value);
  formData.append("price", document.getElementById("product-price").value);
  formData.append("category", document.getElementById("product-category").value);
  formData.append("contact", document.getElementById("product-contact").value);

  const fileInput = document.getElementById("product-image");
  if (fileInput.files[0]) {
    formData.append("image", fileInput.files[0]);
  }

  try {
    const response = await fetch("/api/products", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "เพิ่มไม่สำเร็จ");
    }

    addForm.reset();
    loadProducts();
    alert("✅ เพิ่มผลิตภัณฑ์สำเร็จ");

  } catch (error) {
    alert("❌ เกิดข้อผิดพลาด: " + error.message);
  }
});

// ============================================
// Edit Modal Elements
// ============================================
const modal = document.getElementById("edit-modal");
const closeBtn = document.getElementById("modal-close");
const cancelBtn = document.getElementById("cancel-btn");
const editForm = document.getElementById("edit-form");

// ============================================
// Open/Close Modal
// ============================================
function openEditModal(product) {
  // Populate form
  document.getElementById("edit-id").value = product.id;
  document.getElementById("edit-name").value = product.name;
  document.getElementById("edit-producer").value = product.producer;
  document.getElementById("edit-price").value = product.price;
  document.getElementById("edit-category").value = product.category;
  document.getElementById("edit-contact").value = product.contact || "";

  // Show modal
  modal.classList.remove("hidden");
}

function closeEditModal() {
  modal.classList.add("hidden");
  editForm.reset();
}

// ปิดด้วยปุ่ม X และปุ่ม Cancel
closeBtn.addEventListener("click", closeEditModal);
cancelBtn.addEventListener("click", closeEditModal);

// ปิดเมื่อคลิก overlay (พื้นหลัง)
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeEditModal();
  }
});

// ปิดด้วย ESC
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeEditModal();
  }
});

// ============================================
// Submit Edit Form
// ============================================
editForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("edit-id").value;
  const updatedData = {
    name: document.getElementById("edit-name").value,
    producer: document.getElementById("edit-producer").value,
    price: Number(document.getElementById("edit-price").value),
    category: document.getElementById("edit-category").value,
    contact: document.getElementById("edit-contact").value || null
  };

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "แก้ไขไม่สำเร็จ");
    }

    closeEditModal();
    loadProducts();
    alert("✅ บันทึกสำเร็จ");

  } catch (error) {
    alert("❌ " + error.message);
  }
});

// ============================================
// Attach Edit Handlers (call after render)
// ============================================
function attachEditHandlers() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      // Fetch product data
      const response = await fetch(`/api/products/${id}`);
      const product = await response.json();

      openEditModal(product);
    });
  });
}

loadProducts();