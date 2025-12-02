import Swal from 'sweetalert2';

import { format } from 'date-fns';
import { getStatusLabel } from '../../../components/utils/statusLabel';
import { updatePaymentStatus, getPaymentsByCustomer, getPayments } from '../../../service/api/Administrador/financial/payments';
import { updateOrderStatus } from '../../../service/api/Administrador/orders';
import { OrderStatus } from '../../../service/interfaces/financial/paymentAccounts';
import { formatCurrency } from '../../../utils/formatters';
import { formatDate } from '../../../utils/formatters';


export class FinancialService {
  static async markAsPaid(id: number, activeSubTab: string, reloadData: () => void) {
    try {
      const { value: formValues } = await Swal.fire({
        title: 'Confirmar Pagamento',
        html: `
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ID da Transação (opcional)</label>
              <input id="transaction_id" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ex: TXN123456">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
              <textarea id="notes" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Adicione observações sobre o pagamento"></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar Pagamento',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981',
        preConfirm: () => ({
          transaction_id: (document.getElementById('transaction_id') as HTMLInputElement).value,
          notes: (document.getElementById('notes') as HTMLTextAreaElement).value
        })
      });

      if (formValues) {
        await updatePaymentStatus(id, {
          payment_status: "paid",
          payment_date: new Date().toDateString(),
          transaction_id: id,
          notes: "Concluida transação"
        });

        await reloadData();
        Swal.fire("Sucesso", "Pagamento confirmado com sucesso!", "success");
      }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      Swal.fire("Erro", "Erro ao confirmar pagamento!", "error");
    }
  }

  static async cancelPayment(id: number) {
    try {
      const result = await Swal.fire({
        title: 'Cancelar Pagamento',
        text: 'Tem certeza que deseja cancelar este pagamento?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, cancelar',
        cancelButtonText: 'Manter',
        confirmButtonColor: '#ef4444'
      });

      if (result.isConfirmed) {
        await updatePaymentStatus(id, {
          payment_status: "cancelled",
          payment_date: null,
          transaction_id: null,
          notes: "Pagamento cancelado"
        });

        Swal.fire("Sucesso", "Pagamento cancelado com sucesso!", "success")
      }
    } catch (error) {
      console.error("Erro ao cancelar pagamento:", error);
      Swal.fire("Erro", "Erro ao cancelar pagamento!", "error");
    }
  }


  static async loadCustomerOrders(
    id: number,
    customerName: string,
    setCustomerOrders: (orders: any[]) => void,
    setSelectedCustomer: (customer: any) => void,
    setModalOpen: (open: boolean) => void
  ) {
    try {
      const response = await getPaymentsByCustomer(id);

      const merged = response.combined || [];
      console.log(merged)

      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setCustomerOrders(merged);

      setSelectedCustomer({ name: customerName, id });
      setModalOpen(true);

    } catch (error) {
      console.error("Erro ao carregar pedidos do cliente:", error);
      Swal.fire("Erro", "Erro ao carregar pedidos do cliente!", "error");
    }
  }

  static async updateOrderStatus(orderId: string | number, currentStatus: string, pedidos: any[], setPedidos: (orders: any[]) => void) {
    try {
      const nextStatusMap: Record<string, OrderStatus> = {
        'pending': 'approved',
        'approved': 'in_progress',
        'in_progress': 'shipped',
        'shipped': 'delivered',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'backout': 'backout'
      };

      const newStatus = currentStatus === 'backout'
        ? 'approved'
        : (nextStatusMap[currentStatus] || 'approved');

      const result = await Swal.fire({
        title: 'Confirmar atualização',
        text: `Deseja alterar o status para "${getStatusLabel(newStatus)}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, atualizar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await updateOrderStatus(orderId, newStatus);

        const updatedOrders = pedidos.map((order) =>
          order.id === orderId ? { ...order, orderStatus: newStatus } : order
        );
        setPedidos(updatedOrders);

        Swal.fire("Sucesso", "Status atualizado com sucesso!", "success");
      }
    } catch (error) {
      console.error("Erro ao atualizar o status do Pedido: ", error);
      Swal.fire("Erro", "Erro ao atualizar status do pedido!", "error");
    }
  }

  static async generateReport(startDate: string, endDate: string, reportType: string, setReportModalOpen: (open: boolean) => void) {
    try {
      const response = await getPayments({
        data_inicio: startDate,
        data_fim: endDate
      });

      const reportData = response.data.map((item: any) => ({
        Pedido: item.ordernumber || `#${item.orderid}`,
        Cliente: item.customer_name || 'N/A',
        Valor: formatCurrency(item.amount || 0),
        'Data Vencimento': formatDate(item.due_date),
        Status: item.payment_status,
        'Data Pagamento': item.payment_date ? formatDate(item.payment_date) : '-'
      }));

      const total = response.data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const totalPagos = response.data
        .filter((item: any) => item.payment_status === 'paid')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const reportContent = `
RELATÓRIO FINANCEIRO - ${reportType.toUpperCase()}
Período: ${format(new Date(startDate), 'dd/MM/yyyy')} à ${format(new Date(endDate), 'dd/MM/yyyy')}
Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}

DETALHES DOS PAGAMENTOS:
${reportData.map(item =>
        `${item.Pedido.padEnd(10)} | ${item.Cliente.padEnd(20)} | ${item.Valor.padEnd(12)} | ${item['Data Vencimento'].padEnd(12)} | ${item.Status}`
      ).join('\n')}

RESUMO:
TOTAL GERAL: ${formatCurrency(total)}
TOTAL PAGO: ${formatCurrency(totalPagos)}
TOTAL PENDENTE: ${formatCurrency(total - totalPagos)}
QUANTIDADE DE REGISTROS: ${reportData.length}
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${reportType}-${startDate}-a-${endDate}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire("Sucesso", "Relatório gerado com sucesso!", "success");
      setReportModalOpen(false);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      Swal.fire("Erro", "Erro ao gerar relatório!", "error");
    }
  }

  static exportData(activeSubTab: string, contasReceberFiltradas: any[], contasPagarFiltradas: any[], pedidosFiltrados: any[]) {
    let dataToExport: any[] = [];
    let filename = '';

    switch (activeSubTab) {
      case 'contas-receber':
        dataToExport = contasReceberFiltradas;
        filename = 'contas-a-receber';
        break;
      case 'contas-pagar':
        dataToExport = contasPagarFiltradas;
        filename = 'contas-a-pagar';
        break;
      case 'pedidos':
        dataToExport = pedidosFiltrados;
        filename = 'pedidos';
        break;
    }

    const csvContent = this.convertToCSV(dataToExport);
    this.downloadCSV(csvContent, filename);
  }

  private static convertToCSV(data: any[]) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  private static downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire("Sucesso", "Dados exportados com sucesso!", "success");
  }
}