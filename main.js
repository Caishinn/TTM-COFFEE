// Global variables
const cart = [];
let orderId = "";

// Add to Cart
function addToCart(itemName, itemPrice, qtyId, itemId) {
  const qty = parseInt(document.getElementById(qtyId).value);
  if (qty > 0) {
    const image = document.querySelector(`#${itemId} img`).src;
    cart.push({ name: itemName, price: itemPrice, qty: qty, image_url: image });

    const button = document.getElementById(itemId).querySelector("button");
    button.innerText = "Added";
    button.disabled = true;

    const itemDiv = document.getElementById(itemId);
    itemDiv.classList.add("added");
    setTimeout(() => itemDiv.classList.remove("added"), 500);

    updateCartDisplay();
  }
}

function removeItemFromCart(index, itemName) {
  cart.splice(index, 1);
  updateCartDisplay();
  resetMenuItemButton(itemName);
}

function updateItemQuantity(index, newQty) {
  if (newQty > 0 && newQty <= 10) {
    cart[index].qty = newQty;
    updateCartDisplay();
  }
}

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty. Please have your order.</p>";
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;
    html += `
      <div class="cart-item">
        <div class="item-info">
          <span>${item.qty} × ${item.name}</span>
          <span class="price">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
        <button class="remove-btn" onclick="removeItemFromCart(${index}, '${item.name}')">Remove</button>
      </div>`;
  });

  html += `
    <div class="cart-total">
      <span>Total:</span>
      <span class="total-price">$${total.toFixed(2)}</span>
    </div>`;

  cartItems.innerHTML = html;
}

// Save order to localStorage for order history
function saveOrderToHistory(order) {
  const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  history.push(order);
  localStorage.setItem('orderHistory', JSON.stringify(history));
}

function checkout() {
  document.querySelector(".menu-section").style.display = "none";
  document.querySelector(".cart-section").style.display = "none";
  document.getElementById("checkout-section").style.display = "block";

  const summary = document.getElementById("order-summary");
  const qrContainer = document.getElementById("qrcode");
  qrContainer.innerHTML = "";

  if (cart.length === 0) {
    summary.innerHTML = "<p>Your cart was empty.</p>";
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  orderId = "MEOW-" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

  let html = `<p><strong>Order ID:</strong> ${orderId}</p>`;
  html += `<p><strong>Date:</strong> ${dateStr} &nbsp;&nbsp; <strong>Time:</strong> ${timeStr}</p><ul>`;
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    html += `<li>${item.qty} × ${item.name} — $${itemTotal.toFixed(2)}</li>`;
  });

  html += `</ul><p><strong>Total:</strong> $${total.toFixed(2)}</p>`;
  summary.innerHTML = html;

  const qrImg = document.createElement('img');
  qrImg.src = './qrcode.jpg';  // local image file or your random QR
  qrImg.alt = 'QR Code';
  qrImg.style.width = '128px';
  qrImg.style.height = '128px';
  qrContainer.appendChild(qrImg);

  // Do NOT save order here
}

// Called when user confirms payment (e.g., after scanning QR)
function confirmPayment() {
  if (cart.length === 0) {
    alert("No items in cart to confirm payment.");
    return;
  }

  const now = new Date();
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
  });

  const order = {
    id: orderId,
    date: now.toISOString(),
    items: [...cart],
    total: total
  };

  saveOrderToHistory(order);

  sendReceiptEmail();

  alert('Payment confirmed! Thank you for your order.');

  // Clear cart after payment
  cart.length = 0;
  updateCartDisplay();

  // Show main menu and hide checkout
  document.querySelector(".menu-section").style.display = "block";
  document.querySelector(".cart-section").style.display = "block";
  document.getElementById("checkout-section").style.display = "none";
}

function goBackToMenu() {
  location.reload();
}

function resetButtons() {
  const items = document.querySelectorAll(".item");
  items.forEach(item => {
    const button = item.querySelector("button");
    button.innerText = "Add to Cart";
    button.disabled = false;
  });
}

function resetMenuItemButton(itemName) {
  const item = document.getElementById(`item-${itemName.toLowerCase()}`);
  if (!item) return;
  const button = item.querySelector("button");
  button.innerText = "Add to Cart";
  button.disabled = false;
}

