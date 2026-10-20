import { Link } from "react-router-dom";
import { BarChart3, BookOpen, FileSpreadsheet, Scale } from "lucide-react";

import { AccountingPage, Card } from "./components";

const REPORTS = [
  {
    to: "/financer/contabilidade/livro-diario",
    title: "Livro diário",
    description: "Movimentos contabilizados do período, por lançamento.",
    icon: BookOpen,
  },
  {
    to: "/financer/contabilidade/livro-razao",
    title: "Livro razão",
    description: "Extrato de uma conta com saldo progressivo.",
    icon: BookOpen,
  },
  {
    to: "/financer/contabilidade/balancete",
    title: "Balancete",
    description: "Saldos e movimentos por conta, com verificação de equilíbrio.",
    icon: Scale,
  },
  {
    to: "/financer/contabilidade/balanco-patrimonial",
    title: "Balanço patrimonial",
    description: "Ativo, passivo e patrimônio líquido do período.",
    icon: BarChart3,
  },
  {
    to: "/financer/contabilidade/demonstracao-resultado",
    title: "Demonstração do resultado",
    description: "Receitas, custos, despesas e resultado do período.",
    icon: FileSpreadsheet,
  },
];

/**
 * Central de relatórios contábeis.
 *
 * Os relatórios são gerenciais: eles dependem da configuração contábil e dos
 * lançamentos registrados, e não substituem livros oficiais.
 */
export default function AccountingReportsPage() {
  return (
    <AccountingPage
      title="Relatórios contábeis"
      description="Relatórios calculados a partir dos lançamentos contabilizados da empresa."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Link
            key={report.to}
            to={report.to}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <report.icon className="h-5 w-5 text-blue-700" />
            <h2 className="mt-2 text-sm font-semibold text-slate-900">
              {report.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{report.description}</p>
          </Link>
        ))}
      </div>

      <Card title="Como usar">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Escolha o período e clique em carregar para gerar o relatório.</li>
          <li>Use a exportação CSV para trabalhar os dados na planilha.</li>
          <li>
            Lançamentos em rascunho não entram nos relatórios: contabilize antes
            de consultar.
          </li>
          <li>
            Períodos encerrados ou bloqueados não aceitam novos lançamentos.
          </li>
        </ul>
      </Card>
    </AccountingPage>
  );
}
