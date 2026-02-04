// QuickQuote - Professional Quotation Generator
let currentTemplate = 'clean';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setDefaultDates();
    addItemRow();
    setupEventListeners();
}

function setDefaultDates() {
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 30);

    document.getElementById('quoteDate').value = formatDate(today);
    document.getElementById('validUntil').value = formatDate(validUntil);
    document.getElementById('quoteNumber').value = `QT-${String(Date.now()).slice(-6)}`;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function setupEventListeners() {
    document.getElementById('addItemBtn').addEventListener('click', addItemRow);
    document.getElementById('taxRate').addEventListener('input', calculateTotals);
    document.getElementById('discountRate').addEventListener('input', calculateTotals);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('downloadBtn').addEventListener('click', () => showTemplateModal('download'));
    document.getElementById('printBtn').addEventListener('click', () => showTemplateModal('print'));
    document.getElementById('clearBtn').addEventListener('click', clearAll);

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('closeTemplateModal').addEventListener('click', closeTemplateModal);

    document.getElementById('previewModal').addEventListener('click', (e) => {
        if (e.target.id === 'previewModal') closeModal();
    });

    document.getElementById('templateModal').addEventListener('click', (e) => {
        if (e.target.id === 'templateModal') closeTemplateModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeTemplateModal();
        }
    });

    // Template selection
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            currentTemplate = card.dataset.template;
        });
    });

    document.getElementById('confirmTemplateBtn').addEventListener('click', () => {
        const action = document.getElementById('templateModal').dataset.action;
        closeTemplateModal();

        // Small delay to ensure modal is closed
        setTimeout(() => {
            if (action === 'download') {
                downloadPDF();
            } else {
                printQuote();
            }
        }, 100);
    });

    document.getElementById('currency').addEventListener('change', () => {
        document.querySelectorAll('.item-row').forEach(row => updateItemTotal(row));
        calculateTotals();
    });
}