function downloadReceipt() {
  if (cart.length === 0) {
    alert("No items in cart to generate receipt.");
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  let receipt = `Time to Meow Coffee\n------------------------\n`;
  receipt += `Order ID : ${orderId}\nDate     : ${dateStr}\nTime     : ${timeStr}\n------------------------\n`;
  receipt += `Qty  Item           Total\n------------------------\n`;

  let total = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    receipt += `${item.qty.toString().padEnd(4)} ${item.name.padEnd(14)} $${itemTotal.toFixed(2)}\n`;
  });

  receipt += `------------------------\nTOTAL:               $${total.toFixed(2)}\n`;
  receipt += `------------------------\nTo Get the Cafe, Please Send the Receipt to Telegram or Facebook.\n`;

  const blob = new Blob([receipt], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${orderId}-receipt.txt`;
  link.click();
}

async function downloadPDFReceipt() {
  if (cart.length === 0) {
    alert("No items in cart to generate receipt.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  let y = 20;

  doc.setFontSize(16);
  doc.text("Time to Meow Coffee", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Order ID: ${orderId}`, 20, y);
  y += 6;
  doc.text(`Date: ${dateStr}   Time: ${timeStr}`, 20, y);
  y += 10;

  let total = 0;
  cart.forEach(item => {
    const line = `${item.qty} x ${item.name.padEnd(12)} $${(item.qty * item.price).toFixed(2)}`;
    doc.text(line, 20, y);
    y += 6;
    total += item.qty * item.price;
  });

  doc.setFont("Helvetica", "bold");
  doc.text(`Total: $${total.toFixed(2)}`, 20, y + 6);

  const qrImageUrl = 'qrcode.jpg'; // Random QR code image placeholder
  doc.addImage(qrImageUrl, "PNG", 70, y + 12, 50, 50);

  doc.save(`${orderId}-receipt.pdf`);
}

function sendReceiptEmail() {
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }

  let orders_html = "";
  let total = 0;

  cart.forEach(item => {
    const itemTotal = (item.price * item.qty).toFixed(2);
    total += parseFloat(itemTotal);
    orders_html += `
      <tr>
        <td><img src="${item.image_url}" alt="${item.name}" style="height: 64px;" /></td>
        <td>
          <div>${item.name}</div>
          <div style="color: #888;">QTY: ${item.qty}</div>
        </td>
        <td style="text-align: right;"><strong>$${itemTotal}</strong></td>
      </tr>`;
  });

  const templateParams = {
    order_id: orderId,
    email: "caishin0423@gmail.com",
    orders_html,
    cost_shipping: "0.00",
    cost_tax: "0.00",
    cost_total: total.toFixed(2)
  };

  emailjs.send("Caishin_0423", "receipt", templateParams)
    .then(() => alert("Receipt sent successfully!"))
    .catch(() => alert("Failed to send receipt."));
}

// --- ORDER HISTORY FUNCTIONS ---

function updateClearButtonState() {
  const button = document.getElementById('clear-history-btn');
  const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  if (!button) return;
  if (orders.length === 0) {
    button.disabled = true;
    button.style.opacity = '0.5';
    button.style.cursor = 'not-allowed';
  } else {
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
  }
}

function clearOrderHistory() {
  if (confirm('Are you sure you want to clear all order history?')) {
    localStorage.removeItem('orderHistory');
    loadOrderHistory();
    updateClearButtonState();
    alert('Order history cleared.');
  }
}

function loadOrderHistory() {
  const historyContainer = document.getElementById('order-history-list');
  historyContainer.innerHTML = '';

  const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]').reverse();

  if (orders.length === 0) {
    historyContainer.innerHTML = '<p style="color: #555; text-align:center;">No past orders found.</p>';
    updateClearButtonState();
    return;
  }

  orders.forEach(order => {
    const orderDiv = document.createElement('div');
    orderDiv.classList.add('order-card');

    const itemsHTML = order.items.map(item =>
      `<div class="item-line"><span>${item.qty} × ${item.name}</span><span>$${(item.price * item.qty).toFixed(2)}</span></div>`
    ).join("");

    orderDiv.innerHTML = `
      <div class="order-header">
        <strong>🧾 Order ID: ${order.id}</strong>
        <span class="order-date">${new Date(order.date).toLocaleString()}</span>
      </div>
      <div class="order-items">${itemsHTML}</div>
      <div class="order-total">Total: $${order.total.toFixed(2)}</div>`;

    historyContainer.appendChild(orderDiv);
  });

  updateClearButtonState();
}

// --- MODAL CONTROL ---

document.getElementById('order-history-btn').addEventListener('click', () => {
  loadOrderHistory();
  updateClearButtonState();
  document.getElementById('order-history-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
});

document.getElementById('close-history-btn').addEventListener('click', () => {
  document.getElementById('order-history-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
});

document.getElementById('modal-overlay').addEventListener('click', () => {
  document.getElementById('order-history-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
});
