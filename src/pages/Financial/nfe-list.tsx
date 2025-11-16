import { useEffect, useState } from "react";
import { FileText, FileArchive, ExternalLink, Download, Eye, MoreVertical, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { DynamicTable } from "../../utils/Table/DynamicTable";
import { handleNfeAllDate, handleNfeById } from "../../service/api/Administrador/financial";
import Dashboard from "../../components/dashboard/Dashboard";
import DocumentViewer from "../../utils/screenOptions";
import { motion } from "framer-motion";

export default function NfeList() {
    const [notas, setNotas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedNfe, setSelectedNfe] = useState<any | null>(null);
    const [documentType, setDocumentType] = useState<"purchase_order" | "label_70x30" | "label_100x100" | "separation_list" | "nfe_pdf">("purchase_order");
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const handleViewNfePDF = (nfeId: string) => {
        setSelectedNfe({ nfeId });
        setDocumentType("nfe_pdf");
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenMenuId(null);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const toggleMenu = (orderId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === orderId ? null : orderId);
    };

    const loadNotas = async () => {
        try {
            setLoading(true);
            const response = await handleNfeAllDate();
            setNotas(response);
        } catch (err) {
            console.error("Erro ao carregar NFs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotas();
    }, []);

    const totalNotas = notas.length;
    const notasConcluidas = notas.filter(n => n.status === "CONCLUIDO").length;
    const valorTotal = notas.reduce((sum, nota) => {
        try {
            if (typeof nota.valor === 'number') {
                return sum + nota.valor;
            }
            if (typeof nota.valor === 'string') {
                const valor = parseFloat(nota.valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
                return sum + valor;
            }
            return sum;
        } catch (error) {
            console.warn('Erro ao processar valor:', nota.valor, error);
            return sum;
        }
    }, 0);

    const columns = [
        {
            key: "numero",
            header: "Nº NF-e",
            render: (item: any) => (
                <span className="font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded font-semibold">
                    {item.numero}
                </span>
            ),
        },
        {
            key: "emissao",
            header: "Data de Emissão",
            render: (item: any) => (
                <span className="font-medium text-gray-700">
                    {item.emissao}
                </span>
            ),
        },
        {
            key: "valor",
            header: "Valor Total",
            render: (item: any) => (
                <span className="font-bold text-slate-800">
                    {item.valor}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            render: (item: any) => (
                <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${item.status === "CONCLUIDO"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                >
                    {item.status === "CONCLUIDO" ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                        <XCircle className="w-3.5 h-3.5" />
                    )}
                    {item.status}
                </span>
            ),
        },
        {
            key: "acoes",
            header: "Ações",
            render: (item: any) => (
                <div className="relative">
                    <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={(e) => toggleMenu(item.id, e)}
                        type="button"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {openMenuId === item.id && (
                        <div className="absolute bg-white shadow-xl rounded-lg mt-1 py-1 z-10 min-w-[200px] right-0 border border-gray-200">
                            <button
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-gray-700 transition-colors"
                                onClick={() => handleViewNfePDF(item.id)}
                                type="button"
                            >
                                <Eye className="w-4 h-4 text-slate-600" />
                                <span className="font-medium">Visualizar DANFE</span>
                            </button>

                            <button
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-gray-700 transition-colors"
                                onClick={async () => {
                                    try {
                                        const pdfUrl = await handleNfeById(item.id);
                                        window.open(pdfUrl, "_blank");
                                        setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
                                    } catch (error) {
                                        console.error("Erro ao abrir PDF:", error);
                                        alert("Erro ao abrir o PDF. Tente novamente.");
                                    }
                                }}
                                type="button"
                            >
                                <ExternalLink className="w-4 h-4 text-slate-600" />
                                <span className="font-medium">Abrir em Nova Aba</span>
                            </button>

                            <button
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-gray-700 transition-colors border-t border-gray-100"
                                onClick={async () => {
                                    try {
                                        const pdfUrl = await handleNfeById(item.id);
                                        const link = document.createElement('a');
                                        link.href = pdfUrl;
                                        link.download = `DANFE-${item.numero}.pdf`;
                                        link.click();
                                        setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
                                    } catch (error) {
                                        console.error("Erro ao baixar PDF:", error);
                                        alert("Erro ao baixar o PDF. Tente novamente.");
                                    }
                                }}
                                type="button"
                            >
                                <Download className="w-4 h-4 text-slate-600" />
                                <span className="font-medium">Baixar PDF</span>
                            </button>
                        </div>
                    )}
                </div>
            ),
        }
    ];

    if (selectedNfe && documentType === "nfe_pdf") {
        return (
            <DocumentViewer
                product={selectedNfe}
                documentType="nfe_pdf"
                onClose={() => {
                    setSelectedNfe(null);
                    setDocumentType("purchase_order");
                }}
            />
        );
    }

    return (
        <Dashboard>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Cabeçalho */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-slate-800 rounded-lg">
                                    <FileArchive className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Notas Fiscais Eletrônicas
                                </h1>
                            </div>
                            <p className="text-gray-600 font-medium">
                                Gerencie e visualize todas as NF-e emitidas
                            </p>
                        </div>
                    </motion.div>

                    {/* Cards de Estatísticas */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            {
                                title: "Total de NF-e",
                                value: totalNotas,
                                icon: <FileText className="w-8 h-8 text-slate-600" />,
                                bg: "bg-white border-slate-200",
                            },
                            {
                                title: "NF-e Concluídas",
                                value: notasConcluidas,
                                icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
                                bg: "bg-white border-emerald-200",
                            },
                            {
                                title: "Valor Total",
                                value: `R$ ${valorTotal.toFixed(2)}`,
                                icon: <TrendingUp className="w-8 h-8 text-slate-600" />,
                                bg: "bg-white border-slate-200",
                            },
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`${card.bg} border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
                                            {card.title}
                                        </p>
                                        <p className="text-3xl font-bold text-slate-800">
                                            {card.value}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        {card.icon}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Tabela */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <DynamicTable
                            data={notas}
                            columns={columns}
                            loading={loading}
                            emptyMessage="Nenhuma Nota Fiscal encontrada"
                            emptyDescription="Nenhuma NF-e foi emitida ainda no sistema."
                        />
                    </motion.div>
                </div>
            </div>
        </Dashboard>
    );
}