function addItemRow() {
    const itemsList = document.getElementById('itemsList');
    const itemId = Date.now();

    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.dataset.id = itemId;

    itemRow.innerHTML = `
        <input type="text" class="item-description" placeholder="Item or service description">
        <input type="number" class="item-qty" value="1" min="1" step="1" placeholder="Qty">
        <input type="number" class="item-price" value="0" min="0" step="0.01" placeholder="Price">
        <span class="item-total">$0.00</span>
        <button type="button" class="delete-item-btn" title="Remove item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 6l8 8M6 14l8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;

    itemsList.appendChild(itemRow);

    const qtyInput = itemRow.querySelector('.item-qty');
    const priceInput = itemRow.querySelector('.item-price');
    const deleteBtn = itemRow.querySelector('.delete-item-btn');

    qtyInput.addEventListener('input', () => updateItemTotal(itemRow));
    priceInput.addEventListener('input', () => updateItemTotal(itemRow));
    deleteBtn.addEventListener('click', () => deleteItemRow(itemRow));

    itemRow.querySelector('.item-description').focus();
}

function updateItemTotal(row) {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = qty * price;
    const currency = document.getElementById('currency').value;

    row.querySelector('.item-total').textContent = currency + formatNumber(total);
    calculateTotals();
}

function deleteItemRow(row) {
    const itemsList = document.getElementById('itemsList');

    if (itemsList.children.length <= 1) {
        row.querySelector('.item-description').value = '';
        row.querySelector('.item-qty').value = 1;
        row.querySelector('.item-price').value = 0;
        updateItemTotal(row);
        return;
    }

    row.style.animation = 'slideIn 0.2s ease reverse';
    setTimeout(() => {
        row.remove();
        calculateTotals();
    }, 200);
}

function calculateTotals() {
    const currency = document.getElementById('currency').value;
    const rows = document.querySelectorAll('.item-row');
    let subtotal = 0;

    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        subtotal += qty * price;
    });

    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const discountRate = parseFloat(document.getElementById('discountRate').value) || 0;

    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discountRate / 100);
    const grandTotal = subtotal + taxAmount - discountAmount;

    document.getElementById('subtotal').textContent = currency + formatNumber(subtotal);
    document.getElementById('taxAmount').textContent = currency + formatNumber(taxAmount);
    document.getElementById('discountAmount').textContent = '-' + currency + formatNumber(discountAmount);
    document.getElementById('grandTotal').textContent = currency + formatNumber(grandTotal);
}

function formatNumber(num) {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getQuoteData() {
    const rows = document.querySelectorAll('.item-row');
    const items = [];

    rows.forEach(row => {
        const description = row.querySelector('.item-description').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;

        if (description || price > 0) {
            items.push({ description, qty, price, total: qty * price });
        }
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const discountRate = parseFloat(document.getElementById('discountRate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discountRate / 100);
    const grandTotal = subtotal + taxAmount - discountAmount;

    return {
        business: {
            name: document.getElementById('businessName').value,
            email: document.getElementById('businessEmail').value,
            phone: document.getElementById('businessPhone').value,
            address: document.getElementById('businessAddress').value
        },
        client: {
            name: document.getElementById('clientName').value,
            email: document.getElementById('clientEmail').value,
            address: document.getElementById('clientAddress').value
        },
        quote: {
            number: document.getElementById('quoteNumber').value,
            date: document.getElementById('quoteDate').value,
            validUntil: document.getElementById('validUntil').value
        },
        currency: document.getElementById('currency').value,
        items,
        subtotal,
        taxRate,
        taxAmount,
        discountRate,
        discountAmount,
        grandTotal,
        notes: document.getElementById('notes').value
    };
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============================================
// STRIPE-INSPIRED PROFESSIONAL TEMPLATES
// ============================================

const templates = {
    // CLEAN TEMPLATE - Clean, minimal, premium feel
    clean: {
        name: 'Clean',
        generate: function(data) {
            const itemsHTML = data.items.map(item => `
                <tr>
                    <td style="padding: 16px 0; border-bottom: 1px solid #e6e6e6; color: #3c4257; font-size: 13px; line-height: 1.5;">${escapeHTML(item.description) || '—'}</td>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e6e6e6; color: #3c4257; font-size: 13px; text-align: center;">${item.qty}</td>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e6e6e6; color: #697386; font-size: 13px; text-align: right;">${data.currency}${formatNumber(item.price)}</td>
                    <td style="padding: 16px 0; border-bottom: 1px solid #e6e6e6; color: #3c4257; font-size: 13px; text-align: right; font-weight: 500;">${data.currency}${formatNumber(item.total)}</td>
                </tr>
            `).join('');

            return `
                <div style="width: 794px; min-height: 1123px; padding: 48px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background: #ffffff; color: #3c4257;">

                    <!-- Header -->
                    <table style="width: 100%; margin-bottom: 48px;">
                        <tr>
                            <td style="vertical-align: top;">
                                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; margin-bottom: 8px;">Quote</div>
                                <div style="font-size: 32px; font-weight: 600; color: #0a2540; letter-spacing: -0.5px;">${escapeHTML(data.quote.number)}</div>
                            </td>
                            <td style="vertical-align: top; text-align: right;">
                                ${data.business.name ? `
                                    <div style="font-size: 16px; font-weight: 600; color: #0a2540; margin-bottom: 4px;">${escapeHTML(data.business.name)}</div>
                                    <div style="font-size: 14px; color: #697386; line-height: 1.6;">
                                        ${data.business.address ? `${escapeHTML(data.business.address)}<br>` : ''}
                                        ${data.business.email ? `${escapeHTML(data.business.email)}<br>` : ''}
                                        ${data.business.phone ? escapeHTML(data.business.phone) : ''}
                                    </div>
                                ` : ''}
                            </td>
                        </tr>
                    </table>

                    <!-- Info Cards -->
                    <table style="width: 100%; margin-bottom: 48px; border-collapse: separate; border-spacing: 16px 0;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; background: #f7f8fa; border-radius: 8px; padding: 24px;">
                                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; margin-bottom: 12px;">Bill to</div>
                                ${data.client.name ? `
                                    <div style="font-size: 15px; font-weight: 500; color: #0a2540; margin-bottom: 4px;">${escapeHTML(data.client.name)}</div>
                                    ${data.client.email ? `<div style="font-size: 14px; color: #697386;">${escapeHTML(data.client.email)}</div>` : ''}
                                    ${data.client.address ? `<div style="font-size: 14px; color: #697386; margin-top: 4px;">${escapeHTML(data.client.address)}</div>` : ''}
                                ` : '<div style="font-size: 14px; color: #8792a2;">—</div>'}
                            </td>
                            <td style="width: 50%; vertical-align: top; background: #f7f8fa; border-radius: 8px; padding: 24px;">
                                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; margin-bottom: 12px;">Details</div>
                                <table style="font-size: 14px;">
                                    <tr>
                                        <td style="color: #697386; padding: 2px 16px 2px 0;">Issue date</td>
                                        <td style="color: #0a2540; font-weight: 500;">${formatDateDisplay(data.quote.date)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #697386; padding: 2px 16px 2px 0;">Valid until</td>
                                        <td style="color: #0a2540; font-weight: 500;">${formatDateDisplay(data.quote.validUntil)}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- Items Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                        <thead>
                            <tr>
                                <th style="padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; border-bottom: 2px solid #e6e6e6;">Description</th>
                                <th style="padding: 12px 24px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; border-bottom: 2px solid #e6e6e6; width: 80px;">Qty</th>
                                <th style="padding: 12px 24px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; border-bottom: 2px solid #e6e6e6; width: 120px;">Unit price</th>
                                <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; border-bottom: 2px solid #e6e6e6; width: 120px;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML || '<tr><td colspan="4" style="padding: 40px 0; text-align: center; color: #8792a2; font-size: 14px;">No items</td></tr>'}
                        </tbody>
                    </table>

                    <!-- Totals -->
                    <table style="width: 100%; margin-bottom: 48px;">
                        <tr>
                            <td style="width: 60%;"></td>
                            <td style="width: 40%;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 12px 0; font-size: 14px; color: #697386;">Subtotal</td>
                                        <td style="padding: 12px 0; font-size: 14px; color: #3c4257; text-align: right;">${data.currency}${formatNumber(data.subtotal)}</td>
                                    </tr>
                                    ${data.taxRate > 0 ? `
                                        <tr>
                                            <td style="padding: 12px 0; font-size: 14px; color: #697386;">Tax (${data.taxRate}%)</td>
                                            <td style="padding: 12px 0; font-size: 14px; color: #3c4257; text-align: right;">${data.currency}${formatNumber(data.taxAmount)}</td>
                                        </tr>
                                    ` : ''}
                                    ${data.discountRate > 0 ? `
                                        <tr>
                                            <td style="padding: 12px 0; font-size: 14px; color: #697386;">Discount (${data.discountRate}%)</td>
                                            <td style="padding: 12px 0; font-size: 14px; color: #3c4257; text-align: right;">−${data.currency}${formatNumber(data.discountAmount)}</td>
                                        </tr>
                                    ` : ''}
                                    <tr>
                                        <td colspan="2" style="padding: 0;"><div style="border-top: 2px solid #e6e6e6; margin: 8px 0;"></div></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; font-size: 16px; font-weight: 600; color: #0a2540;">Total Due</td>
                                        <td style="padding: 12px 0; font-size: 24px; font-weight: 600; color: #0a2540; text-align: right;">${data.currency}${formatNumber(data.grandTotal)}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${data.notes ? `
                        <div style="border-top: 1px solid #e6e6e6; padding-top: 24px;">
                            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8792a2; margin-bottom: 12px;">Notes</div>
                            <div style="font-size: 14px; color: #697386; line-height: 1.6; white-space: pre-wrap;">${escapeHTML(data.notes)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    },

    // EXECUTIVE TEMPLATE - Professional, corporate
    executive: {
        name: 'Executive',
        generate: function(data) {
            const itemsHTML = data.items.map((item, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fafbfc'};">
                    <td style="padding: 14px 16px; color: #1a1a2e; font-size: 13px;">${escapeHTML(item.description) || '—'}</td>
                    <td style="padding: 14px 16px; color: #4a5568; font-size: 13px; text-align: center;">${item.qty}</td>
                    <td style="padding: 14px 16px; color: #4a5568; font-size: 13px; text-align: right;">${data.currency}${formatNumber(item.price)}</td>
                    <td style="padding: 14px 16px; color: #1a1a2e; font-size: 13px; text-align: right; font-weight: 600;">${data.currency}${formatNumber(item.total)}</td>
                </tr>
            `).join('');

            return `
                <div style="width: 794px; min-height: 1123px; box-sizing: border-box; font-family: 'Georgia', 'Times New Roman', serif; background: #ffffff;">

                    <!-- Navy Header -->
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; color: white;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="vertical-align: bottom;">
                                    <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin-bottom: 8px; font-family: -apple-system, sans-serif;">Quotation</div>
                                    <div style="font-size: 28px; font-weight: 400; letter-spacing: 1px;">${escapeHTML(data.quote.number)}</div>
                                </td>
                                <td style="vertical-align: bottom; text-align: right;">
                                    ${data.business.name ? `
                                        <div style="font-size: 20px; font-weight: 400; margin-bottom: 8px;">${escapeHTML(data.business.name)}</div>
                                        <div style="font-size: 13px; opacity: 0.8; line-height: 1.6; font-family: -apple-system, sans-serif;">
                                            ${data.business.email ? `${escapeHTML(data.business.email)}` : ''}
                                            ${data.business.phone ? ` · ${escapeHTML(data.business.phone)}` : ''}
                                        </div>
                                    ` : ''}
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding: 40px;">
                        <!-- Meta Row -->
                        <table style="width: 100%; margin-bottom: 32px; font-family: -apple-system, sans-serif;">
                            <tr>
                                <td style="width: 33%; vertical-align: top;">
                                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 8px; font-weight: 600;">Prepared for</div>
                                    ${data.client.name ? `
                                        <div style="font-size: 16px; color: #1a1a2e; font-weight: 500; margin-bottom: 4px;">${escapeHTML(data.client.name)}</div>
                                        ${data.client.email ? `<div style="font-size: 13px; color: #718096;">${escapeHTML(data.client.email)}</div>` : ''}
                                        ${data.client.address ? `<div style="font-size: 13px; color: #718096; margin-top: 4px;">${escapeHTML(data.client.address)}</div>` : ''}
                                    ` : '<div style="font-size: 14px; color: #a0aec0;">—</div>'}
                                </td>
                                <td style="width: 33%; vertical-align: top; text-align: center;">
                                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 8px; font-weight: 600;">Date issued</div>
                                    <div style="font-size: 15px; color: #1a1a2e;">${formatDateDisplay(data.quote.date)}</div>
                                </td>
                                <td style="width: 33%; vertical-align: top; text-align: right;">
                                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 8px; font-weight: 600;">Valid until</div>
                                    <div style="font-size: 15px; color: #1a1a2e;">${formatDateDisplay(data.quote.validUntil)}</div>
                                </td>
                            </tr>
                        </table>

                        <!-- Items Table -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-family: -apple-system, sans-serif;">
                            <thead>
                                <tr style="background: #1a1a2e;">
                                    <th style="padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: white;">Description</th>
                                    <th style="padding: 14px 20px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: white; width: 80px;">Qty</th>
                                    <th style="padding: 14px 20px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: white; width: 120px;">Rate</th>
                                    <th style="padding: 14px 20px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: white; width: 120px;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML || '<tr><td colspan="4" style="padding: 40px 20px; text-align: center; color: #a0aec0; font-size: 14px; background: #fafbfc;">No items</td></tr>'}
                            </tbody>
                        </table>

                        <!-- Totals -->
                        <table style="width: 100%; margin-bottom: 40px; font-family: -apple-system, sans-serif;">
                            <tr>
                                <td style="width: 55%;"></td>
                                <td style="width: 45%;">
                                    <table style="width: 100%; border-collapse: collapse; background: #fafbfc; border-radius: 4px;">
                                        <tr>
                                            <td style="padding: 14px 20px; font-size: 14px; color: #4a5568;">Subtotal</td>
                                            <td style="padding: 14px 20px; font-size: 14px; color: #1a1a2e; text-align: right; font-weight: 500;">${data.currency}${formatNumber(data.subtotal)}</td>
                                        </tr>
                                        ${data.taxRate > 0 ? `
                                            <tr>
                                                <td style="padding: 14px 20px; font-size: 14px; color: #4a5568;">Tax (${data.taxRate}%)</td>
                                                <td style="padding: 14px 20px; font-size: 14px; color: #1a1a2e; text-align: right; font-weight: 500;">${data.currency}${formatNumber(data.taxAmount)}</td>
                                            </tr>
                                        ` : ''}
                                        ${data.discountRate > 0 ? `
                                            <tr>
                                                <td style="padding: 14px 20px; font-size: 14px; color: #4a5568;">Discount (${data.discountRate}%)</td>
                                                <td style="padding: 14px 20px; font-size: 14px; color: #1a1a2e; text-align: right; font-weight: 500;">−${data.currency}${formatNumber(data.discountAmount)}</td>
                                            </tr>
                                        ` : ''}
                                        <tr style="background: #1a1a2e;">
                                            <td style="padding: 16px 20px; font-size: 14px; color: white; font-weight: 600;">Total Due</td>
                                            <td style="padding: 16px 20px; font-size: 22px; color: white; text-align: right; font-weight: 700;">${data.currency}${formatNumber(data.grandTotal)}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        ${data.notes ? `
                            <div style="border-left: 3px solid #1a1a2e; padding-left: 20px; font-family: -apple-system, sans-serif;">
                                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 8px; font-weight: 600;">Terms & Notes</div>
                                <div style="font-size: 13px; color: #4a5568; line-height: 1.7; white-space: pre-wrap;">${escapeHTML(data.notes)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    },

    // MINIMAL TEMPLATE - Ultra clean
    minimal: {
        name: 'Minimal',
        generate: function(data) {
            const itemsHTML = data.items.map(item => `
                <tr>
                    <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-size: 13px;">${escapeHTML(item.description) || '—'}</td>
                    <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 13px; text-align: center; width: 60px;">${item.qty}</td>
                    <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 13px; text-align: right; width: 100px;">${data.currency}${formatNumber(item.price)}</td>
                    <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-size: 13px; text-align: right; width: 100px; font-weight: 500;">${data.currency}${formatNumber(item.total)}</td>
                </tr>
            `).join('');

            return `
                <div style="width: 794px; min-height: 1123px; padding: 48px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; background: #ffffff; color: #111;">

                    <!-- Header -->
                    <div style="margin-bottom: 64px;">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 8px;">Quote</div>
                        <div style="font-size: 36px; font-weight: 300; color: #111; letter-spacing: -1px;">${escapeHTML(data.quote.number)}</div>
                    </div>

                    <!-- Info Row -->
                    <table style="width: 100%; margin-bottom: 56px;">
                        <tr>
                            <td style="vertical-align: top; width: 33%;">
                                ${data.business.name ? `
                                    <div style="font-size: 14px; font-weight: 500; color: #111; margin-bottom: 4px;">${escapeHTML(data.business.name)}</div>
                                    <div style="font-size: 13px; color: #888; line-height: 1.6;">
                                        ${data.business.address ? `${escapeHTML(data.business.address)}<br>` : ''}
                                        ${data.business.email ? `${escapeHTML(data.business.email)}<br>` : ''}
                                        ${data.business.phone || ''}
                                    </div>
                                ` : ''}
                            </td>
                            <td style="vertical-align: top; width: 33%; text-align: center;">
                                <div style="font-size: 12px; color: #999; margin-bottom: 4px;">${formatDateDisplay(data.quote.date)}</div>
                                <div style="font-size: 11px; color: #bbb;">Valid until ${formatDateDisplay(data.quote.validUntil)}</div>
                            </td>
                            <td style="vertical-align: top; width: 33%; text-align: right;">
                                ${data.client.name ? `
                                    <div style="font-size: 14px; font-weight: 500; color: #111; margin-bottom: 4px;">${escapeHTML(data.client.name)}</div>
                                    ${data.client.email ? `<div style="font-size: 13px; color: #888;">${escapeHTML(data.client.email)}</div>` : ''}
                                    ${data.client.address ? `<div style="font-size: 13px; color: #888; margin-top: 4px;">${escapeHTML(data.client.address)}</div>` : ''}
                                ` : ''}
                            </td>
                        </tr>
                    </table>

                    <!-- Items -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                        <thead>
                            <tr>
                                <th style="padding: 12px 0; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 500; border-bottom: 2px solid #111;">Description</th>
                                <th style="padding: 12px 0; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 500; border-bottom: 2px solid #111;">Qty</th>
                                <th style="padding: 12px 0; text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 500; border-bottom: 2px solid #111;">Price</th>
                                <th style="padding: 12px 0; text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 500; border-bottom: 2px solid #111;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML || '<tr><td colspan="4" style="padding: 40px 0; text-align: center; color: #ccc; font-size: 14px;">No items</td></tr>'}
                        </tbody>
                    </table>

                    <!-- Totals -->
                    <table style="width: 100%; margin-bottom: 56px;">
                        <tr>
                            <td style="width: 65%;"></td>
                            <td style="width: 35%;">
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 13px; color: #888;">Subtotal</td>
                                        <td style="padding: 8px 0; font-size: 13px; color: #444; text-align: right;">${data.currency}${formatNumber(data.subtotal)}</td>
                                    </tr>
                                    ${data.taxRate > 0 ? `
                                        <tr>
                                            <td style="padding: 8px 0; font-size: 13px; color: #888;">Tax ${data.taxRate}%</td>
                                            <td style="padding: 8px 0; font-size: 13px; color: #444; text-align: right;">${data.currency}${formatNumber(data.taxAmount)}</td>
                                        </tr>
                                    ` : ''}
                                    ${data.discountRate > 0 ? `
                                        <tr>
                                            <td style="padding: 8px 0; font-size: 13px; color: #888;">Discount ${data.discountRate}%</td>
                                            <td style="padding: 8px 0; font-size: 13px; color: #444; text-align: right;">−${data.currency}${formatNumber(data.discountAmount)}</td>
                                        </tr>
                                    ` : ''}
                                    <tr>
                                        <td colspan="2" style="padding: 16px 0 8px 0; border-top: 2px solid #111;"></td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 14px; color: #111; font-weight: 500;">Total</td>
                                        <td style="font-size: 28px; color: #111; text-align: right; font-weight: 300; letter-spacing: -1px;">${data.currency}${formatNumber(data.grandTotal)}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${data.notes ? `
                        <div style="border-top: 1px solid #f0f0f0; padding-top: 24px;">
                            <div style="font-size: 12px; color: #888; line-height: 1.7; white-space: pre-wrap;">${escapeHTML(data.notes)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    },

    // MODERN TEMPLATE - Gradient accent
    modern: {
        name: 'Modern',
        generate: function(data) {
            const itemsHTML = data.items.map(item => `
                <tr>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #eef2f7; color: #1e293b; font-size: 13px;">${escapeHTML(item.description) || '—'}</td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #eef2f7; color: #64748b; font-size: 13px; text-align: center;">${item.qty}</td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #eef2f7; color: #64748b; font-size: 13px; text-align: right;">${data.currency}${formatNumber(item.price)}</td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #eef2f7; color: #1e293b; font-size: 13px; text-align: right; font-weight: 600;">${data.currency}${formatNumber(item.total)}</td>
                </tr>
            `).join('');

            return `
                <div style="width: 794px; min-height: 1123px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #ffffff;">

                    <!-- Gradient Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 40px;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="vertical-align: top;">
                                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.7); margin-bottom: 8px;">Quotation</div>
                                    <div style="font-size: 32px; font-weight: 700; color: white;">${escapeHTML(data.quote.number)}</div>
                                </td>
                                <td style="vertical-align: top; text-align: right; color: white;">
                                    ${data.business.name ? `
                                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${escapeHTML(data.business.name)}</div>
                                        <div style="font-size: 13px; opacity: 0.85; line-height: 1.5;">
                                            ${data.business.email || ''}${data.business.phone ? ` · ${data.business.phone}` : ''}
                                            ${data.business.address ? `<br>${escapeHTML(data.business.address)}` : ''}
                                        </div>
                                    ` : ''}
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding: 32px 40px;">
                        <!-- Info Cards -->
                        <table style="width: 100%; margin-bottom: 32px;">
                            <tr>
                                <td style="width: 50%; vertical-align: top; padding-right: 16px;">
                                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px;">
                                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px; font-weight: 600;">Billed To</div>
                                        ${data.client.name ? `
                                            <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">${escapeHTML(data.client.name)}</div>
                                            ${data.client.email ? `<div style="font-size: 13px; color: #64748b;">${escapeHTML(data.client.email)}</div>` : ''}
                                            ${data.client.address ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px;">${escapeHTML(data.client.address)}</div>` : ''}
                                        ` : '<div style="font-size: 14px; color: #94a3b8;">—</div>'}
                                    </div>
                                </td>
                                <td style="width: 50%; vertical-align: top; padding-left: 16px;">
                                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px;">
                                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px; font-weight: 600;">Quote Details</div>
                                        <table style="font-size: 13px;">
                                            <tr>
                                                <td style="color: #64748b; padding: 3px 20px 3px 0;">Date</td>
                                                <td style="color: #1e293b; font-weight: 500;">${formatDateDisplay(data.quote.date)}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #64748b; padding: 3px 20px 3px 0;">Valid Until</td>
                                                <td style="color: #1e293b; font-weight: 500;">${formatDateDisplay(data.quote.validUntil)}</td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Items Table -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                            <thead>
                                <tr>
                                    <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background: #f8fafc; border-radius: 8px 0 0 8px;">Description</th>
                                    <th style="padding: 14px 16px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background: #f8fafc; width: 80px;">Qty</th>
                                    <th style="padding: 14px 16px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background: #f8fafc; width: 120px;">Price</th>
                                    <th style="padding: 14px 16px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background: #f8fafc; border-radius: 0 8px 8px 0; width: 120px;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML || '<tr><td colspan="4" style="padding: 40px 16px; text-align: center; color: #94a3b8; font-size: 14px;">No items</td></tr>'}
                            </tbody>
                        </table>

                        <!-- Totals -->
                        <table style="width: 100%; margin-bottom: 40px;">
                            <tr>
                                <td style="width: 55%;"></td>
                                <td style="width: 45%;">
                                    <table style="width: 100%; border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Subtotal</td>
                                            <td style="padding: 10px 0; font-size: 14px; color: #1e293b; text-align: right;">${data.currency}${formatNumber(data.subtotal)}</td>
                                        </tr>
                                        ${data.taxRate > 0 ? `
                                            <tr>
                                                <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Tax (${data.taxRate}%)</td>
                                                <td style="padding: 10px 0; font-size: 14px; color: #1e293b; text-align: right;">${data.currency}${formatNumber(data.taxAmount)}</td>
                                            </tr>
                                        ` : ''}
                                        ${data.discountRate > 0 ? `
                                            <tr>
                                                <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Discount (${data.discountRate}%)</td>
                                                <td style="padding: 10px 0; font-size: 14px; color: #1e293b; text-align: right;">−${data.currency}${formatNumber(data.discountAmount)}</td>
                                            </tr>
                                        ` : ''}
                                        <tr>
                                            <td colspan="2" style="padding: 12px 0;"><div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 2px; border-radius: 1px;"></div></td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #1e293b;">Total</td>
                                            <td style="padding: 8px 0; font-size: 28px; font-weight: 700; color: #667eea; text-align: right;">${data.currency}${formatNumber(data.grandTotal)}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        ${data.notes ? `
                            <div style="background: #f8fafc; border-radius: 12px; padding: 20px;">
                                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 10px; font-weight: 600;">Notes</div>
                                <div style="font-size: 13px; color: #64748b; line-height: 1.6; white-space: pre-wrap;">${escapeHTML(data.notes)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }
};

function generatePreviewHTML(data) {
    return templates.clean.generate(data);
}

function showPreview() {
    const data = getQuoteData();
    const previewHTML = generatePreviewHTML(data);

    document.getElementById('quotePreview').innerHTML = previewHTML;
    document.getElementById('previewModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('previewModal').classList.remove('active');
    document.body.style.overflow = '';
}

function showTemplateModal(action) {
    document.getElementById('templateModal').dataset.action = action;
    document.getElementById('templateModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('active');
    document.body.style.overflow = '';
}

// A4 dimensions (210mm x 297mm at 96dpi)
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

// Same A4 document as print so PDF and print match exactly. Use forPrint: false to add PDF script.
function getQuoteDocumentHTML(data, html, options) {
    options = options || {};
    const pdfFilename = 'Quote-' + (data.quote.number || 'draft') + '.pdf';
    const pdfScript = options.forPdf ? `
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<script>
(function() {
  var filename = ${JSON.stringify(pdfFilename)};
  function runPdf() {
    var el = document.body.firstElementChild;
    if (!el || typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') { window.close(); return; }
    document.documentElement.scrollTop = document.body.scrollTop = 0;
    el.style.width = '794px';
    el.style.height = '1123px';
    el.style.minHeight = el.style.maxHeight = '1123px';
    el.style.overflow = 'hidden';
    el.style.boxSizing = 'border-box';
    document.body.style.width = '794px';
    document.body.style.height = '1123px';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    html2canvas(el, {
      scale: 1,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      backgroundColor: '#ffffff'
    }).then(function(canvas) {
      try {
        var imgData = canvas.toDataURL('image/jpeg', 0.98);
        var pdf = new jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(filename);
      } catch (e) {}
      window.close();
    }).catch(function() { window.close(); });
  }
  function go() {
    setTimeout(runPdf, 100);
  }
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go);
})();
</script>` : '';
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote - ${escapeHTML(data.quote.number)}</title>
    <style>
        @media print {
            @page { size: A4; margin: 0; }
            html, body { width: 794px !important; min-height: 1123px !important; max-width: 794px !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        html, body { width: 794px; min-height: 1123px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background: #ffffff; }
    </style>
</head>
<body>${html}${pdfScript}</body>
</html>`;
}

function downloadPDF() {
    const data = getQuoteData();
    const template = templates[currentTemplate];

    if (!template) {
        console.error('Template not found:', currentTemplate);
        alert('Error: Template not found. Please try again.');
        return;
    }

    const html = template.generate(data);
    const pdfWindow = window.open('', '_blank', 'width=794,height=1123,scrollbars=no');
    if (!pdfWindow) {
        alert('Please allow popups to download PDF.');
        return;
    }
    pdfWindow.document.write(getQuoteDocumentHTML(data, html, { forPdf: true }));
    pdfWindow.document.close();
}

function printQuote() {
    const data = getQuoteData();
    const template = templates[currentTemplate];

    if (!template) {
        console.error('Template not found:', currentTemplate);
        return;
    }

    const html = template.generate(data);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to print the quote.');
        return;
    }

    printWindow.document.write(getQuoteDocumentHTML(data, html));
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 250);
    };
}

function clearAll() {
    if (!confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
        return;
    }

    document.getElementById('businessName').value = '';
    document.getElementById('businessEmail').value = '';
    document.getElementById('businessPhone').value = '';
    document.getElementById('businessAddress').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientAddress').value = '';

    setDefaultDates();

    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';
    addItemRow();

    document.getElementById('taxRate').value = 0;
    document.getElementById('discountRate').value = 0;
    document.getElementById('notes').value = '';

    calculateTotals();
}
