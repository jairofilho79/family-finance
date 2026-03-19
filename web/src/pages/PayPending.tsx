import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, API_URL } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatName } from "../utils/formatName";
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import Dialog from "../components/Dialog";
import "./PayPending.css";

import { generatePixPayload } from "../utils/pixPayload";

interface Transaction {
    id: string;
    description: string;
    amount: number;
    payer_id: string;
    receiver_id: string;
    created_by: string;
    date: number;
    due_date: number;
    type: string;
    status: string;
}

interface PeerInfo {
    id: string;
    name: string;
    picture: string;
    pix_key?: string;
}

const PayPending = () => {
    const { peerId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

    const [filterMonth, setFilterMonth] = useState<"thisMonth" | "lastMonth" | "all">("thisMonth");
    const [copied, setCopied] = useState(false);
    const [paying, setPaying] = useState(false);

    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "info" | "success" | "alert" | "error";
        onConfirmCb?: () => void;
    }>({ isOpen: false, title: "", message: "", type: "info" });

    const handleDialogConfirm = () => {
        if (dialogState.onConfirmCb) {
            dialogState.onConfirmCb();
        }
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                if (txRes.ok && usersRes.ok) {
                    const txData = await txRes.json();
                    const usersData = await usersRes.json();

                    const peer = usersData.users.find((u: any) => u.id === peerId);
                    if (peer) setPeerInfo(peer);

                    // Get pending transactions between me and the peer
                    const relevantTx = txData.transactions.filter((t: Transaction) =>
                        t.status === "pending" &&
                        ((t.payer_id === user?.id && t.receiver_id === peerId) ||
                            (t.receiver_id === user?.id && t.payer_id === peerId))
                    );

                    setTransactions(relevantTx);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user && peerId) {
            fetchData();
        }
    }, [user, token, peerId]);

    if (loading || !user || !peerInfo) {
        return <div className="loading-state">Carregando pendências...</div>;
    }

    // Helper variables for filtering dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

    // Filter by date
    const dateFilteredTransactions = transactions.filter(t => {
        if (filterMonth === "thisMonth") {
            if (t.due_date < currentMonthStart || t.due_date > currentMonthEnd) return false;
        } else if (filterMonth === "lastMonth") {
            if (t.due_date < lastMonthStart || t.due_date > lastMonthEnd) return false;
        }
        return true;
    });

    // Filter excluded
    const activeTransactions = dateFilteredTransactions.filter(t => !excludedIds.has(t.id));

    let totalIowe = 0;
    let totalToReceive = 0;

    activeTransactions.forEach(t => {
        if (t.payer_id === user.id) totalIowe += t.amount;
        if (t.receiver_id === user.id) totalToReceive += t.amount;
    });

    const netBalance = totalToReceive - totalIowe;
    const iOweOverall = netBalance < 0;
    const absNetBalance = Math.abs(netBalance);

    const toggleExclude = (id: string) => {
        setExcludedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const copyPixData = async () => {
        const targetPixKey = iOweOverall ? peerInfo.pix_key : user?.pix_key;
        const targetName = iOweOverall ? peerInfo.name : user?.name;

        if (!targetPixKey) {
            setDialogState({
                isOpen: true,
                type: "alert",
                title: "Chave Pix não encontrada",
                message: iOweOverall
                    ? "Este usuário não possui chave Pix configurada."
                    : "Você não possui uma chave Pix configurada. Crie uma na guia de Ajustes."
            });
            return;
        }

        const payload = generatePixPayload(
            targetPixKey,
            targetName || "",
            "Brasil",
            absNetBalance
        );

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(payload);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
            }
        } catch (err) {
            setDialogState({
                isOpen: true,
                type: "error",
                title: "Erro",
                message: "Falha ao copiar a chave Pix."
            });
        }
    };

    const confirmBulkPayment = async () => {
        if (activeTransactions.length === 0) return;
        setPaying(true);
        try {
            const idsToPay = activeTransactions.map(t => t.id);
            const res = await fetch(`${API_URL}/transactions/bulk-pay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ transaction_ids: idsToPay })
            });

            if (res.ok) {
                setDialogState({
                    isOpen: true,
                    type: "success",
                    title: "Sucesso",
                    message: "Pagamento confirmado com sucesso!",
                    onConfirmCb: () => navigate(-1)
                });
            } else {
                setDialogState({
                    isOpen: true,
                    type: "error",
                    title: "Erro",
                    message: "Houve um erro ao processar o pagamento."
                });
            }
        } catch (e) {
            console.error(e);
            setDialogState({
                isOpen: true,
                type: "error",
                title: "Erro de conexão",
                message: "Falha na conexão com o servidor."
            });
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="paypending-container fade-in">
            <header className="paypending-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h2>Pagamento</h2>
            </header>

            <div className="peer-profile-card">
                <img src={peerInfo.picture} alt={peerInfo.name} referrerPolicy="no-referrer" />
                <div>
                    <h3>{formatName(peerInfo.name)}</h3>
                    <p>Acerto de contas</p>
                </div>
            </div>

            <div className="dashboard-filters" style={{ margin: "1rem 0 0 0" }}>
                <div className="filter-toggles">
                    <button
                        className={`filter-btn ${filterMonth !== "all" ? "active all" : ""}`}
                        onClick={() => {
                            if (filterMonth === "thisMonth") setFilterMonth("lastMonth");
                            else if (filterMonth === "lastMonth") setFilterMonth("all");
                            else setFilterMonth("thisMonth");
                        }}
                    >
                        {filterMonth === "thisMonth"
                            ? "Deste mês"
                            : filterMonth === "lastMonth"
                                ? "Mês passado"
                                : "Todos (meses)"}
                    </button>
                </div>
            </div>

            <div className="balance-highlight">
                <p>{iOweOverall ? "Você está devendo no total:" : "Você vai receber no total:"}</p>
                <h1 className={iOweOverall ? "negative" : "positive"}>
                    {formatCurrency(absNetBalance)}
                </h1>
            </div>

            {iOweOverall && (
                <div className="payment-actions">
                    <button className="btn-pix" onClick={copyPixData}>
                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                        {copied ? "Chave Pix Copiada!" : "Copiar Chave Pix"}
                    </button>

                    <button
                        className="btn-confirm-pay"
                        onClick={confirmBulkPayment}
                        disabled={paying || activeTransactions.length === 0}
                    >
                        {paying ? "Processando..." : "Confirmar Pagamento"}
                    </button>
                </div>
            )}

            {!iOweOverall && activeTransactions.length > 0 && netBalance > 0 && (
                <div className="payment-actions">
                    <button className="btn-pix" onClick={copyPixData}>
                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                        {copied ? "Chave Pix Copiada!" : "Copiar Minha Chave Pix"}
                    </button>

                    <button
                        className="btn-confirm-pay receive-mode"
                        onClick={confirmBulkPayment}
                        disabled={paying || activeTransactions.length === 0}
                    >
                        {paying ? "Processando..." : "Confirmar que Recebi"}
                    </button>
                </div>
            )}

            <div className="tx-list-section">
                <h3>Transações Incluídas ({activeTransactions.length})</h3>
                {activeTransactions.length === 0 && <p className="empty-sub">Nenhuma transação ativa.</p>}
                {activeTransactions.map(t => {
                    const isOwe = t.payer_id === user.id;
                    return (
                        <div key={t.id} className="detail-tx-item">
                            <div className="detail-tx-info">
                                <p className="detail-tx-desc">{t.description}</p>
                                <span className="detail-tx-date">{new Date(t.due_date || t.date).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <div className="tx-action-group">
                                <p className={`detail-tx-amount ${isOwe ? "negative" : "positive"}`}>
                                    {formatCurrency(t.amount)}
                                </p>
                                <button className="btn-pay-later" onClick={() => toggleExclude(t.id)}>
                                    Pagar depois
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {excludedIds.size > 0 && (
                <div className="tx-list-section excluded">
                    <h3>Transações para Depois ({excludedIds.size})</h3>
                    {dateFilteredTransactions.filter(t => excludedIds.has(t.id)).map(t => {
                        return (
                            <div key={t.id} className="detail-tx-item inactive">
                                <div className="detail-tx-info">
                                    <p className="detail-tx-desc">{t.description}</p>
                                    <span className="detail-tx-date">{new Date(t.due_date || t.date).toLocaleDateString("pt-BR")}</span>
                                </div>
                                <div className="tx-action-group">
                                    <p className={`detail-tx-amount faded`}>
                                        {formatCurrency(t.amount)}
                                    </p>
                                    <button className="btn-include" onClick={() => toggleExclude(t.id)}>
                                        Incluir agora
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Dialog
                isOpen={dialogState.isOpen}
                type={dialogState.type}
                title={dialogState.title}
                message={dialogState.message}
                onConfirm={handleDialogConfirm}
                onCancel={handleDialogConfirm}
                showCancel={false}
                confirmText="OK"
            />
        </div>
    );
};

export default PayPending;
