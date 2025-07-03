import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseRequest } from '../service/interfaces/sales/purchaseRequest';

export const generateQuotationPdf = (quotation: PurchaseRequest) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Cotação de Compra', 14, 20);

    doc.setFontSize(12);
    doc.text(`Fornecedor: ${quotation.supplierName}`, 14, 30);
    doc.text(`Nº Requisição: ${quotation.requestNumber}`, 14, 36);
    doc.text(`Data: ${quotation.requestDate}`, 14, 42);
    doc.text(`Entrega Prevista: ${quotation.deliveryDate}`, 14, 48);

    autoTable(doc, {
        startY: 55,
        head: [['Produto', 'Qtd', 'Preço Unitário', 'Total']],
        body: quotation.products.map((p) => [
            p.productName,
            p.quantity,
            `R$ ${p.price.toFixed(2)}`,
            `R$ ${p.totalPrice.toFixed(2)}`
        ])
    });

    doc.text(
        `Observações: ${quotation.notes || 'N/A'}`,
        14,
        doc.lastAutoTable.finalY + 10
    );

    doc.text(
        `Total Geral: R$ ${quotation.totalAmount.toFixed(2)}`,
        14,
        doc.lastAutoTable.finalY + 20
    );

    doc.save(`cotacao-${quotation.requestNumber}.pdf`);
};