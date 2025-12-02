import { PaymentAccount } from '../../../../service/interfaces/financial/paymentAccounts';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import { PAYMENT_STATUS } from '../../../../utils/financial';
import { formatPostgresDate } from '../../../../utils/dateTime';
import { ORDER_STATUS } from '../../../../components/utils/statusLabel';
import { a } from 'framer-motion/dist/types.d-BJcRxCew';

export const getContasPagarColumns = () => [
  {
    key: 'supplier',
    header: 'Fornecedor',
    render: (account: PaymentAccount) => (
      <div>
        <p className="font-medium py-2 text-slate-900">{account.supplier || 'N/A'}</p>
      </div>
    ),
  },
  {
    key: 'title',
    header: 'Título',
    render: (account: PaymentAccount) => (
      <div>
        <p className="text-sm font-medium text-slate-900">{account.title}</p>
      </div>
    ),
  },
  {
    key: 'description',
    header: 'Descrição',
    render: (account: PaymentAccount) => (
      <div>
        <p className="text-sm px-4 font-medium text-slate-900">{account.description}</p>
      </div>
    ),
  },
  {
    key: 'valor',
    header: 'Valor',
    render: (account: PaymentAccount) => (
      <div>
        <p className="font-semibold">{formatCurrency(account.total_amount)}</p>
      </div>
    ),
  },
  {
    key: 'dates',
    header: 'Criado em',
    render: (account: PaymentAccount) => (
      <div>
        <p className="text-sm px-3">{formatDate(account.createdat)}</p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (account: PaymentAccount) => {
      const statusInfo = ORDER_STATUS[account.payment_status] || {
        label: account.payment_status,
        color: "bg-gray-50 text-gray-800 border border-gray-200 px-2 py-1 rounded-md text-xs font-medium"
      };
      return (
        <span className={statusInfo.color}>
          {statusInfo.label}
        </span>
      );
    },
  },
  {
    key: 'payment_date',
    header: 'Data Pagamento',
    render: (account: PaymentAccount) => (
      <div className="text-sm">{formatPostgresDate(account.payment_date)}</div>
    ),
  },
];