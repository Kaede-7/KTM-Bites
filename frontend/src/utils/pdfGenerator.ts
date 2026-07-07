import { type OrderData } from "../api/orders";
import mascotIcon from "../assets/ktm-bites-transparent-notext.png";
import { alertDialog } from "../components/ConfirmDialog";

/**
 * Generates and downloads a beautifully structured, premium PDF order report for a KTM Bites order.
 * Opens a full-fidelity preview page first and gives the user an action button to trigger high-fidelity PDF printing.
 */
export const downloadOrderPDF = (order: OrderData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    void alertDialog("Please allow popups to preview your order report.", { title: "Popups blocked" });
    return;
  }

  const formattedDate = new Date(order.created_at).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const discount = order.discount_amount !== undefined 
    ? Number(order.discount_amount) 
    : (Number(order.subtotal) + Number(order.delivery_fee) - Number(order.total));

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: left;">
        <span style="font-weight: 600; color: #2a2420;">${item.name}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: center; color: #7a7067;">
        Rs. ${item.price}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: center; color: #7a7067;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: right; font-weight: 700; color: #2a2420;">
        Rs. ${item.subtotal}
      </td>
    </tr>
  `
    )
    .join("");

  // Clean branding block matching KTM-Bites navbar using local mascotIcon asset and classes
  const logoHtml = `
    <div class="navbar-logo">
      <img src="${mascotIcon}" alt="KTM Bites Logo" class="navbar-logo-icon" />
      <span class="navbar-logo-wordmark">KTM<em>Bites</em></span>
    </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Order Report Preview - ${order.order_id}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', 'Segoe UI', -apple-system, sans-serif;
          color: #2a2420;
          margin: 0;
          padding: 0;
          background-color: #f5f3f0;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-card {
          max-width: 800px;
          margin: 40px auto;
          background-color: #fff;
          padding: 40px;
          border-radius: 24px;
          border: 1px solid #ebdcd0;
          box-shadow: 0 10px 40px rgba(0,0,0,0.03);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #f28b46;
          padding-bottom: 20px;
          margin-bottom: 35px;
        }

        /* ── Navbar Logo Styling Replica ────────────────── */
        .navbar-logo {
          display: flex;
          align-items: flex-end;
          gap: 0;
          text-decoration: none;
        }

        .navbar-logo-icon {
          height: 60px;
          width: auto;
          object-fit: contain;
          margin: 0 -12px -16px -20px;
          flex-shrink: 0;
        }

        .navbar-logo-wordmark {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 23px;
          font-weight: 800;
          color: #f28b46;
          background: linear-gradient(135deg, #f28b46 0%, #d95e14 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.04em;
          line-height: 1;
          user-select: none;
          padding-left: 4px;
          padding-right: 6px;
          margin-bottom: 3px;
        }

        .navbar-logo-wordmark em {
          font-style: italic;
        }

        .invoice-title {
          text-align: right;
        }

        .invoice-title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #e06c22;
          letter-spacing: -0.03em;
        }

        .invoice-title p {
          margin: 6px 0 0 0;
          color: #7a7067;
          font-size: 14px;
          font-weight: 600;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .meta-section h3 {
          margin: 0 0 12px 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #e06c22;
          font-weight: 800;
        }

        .meta-section p {
          margin: 6px 0;
          font-size: 14px;
          color: #4b5563;
        }

        .meta-section strong {
          color: #2a2420;
          font-weight: 700;
        }

        .table-container {
          margin-bottom: 35px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background-color: #faf8f5;
          color: #e06c22;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.08em;
          padding: 12px;
          border-bottom: 2px solid #ebdcd0;
        }

        .totals-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .totals-table {
          width: 320px;
        }

        .totals-table td {
          padding: 8px 12px;
          font-size: 14px;
        }

        .totals-table tr.grand-total td {
          border-top: 2px dashed #f28b46;
          font-size: 18px;
          font-weight: 800;
          color: #e06c22;
          padding-top: 14px;
        }

        .notes-card {
          background-color: #faf8f5;
          border-left: 4px solid #f28b46;
          padding: 16px;
          border-radius: 12px;
          margin-top: 24px;
        }

        .notes-card h4 {
          margin: 0 0 6px 0;
          font-size: 12px;
          text-transform: uppercase;
          color: #e06c22;
          letter-spacing: 0.06em;
          font-weight: 800;
        }

        .notes-card p {
          margin: 0;
          font-size: 13px;
          color: #57534e;
          font-style: italic;
        }

        .footer {
          text-align: center;
          border-top: 1px solid #ebdcd0;
          padding-top: 25px;
          margin-top: 60px;
          font-size: 12px;
          color: #8b7d72;
        }

        .footer p {
          margin: 4px 0;
        }

        @page {
          size: portrait;
          margin: 0; /* completely hides browser header & footer like 'about:blank' */
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 2cm;
            background-color: #fff;
          }
          .invoice-card {
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            border-radius: 0;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <!-- Sticky Preview Header Actions -->
      <div class="no-print" style="position: sticky; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #ebdcd0; padding: 12px 40px; display: flex; justify-content: space-between; align-items: center; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.02); font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="material-symbols-rounded" style="color: #e06c22; font-size: 20px;">visibility</span>
          <span style="font-size: 14px; color: #4a4035; font-weight: 700; letter-spacing: 0.2px;">Report Preview Mode</span>
        </div>
        <button onclick="window.print()" style="display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f28b46 0%, #e06c22 100%); color: white; border: none; padding: 10px 20px; border-radius: 14px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(242, 139, 70, 0.22); outline: none;">
          <span class="material-symbols-rounded" style="font-size: 18px; font-weight: 800;">download</span>
          Download PDF
        </button>
      </div>

      <div class="invoice-card">
        <div class="header">
          <div class="logo">
            ${logoHtml}
          </div>
          <div class="invoice-title">
            <h1>ORDER REPORT</h1>
            <p>Order Code: <strong style="color: #e06c22;">${order.order_id}</strong></p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-section">
            <h3>Delivery Info</h3>
            <p><strong>Customer Name:</strong> ${order.full_name}</p>
            <p><strong>Contact Number:</strong> ${order.phone}</p>
            <p><strong>Address:</strong> ${order.address}, ${order.city}</p>
            ${order.landmark ? `<p><strong>Landmark:</strong> ${order.landmark}</p>` : ""}
          </div>
          <div class="meta-section" style="text-align: right;">
            <h3>Report Details</h3>
            <p>Report Date: <strong>${formattedDate}</strong></p>
            <p>Payment Mode: <strong>${order.payment_method.toUpperCase()}</strong></p>
            <p>Payment Status: <strong style="color: #10b981;">${(order.payment_status || "completed").toUpperCase()}</strong></p>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 45%;">Item Name</th>
                <th style="text-align: center; width: 20%;">Price</th>
                <th style="text-align: center; width: 15%;">Quantity</th>
                <th style="text-align: right; width: 20%;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div class="totals-container">
          <table class="totals-table">
            <tr>
              <td style="color: #8b7d72; font-weight: 500;">Cart Subtotal</td>
              <td style="text-align: right; font-weight: 700; color: #2a2420;">Rs. ${order.subtotal}</td>
            </tr>
            <tr>
              <td style="color: #8b7d72; font-weight: 500;">Standard Delivery</td>
              <td style="text-align: right; font-weight: 700; color: #2a2420;">Rs. ${order.delivery_fee}</td>
            </tr>
            ${
              discount > 0
                ? `
            <tr>
              <td style="color: #ea580c; font-weight: 600;">Rank Discount ${order.rank_applied ? `(${order.rank_applied})` : ""}</td>
              <td style="text-align: right; font-weight: 700; color: #ea580c;">- Rs. ${discount.toFixed(2)}</td>
            </tr>
            `
                : ""
            }
            <tr class="grand-total">
              <td>Grand Total</td>
              <td style="text-align: right;">Rs. ${order.total}</td>
            </tr>
          </table>
        </div>

        ${
          order.notes
            ? `
          <div class="notes-card">
            <h4>Cooking & Delivery Notes</h4>
            <p>"${order.notes}"</p>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p style="font-weight: 700; color: #e06c22; font-size: 13px; margin-bottom: 6px;">Thank you for your order!</p>
          <p><strong>KTM Bites Pvt. Ltd.</strong> — Kathmandu, Nepal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
