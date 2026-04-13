import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, API_URL } from "../context/AuthContext";
import { formatName } from "../utils/formatName";
import { ArrowLeft, Check, Clock, Trash2, Loader2 } from "lucide-react";
import Dialog from "../components/Dialog";
import TransactionPrimaryFields from "../components/TransactionPrimaryFields";
import "./TransactionDetails.css";

interface UserOption {
    id: string;
    name: string;
    picture: string;
}

const toDateInputValue = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const TransactionDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserOption[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);

    // Transaction State
    const [tx, setTx] = useState<any>(null);
    const [edits, setEdits] = useState<any[]>([]);
    const [statusHistory, setStatusHistory] = useState<any[]>([]);

    // Form State
    const [description, setDescription] = useState("");
    const [amountInput, setAmountInput] = useState("");
    const [payerId, setPayerId] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [date, setDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [paymentDescription, setPaymentDescription] = useState("");

    // Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCancelSubDialogOpen, setIsCancelSubDialogOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [txRes, usersRes, pmRes] = await Promise.all([
                fetch(`${API_URL}/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/payment-methods`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (txRes.ok && usersRes.ok) {
                const txData = await txRes.json();
                const usersData = await usersRes.json();

                let pmList = [];
                if (pmRes.ok) {
                    const pmData = await pmRes.json();
                    pmList = pmData.payment_methods;
                }

                setTx(txData.transaction);
                setEdits(txData.edits);
                setStatusHistory(txData.statusHistory);
                setUsers(usersData.users);
                setPaymentMethods(pmList);

                // Populate form
                setDescription(txData.transaction.description);
                setAmountInput(txData.transaction.amount.toString());
                setPayerId(txData.transaction.payer_id);
                setReceiverId(txData.transaction.receiver_id);
                setDate(toDateInputValue(txData.transaction.date));
                setDueDate(toDateInputValue(txData.transaction.due_date || txData.transaction.date));
                setPaymentDescription(txData.transaction.payment_description || "");
            } else {
                navigate("/transactions");
            }
        } catch (e) {
            console.error(e);
            navigate("/transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, token]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, "");
        setAmountInput(digits);
    };

    const getDisplayAmount = (centsStr: string) => {
        const numericValue = parseInt(centsStr || "0", 10) / 100;
        return numericValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    const handleSwapUsers = () => {
        const currentPayer = payerId;
        setPayerId(receiverId);
        setReceiverId(currentPayer);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const amountInCents = parseInt(amountInput || "0", 10);
        if (!description || amountInCents === 0 || !payerId || !receiverId || !date) return;

        setIsSubmitting(true);
        const txDate = new Date(`${date}T12:00:00`).getTime();
        const txDueDate = new Date(`${dueDate}T12:00:00`).getTime();

        const payload = {
            description,
            amount: amountInCents,
            payer_id: payerId,
            receiver_id: receiverId,
            date: txDate,
            due_date: txDueDate,
            payment_description: paymentDescription
        };

        try {
            const res = await fetch(`${API_URL}/transactions/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async () => {
        if (!tx) return;
        setIsStatusUpdating(true);
        const nextStatus = tx.status === "pending" ? "paid" : "pending";
        try {
            const res = await fetch(`${API_URL}/transactions/${id}/${nextStatus}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const confirmDelete = async () => {
        setIsDeleteDialogOpen(false);
        try {
            const res = await fetch(`${API_URL}/transactions/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) navigate("/transactions");
        } catch (e) {
            console.error(e);
        }
    };

    const confirmCancelSub = async () => {
        setIsCancelSubDialogOpen(false);
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/transactions/${id}/cancel`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading-state">Carregando detalhes...</div>;
    if (!tx) return <div className="loading-state">Transação não encontrada.</div>;

    const isPaid = tx.status === "paid";
    const iAmCreator = tx.created_by === user?.id;

    const formatStatus = (status: string) => {
        if (status === "pending") return "Pendente";
        if (status === "paid") return "Pago";
        if (status === "cancelled") return "Cancelado";
        return status;
    };

    return (
        <div className="tx-details-container">
            <header className="details-header">
                <button className="back-btn" onClick={() => navigate("/transactions")}>
                    <ArrowLeft size={24} />
                </button>
                <h2>Detalhes do Pagamento</h2>
                {iAmCreator && (
                    <button className="del-btn head-del" onClick={() => setIsDeleteDialogOpen(true)} title="Excluir">
                        <Trash2 size={20} />
                    </button>
                )}
            </header>

            <div className="details-card main-info">
                <div className="status-toggle-container">
                    <span className="tx-amount-big">{getDisplayAmount(tx.amount.toString())}</span>
                    <button
                        type="button"
                        className={`status-btn big-status ${isPaid ? "paid-btn" : "pending-btn"}`}
                        onClick={toggleStatus}
                        disabled={isStatusUpdating}
                    >
                        {isStatusUpdating ? <Loader2 size={20} className="spinner" /> : (isPaid ? <Check size={20} /> : <Clock size={20} />)}
                        {isStatusUpdating ? "Carregando..." : (isPaid ? "Pago" : "Pagar")}
                    </button>
                    {tx.type === "subscription" && tx.status !== "cancelled" && (
                        <button
                            type="button"
                            className="status-btn pending-btn"
                            style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-color)" }}
                            onClick={() => setIsCancelSubDialogOpen(true)}
                            disabled={isSubmitting}
                        >
                            Cancelar Assinatura
                        </button>
                    )}
                    {tx.type === "subscription" && tx.status === "cancelled" && (
                        <span style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: "bold", background: "var(--border-color)" }}>
                            Assinatura Cancelada
                        </span>
                    )}
                </div>

                <form onSubmit={handleSave} className="tx-form details-form">
                    <TransactionPrimaryFields
                        description={description}
                        onDescriptionChange={setDescription}
                        details={paymentDescription}
                        onDetailsChange={setPaymentDescription}
                        amountDisplay={getDisplayAmount(amountInput)}
                        onAmountChange={handleAmountChange}
                        payerId={payerId}
                        onPayerIdChange={setPayerId}
                        receiverId={receiverId}
                        onReceiverIdChange={setReceiverId}
                        onSwapParticipants={handleSwapUsers}
                        date={date}
                        onDateChange={setDate}
                        dueDate={dueDate}
                        onDueDateChange={setDueDate}
                        users={users}
                        paymentMethods={paymentMethods}
                        participantMode="mixed-options"
                    />

                    <button type="submit" disabled={isSubmitting} className="submit-btn full-width" style={{ marginTop: "1rem" }}>
                        {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </form>
            </div>

            {(edits.length > 0 || statusHistory.length > 0) && (
                <div className="details-card history-section">
                    <h3>Histórico</h3>

                    {statusHistory.length > 0 && (
                        <div className="history-group">
                            <h4>Mudanças de Status</h4>
                            <ul className="history-list">
                                {statusHistory.map(sh => {
                                    const u = users.find(x => x.id === sh.user_id);
                                    return (
                                        <li key={sh.id}>
                                            <strong>{u ? formatName(u.name) : "Usuário"}</strong> mudou de <span className="status-label">{formatStatus(sh.old_status)}</span> para <span className="status-label">{formatStatus(sh.new_status)}</span> em {new Date(sh.created_at).toLocaleString("pt-BR")}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {edits.length > 0 && (
                        <div className="history-group">
                            <h4>Edições de Campos</h4>
                            <ul className="history-list">
                                {edits.map(ed => {
                                    const u = users.find(x => x.id === ed.user_id);

                                    const translateField = (f: string) => {
                                        const map: Record<string, string> = {
                                            description: "Descrição",
                                            amount: "Valor",
                                            payer_id: "Pagador",
                                            receiver_id: "Recebedor",
                                            date: "Data da Compra",
                                            due_date: "Data para Pagar",
                                            type: "Tipo",
                                            payment_description: "Descrição do Pagamento"
                                        };
                                        return map[f] || f;
                                    };

                                    const formatVal = (f: string, v: string) => {
                                        if (v === null || v === undefined || v === "" || v === "null") return "(vazio)";
                                        if (f === "amount") {
                                            const amt = parseInt(v, 10);
                                            return !isNaN(amt) ? (amt / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : v;
                                        }
                                        if (f === "date" || f === "due_date") {
                                            const ts = parseInt(v, 10);
                                            return (!isNaN(ts) && v.length > 8) ? new Date(ts).toLocaleDateString("pt-BR") : v;
                                        }
                                        if (f === "payer_id" || f === "receiver_id") {
                                            const usr = users.find(x => x.id === v);
                                            return usr ? formatName(usr.name) : "(Usuário Removido)";
                                        }
                                        if (f === "type") {
                                            const types: Record<string, string> = { single: "Única", installment: "Parcelada", subscription: "Assinatura" };
                                            return types[v] || v;
                                        }
                                        return v;
                                    };

                                    return (
                                        <li key={ed.id}>
                                            <strong>{u ? formatName(u.name) : "Usuário"}</strong> alterou <strong>{translateField(ed.field_name)}</strong> em {new Date(ed.created_at).toLocaleString("pt-BR")}
                                            <div className="diff-val">
                                                <del className="diff-old">{formatVal(ed.field_name, ed.old_value)}</del> &rarr; <ins className="diff-new">{formatVal(ed.field_name, ed.new_value)}</ins>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <Dialog
                isOpen={isDeleteDialogOpen}
                type="alert"
                title="Apagar Registro"
                message="Tem certeza que deseja apagar este registro? Esta ação não pode ser desfeita."
                confirmText="Apagar"
                cancelText="Cancelar"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />
            <Dialog
                isOpen={isCancelSubDialogOpen}
                title="Cancelar Assinatura"
                message="Você quer cancelar esta assinatura? Nenhuma nova cobrança será gerada, mas o histórico anterior será mantido."
                confirmText="Sim, Cancelar"
                cancelText="Voltar"
                onConfirm={confirmCancelSub}
                onCancel={() => setIsCancelSubDialogOpen(false)}
                type="alert"
            />
        </div>
    );
};

export default TransactionDetails;
