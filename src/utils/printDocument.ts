/**
 * Printable Document Utility for Garasbaley Hospital
 * Safe inside iframes, sandboxed browsers, and local dev environments.
 */

export interface PrintPatientCardData {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  contact: string;
  emergencyContact: string;
  address: string;
  allergies?: string;
  medicalHistory?: string;
  registrationDate?: string;
}

export interface PrintAppointmentSlipData {
  id: string;
  patientName: string;
  patientId?: string;
  contact?: string;
  doctorName: string;
  departmentName: string;
  date: string;
  timeSlot: string;
  fee: number;
  status: string;
  notes?: string;
}

export interface PrintInvoiceData {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientId: string;
  patientContact?: string;
  date: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  items: Array<{
    id: string;
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export const renderFullHtml = (title: string, content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #059669;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: #047857;
      color: #ffffff;
      font-weight: 900;
      font-size: 22px;
      padding: 8px 14px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }
    .hospital-title {
      font-size: 18px;
      font-weight: 900;
      color: #064e3b;
      text-transform: uppercase;
      letter-spacing: -0.2px;
    }
    .hospital-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
    }
    .hospital-contact {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-green { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-red { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      background: #f8fafc;
      margin-bottom: 14px;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }

    .label {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .val-highlight {
      font-size: 15px;
      font-weight: 900;
      color: #047857;
    }
    .val-blood {
      font-size: 15px;
      font-weight: 900;
      color: #b91c1c;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
    }

    .footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #64748b;
    }
    .signature-line {
      width: 180px;
      border-top: 1px solid #475569;
      text-align: center;
      padding-top: 4px;
      font-weight: bold;
      color: #334155;
    }

    .print-actions {
      margin-bottom: 16px;
      display: flex;
      gap: 8px;
    }
    .btn-print {
      background: #059669;
      color: white;
      border: none;
      padding: 8px 16px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
    }

    @media print {
      body { padding: 12px; font-size: 12px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print print-actions">
    <button class="btn-print" onclick="window.print()">🖨️ Print Document</button>
  </div>
  ${content}
</body>
</html>
`;

export const getPatientCardHtml = (pat: PrintPatientCardData): string => `
  <div class="header">
    <div class="brand">
      <div class="logo-badge">GB</div>
      <div>
        <h1 class="hospital-title">GARASBALEY HOSPITAL</h1>
        <p class="hospital-subtitle">Emergency, Surgical & Specialized Medical Center</p>
        <p class="hospital-contact">Garasbaley Main Road, Mogadishu, Somalia | Tel: +252 61 5000000 / +252 61 7000000</p>
      </div>
    </div>
    <div style="text-align: right;">
      <span class="badge badge-green">Official Patient Card</span>
      <div style="font-family: monospace; font-weight: 900; font-size: 14px; margin-top: 4px; color: #047857;">MRN: ${pat.id}</div>
    </div>
  </div>

  <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
    <div class="grid-4">
      <div>
        <div class="label">Patient Full Name</div>
        <div class="val-highlight">${pat.name}</div>
      </div>
      <div>
        <div class="label">Age / Gender</div>
        <div class="val">${pat.age} yrs / ${pat.gender}</div>
      </div>
      <div>
        <div class="label">Blood Group</div>
        <div class="val-blood">${pat.bloodGroup}</div>
      </div>
      <div>
        <div class="label">Registration Date</div>
        <div class="val">${pat.registrationDate || new Date().toISOString().split('T')[0]}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="grid-2">
      <div>
        <div class="label">Contact Phone Number</div>
        <div class="val">${pat.contact}</div>
      </div>
      <div>
        <div class="label">Emergency Contact & Next of Kin</div>
        <div class="val">${pat.emergencyContact || 'None recorded'}</div>
      </div>
    </div>
    <div style="margin-top: 10px;">
      <div class="label">Residential Address</div>
      <div class="val">${pat.address}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card" style="border-color: #fed7aa; background: #fffbeb;">
      <div class="label" style="color: #9a3412;">Known Allergies & Drug Reactions</div>
      <div class="val" style="color: #7c2d12;">${pat.allergies || 'No known drug allergies reported.'}</div>
    </div>
    <div class="card" style="border-color: #bfdbfe; background: #f0fdf4;">
      <div class="label" style="color: #166534;">Chronic Conditions / Medical Notes</div>
      <div class="val" style="color: #14532d;">${pat.medicalHistory || 'No prior chronic conditions recorded.'}</div>
    </div>
  </div>

  <div class="card" style="margin-top: 12px; font-size: 11px; color: #475569;">
    <strong>Notice for Patient:</strong> Please present this card at the Reception Desk and Triage Station upon every hospital visit. Valid across OPD, Inpatient, Laboratory, and Maternity departments.
  </div>

  <div class="footer">
    <div>
      Printed at: ${new Date().toLocaleString()} (Reception Terminal)<br>
      GB Hospital Electronic Medical Records (EMR v2.5)
    </div>
    <div class="signature-line">
      Receptionist / Registrar Signature
    </div>
  </div>
`;

export const getAppointmentSlipHtml = (apt: PrintAppointmentSlipData): string => `
  <div class="header">
    <div class="brand">
      <div class="logo-badge">GB</div>
      <div>
        <h1 class="hospital-title">GARASBALEY HOSPITAL</h1>
        <p class="hospital-subtitle">Outpatient Department (OPD) Consultation Token</p>
        <p class="hospital-contact">Garasbaley Main Road, Mogadishu, Somalia | Tel: +252 61 5000000</p>
      </div>
    </div>
    <div style="text-align: right;">
      <span class="badge badge-blue">Appointment Slip</span>
      <div style="font-family: monospace; font-weight: 900; font-size: 13px; margin-top: 4px; color: #1e40af;">SLIP #${apt.id}</div>
    </div>
  </div>

  <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
    <div class="grid-2">
      <div>
        <div class="label">Patient Name</div>
        <div class="val-highlight">${apt.patientName}</div>
        ${apt.patientId ? `<div style="font-size: 11px; color: #64748b;">MRN: ${apt.patientId}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div class="label">Consultation Status</div>
        <span class="badge ${apt.status === 'Confirmed' ? 'badge-green' : apt.status === 'Cancelled' ? 'badge-red' : 'badge-blue'}">${apt.status}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="grid-3">
      <div>
        <div class="label">Attending Doctor</div>
        <div class="val" style="color: #065f46;">${apt.doctorName}</div>
      </div>
      <div>
        <div class="label">Department / Clinic</div>
        <div class="val">${apt.departmentName}</div>
      </div>
      <div>
        <div class="label">Consultation Fee</div>
        <div class="val-highlight">$${Number(apt.fee).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
      <div>
        <div class="label">Scheduled Date</div>
        <div class="val" style="font-size: 14px; font-weight: 800;">${apt.date}</div>
      </div>
      <div>
        <div class="label">Arrival Time Slot</div>
        <div class="val" style="font-size: 14px; font-weight: 800; color: #047857;">${apt.timeSlot}</div>
      </div>
    </div>

    ${
      apt.notes
        ? `
      <div style="margin-top: 10px; padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0;">
        <div class="label">Visit Notes / Reason</div>
        <div style="font-size: 12px; color: #334155;">${apt.notes}</div>
      </div>
    `
        : ''
    }
  </div>

  <div class="card" style="font-size: 11px; color: #475569;">
    <strong>Instructions for OPD Visit:</strong>
    <ol style="margin-left: 18px; margin-top: 4px;">
      <li>Please arrive 15 minutes before your scheduled time slot (${apt.timeSlot}).</li>
      <li>Present this appointment slip at the Triage desk for vital signs check.</li>
      <li>For cancellations or rescheduling, call +252 61 5000000 in advance.</li>
    </ol>
  </div>

  <div class="footer">
    <div>
      Generated on: ${new Date().toLocaleString()} (Reception Station)<br>
      Garasbaley Hospital Management System
    </div>
    <div class="signature-line">
      Receptionist Desk Stamp
    </div>
  </div>
`;

export const getInvoiceReceiptHtml = (invoice: PrintInvoiceData): string => {
  const itemsHtml = invoice.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${item.description}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.category}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">$${item.amount.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div class="header">
      <div class="brand">
        <div class="logo-badge">GB</div>
        <div>
          <h1 class="hospital-title">GARASBALEY HOSPITAL</h1>
          <p class="hospital-subtitle">General Medical, Surgical & Maternity Hospital</p>
          <p class="hospital-contact">Garasbaley Main District Road, Mogadishu, Somalia | Tel: +252 61 5000000</p>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-green">Official Receipt</span>
        <div style="font-family: monospace; font-weight: 900; font-size: 13px; margin-top: 4px; color: #047857;">${invoice.invoiceNumber}</div>
      </div>
    </div>

    <div class="card" style="background: #f8fafc; border-color: #cbd5e1;">
      <div class="grid-2">
        <div>
          <div class="label">Patient Name</div>
          <div class="val-highlight">${invoice.patientName}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Patient ID: ${invoice.patientId} | Phone: ${invoice.patientContact || 'N/A'}</div>
        </div>
        <div style="text-align: right;">
          <div class="label">Invoice Status</div>
          <span class="badge ${invoice.status === 'Paid' ? 'badge-green' : 'badge-red'}">${invoice.status}</span>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Issued: ${invoice.date} | Due: ${invoice.dueDate}</div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Item / Service Description</th>
          <th>Department</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="margin-top: 16px; float: right; width: 280px; background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Subtotal:</span> <span>$${invoice.totalAmount.toFixed(2)}</span></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Tax / Levies:</span> <span>$0.00</span></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-top: 4px; border-top: 1px solid #cbd5e1; font-weight: 900; font-size: 14px; color: #047857;"><span>Total Bill:</span> <span>$${invoice.totalAmount.toFixed(2)}</span></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold; color: #059669;"><span>Amount Paid:</span> <span>$${invoice.paidAmount.toFixed(2)}</span></div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: #b45309;"><span>Balance Due:</span> <span>$${(invoice.totalAmount - invoice.paidAmount).toFixed(2)}</span></div>
    </div>

    <div style="clear: both;"></div>

    <div class="footer">
      <div>
        <div style="font-weight: bold; text-transform: uppercase;">Hospital Cashier Stamp & Signature:</div>
        <div style="margin-top: 20px; border-bottom: 1px solid #475569; width: 180px; font-weight: bold;">GB Cashier (Verified)</div>
      </div>
      <div style="text-align: right;">
        <p style="font-style: italic;">Thank you for choosing Garasbaley Hospital.</p>
        <p style="font-weight: bold; color: #047857; text-transform: uppercase; margin-top: 2px;">Valid Computer Generated Receipt</p>
      </div>
    </div>
  `;
};

export const printDocumentContent = (title: string, bodyHtml: string) => {
  const fullHtml = renderFullHtml(title, bodyHtml);
  try {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win) {
      setTimeout(() => {
        try {
          win.print();
        } catch {}
      }, 500);
      return;
    }
  } catch {}

  // Fallback to hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(fullHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 1500);
    }, 350);
  } else {
    window.print();
  }
};

export const printPatientRegistrationCard = (pat: PrintPatientCardData) => {
  printDocumentContent(`Patient Card - ${pat.name}`, getPatientCardHtml(pat));
};

export const printAppointmentSlip = (apt: PrintAppointmentSlipData) => {
  printDocumentContent(`Appointment Slip - ${apt.patientName}`, getAppointmentSlipHtml(apt));
};
