import React, { useRef, useState } from 'react';
import { Printer, X, Store, CheckCircle2, FileText, Smartphone } from 'lucide-react';

const Receipt = ({ sale, onClose }) => {
  const [printFormat, setPrintFormat] = useState('ticket'); // 'ticket' or 'a4'
  const receiptRef = useRef();

  const handlePrint = (format) => {
    const printWindow = window.open('', '_blank');
    const isA4 = format === 'a4';

    const content = `
      <html>
        <head>
          <title>Facture X-Shop #${sale.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0; 
                padding: ${isA4 ? '40px' : '10px'}; 
                color: #1a1a1a;
                width: ${isA4 ? '210mm' : '80mm'};
            }

            /* Styles pour A4 */
            ${isA4 ? `
                .invoice-box { padding: 40px; border: 1px solid #eee; border-radius: 8px; }
                .header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                .brand-x { font-size: 40px; font-weight: 900; color: #4f46e5; background: #eeeffe; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
                .invoice-title { font-size: 24px; font-weight: 800; text-transform: uppercase; color: #4f46e5; }
                .company-details { text-align: right; font-size: 14px; color: #666; }
                .bill-to { margin-bottom: 40px; }
                .bill-to h4 { margin-bottom: 8px; text-transform: uppercase; color: #999; font-size: 12px; }
                
                table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                th { background: #f9fafb; padding: 15px; text-align: left; font-size: 12px; font-weight: 700; color: #4b5563; border-bottom: 2px solid #edf2f7; }
                td { padding: 15px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
                
                .totals-area { margin-left: auto; width: 300px; margin-top: 30px; }
                .total-row { display: flex; justify-content: space-between; padding: 10px 0; }
                .total-row.grand { border-top: 2px solid #4f46e5; margin-top: 10px; font-weight: 800; font-size: 18px; color: #4f46e5; }
                .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            ` : `
                /* Styles pour Mini Printer (Thermal) */
                .ticket-box { text-align: center; font-family: 'Courier New', monospace; }
                .brand-x { font-size: 32px; font-weight: 900; margin-bottom: 5px; }
                .ticket-header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                .ticket-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
                .item-line { text-align: left; margin: 8px 0; border-bottom: 1px dotted #eee; padding-bottom: 4px; }
                .total-section { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
                .footer { margin-top: 20px; font-size: 11px; }
            `}

            @media print {
                body { margin: 0; box-shadow: none; }
                .no-print { display: none; }
            }
          </style>
        </head>
        <body>
            ${isA4 ? `
                <div class="invoice-box">
                    <div class="header-flex">
                        <div class="brand-x">X</div>
                        <div class="company-details">
                            <div class="invoice-title">FACTURE</div>
                            <p><b>X-SHOP FURNITURE</b><br>
                            123 Avenue du Design, Dakar<br>
                            Sénégal | Tel: +221 33 800 00 00<br>
                            NINEA: 001234567 | RC: DKR-2024-B-123</p>
                        </div>
                    </div>

                    <div class="bill-to">
                        <h4>DÉTAILS DE LA VENTE</h4>
                        <p><b>Facture N°:</b> #${sale.id.toString().slice(-8)}<br>
                        <b>Date:</b> ${new Date(sale.timestamp).toLocaleString()}<br>
                        <b>Client:</b> Passager</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>DÉSIGNATION</th>
                                <th style="text-align: center;">QTÉ</th>
                                <th style="text-align: right;">PRIX UNITAIRE</th>
                                <th style="text-align: right;">TOTAL HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => `
                                <tr>
                                    <td><b>${item.name}</b></td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td style="text-align: right;">${item.price.toLocaleString()} F CFA</td>
                                    <td style="text-align: right;">${(item.price * item.quantity).toLocaleString()} F CFA</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals-area">
                        <div class="total-row">
                            <span>TOTAL NET HT</span>
                            <span>${Math.round(sale.total / 1.18).toLocaleString()} F CFA</span>
                        </div>
                        <div class="total-row">
                            <span>TVA (18%)</span>
                            <span>${(Math.round(sale.total - (sale.total / 1.18))).toLocaleString()} F CFA</span>
                        </div>
                        <div class="total-row grand">
                            <span>TOTAL TTC</span>
                            <span>${sale.total.toLocaleString()} F CFA</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Arrêté la présente facture à la somme de : <b>${sale.total.toLocaleString()} Francs CFA</b></p>
                        <p>Merci de votre confiance. Les marchandises vendues ne sont ni reprises ni échangées.</p>
                    </div>
                </div>
            ` : `
                <div class="ticket-box">
                    <div class="brand-x">X-SHOP</div>
                    <div class="ticket-header">
                        <p>123 Avenue du Design, Dakar<br>
                        Tel: +221 33 800 00 00</p>
                        <p><b>TICKET #${sale.id.toString().slice(-6)}</b><br>
                        ${new Date(sale.timestamp).toLocaleDateString()} - ${new Date(sale.timestamp).toLocaleTimeString()}</p>
                    </div>

                    <div class="ticket-body">
                        ${sale.items.map(item => `
                            <div class="item-line">
                                <div>${item.name}</div>
                                <div class="ticket-row">
                                    <span>${item.quantity} x ${item.price.toLocaleString()}</span>
                                    <span>${(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="total-section">
                        <div class="ticket-row">
                            <span>TOTAL TTC</span>
                            <span>${sale.total.toLocaleString()} F CFA</span>
                        </div>
                        <div class="ticket-row" style="font-weight: normal; font-size: 11px; margin-top: 5px;">
                            <span>Dont TVA (18%)</span>
                            <span>${(Math.round(sale.total - (sale.total / 1.18))).toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Merci de votre visite !<br>A bientôt chez X-Shop</p>
                        <p>***************************</p>
                    </div>
                </div>
            `}
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      onClose();
    }, 500);
  };

  return (
    <div className="receipt-overlay">
      <div className="elite-receipt-modal card-premium animate-fade-in">
        <div className="receipt-top-status">
          <div className="success-ring">
            <CheckCircle2 size={40} />
          </div>
          <h2>Transaction Terminée</h2>
          <p>La vente a été enregistrée avec succès</p>
        </div>

        <div className="receipt-format-selection">
          <button
            className={`format-card ${printFormat === 'ticket' ? 'active' : ''}`}
            onClick={() => setPrintFormat('ticket')}
          >
            <Smartphone size={24} />
            <div className="format-info">
              <span>Ticket de caisse</span>
              <small>Format 80mm Thermique</small>
            </div>
          </button>
          <button
            className={`format-card ${printFormat === 'a4' ? 'active' : ''}`}
            onClick={() => setPrintFormat('a4')}
          >
            <FileText size={24} />
            <div className="format-info">
              <span>Facture A4</span>
              <small>Standard Office / PDF</small>
            </div>
          </button>
        </div>

        <div className="receipt-quick-summary">
          <div className="summary-row">
            <span className="text-muted">ID Transaction</span>
            <span className="font-bold">#{sale.id.toString().slice(-8)}</span>
          </div>
          <div className="summary-row">
            <span className="text-muted">Total TTC</span>
            <span className="font-bold text-primary" style={{ fontSize: '1.2rem' }}>{sale.total.toLocaleString()} F CFA</span>
          </div>
        </div>

        <div className="receipt-actions-elite">
          <button className="btn-cancel-elite" onClick={onClose}><X size={18} /> Fermer</button>
          <button className="btn-confirm-elite shine" onClick={() => handlePrint(printFormat)}>
            <Printer size={18} />
            Imprimer {printFormat === 'a4' ? 'Facture' : 'Ticket'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .receipt-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3500;
          padding: 20px;
        }

        .elite-receipt-modal {
          width: 100%;
          max-width: 480px;
          background: white;
          padding: 40px;
          border-radius: 32px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4);
          text-align: center;
        }

        .receipt-top-status { margin-bottom: 32px; }
        .success-ring {
            width: 80px;
            height: 80px;
            background: #ecfdf5;
            color: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            border: 4px solid #fff;
            box-shadow: 0 0 0 1px #e2e8f0;
        }
        .receipt-top-status h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .receipt-top-status p { color: var(--text-muted); font-weight: 600; }

        .receipt-format-selection {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 32px;
        }

        .format-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px;
            background: var(--bg-main);
            border: 2px solid transparent;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
        }

        .format-card:hover { border-color: var(--border); }
        .format-card.active { border-color: var(--primary); background: var(--primary-light); }
        .format-card.active .format-info span { color: var(--primary); }

        .format-info { display: flex; flex-direction: column; }
        .format-info span { font-weight: 800; font-size: 1rem; color: var(--text-primary); }
        .format-info small { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

        .receipt-quick-summary {
            background: var(--bg-main);
            padding: 24px;
            border-radius: 24px;
            margin-bottom: 32px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .summary-row:last-child { margin-bottom: 0; }

        .receipt-actions-elite { display: flex; gap: 16px; }
        .receipt-actions-elite button { flex: 1; }

        .btn-confirm-elite.shine {
            position: relative;
            overflow: hidden;
        }
        .btn-confirm-elite.shine::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: rotate(45deg);
            animation: shine 3s infinite;
        }
        @keyframes shine {
            0% { left: -150%; }
            100% { left: 150%; }
        }
      `}} />
    </div>
  );
};

export default Receipt;
