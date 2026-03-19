import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API_URL } from "../context/AuthContext";
import { ArrowLeft, Trash2, Edit2, Check, X } from "lucide-react";
import Dialog from "../components/Dialog";
import "./ManageRecurring.css";

interface PaymentMethodItem {
    id: string;
    name: string;
    image_url: string;
    order_index: number;
}

const ManagePaymentMethods = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState<PaymentMethodItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");

    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "info" | "success" | "alert" | "error";
        onConfirm: () => void;
    }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => { } });

    const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }));

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/payment-methods`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.payment_methods);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [token]);

    const handleDeleteClick = (id: string, name: string) => {
        setDialogState({
            isOpen: true,
            type: "alert",
            title: "Excluir Forma de Pagamento",
            message: `Tem certeza que deseja excluir a forma de pagamento "${name}"? Suas contas antigas não serão apagadas, mas você não poderá mais lançar compras com esse método.`,
            onConfirm: () => confirmDelete(id)
        });
    };

    const confirmDelete = async (id: string) => {
        closeDialog();
        try {
            const res = await fetch(`${API_URL}/payment-methods/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchItems();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startEdit = (item: PaymentMethodItem) => {
        setEditingId(item.id);
        setEditName(item.name);
        setEditImageUrl(item.image_url || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditImageUrl("");
    };

    const saveEdit = async (id: string) => {
        if (!editName.trim()) {
            setDialogState({
                isOpen: true,
                type: "error",
                title: "Erro",
                message: "O nome não pode estar vazio.",
                onConfirm: closeDialog
            });
            return;
        }

        try {
            const res = await fetch(`${API_URL}/payment-methods/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: editName, image_url: editImageUrl })
            });

            if (res.ok) {
                setEditingId(null);
                fetchItems();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const moveUp = async (index: number) => {
        if (index === 0) return;
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[index - 1];
        newItems[index - 1] = temp;
        saveOrder(newItems);
    };

    const moveDown = async (index: number) => {
        if (index === items.length - 1) return;
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[index + 1];
        newItems[index + 1] = temp;
        saveOrder(newItems);
    };

    const saveOrder = async (reordered: PaymentMethodItem[]) => {
        setItems(reordered); // optimistic update
        const payload = reordered.map((item, i) => ({ id: item.id, order_index: i }));
        try {
            await fetch(`${API_URL}/payment-methods/order/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ items: payload })
            });
        } catch (e) {
            console.error(e);
        }
    };

    const createNew = async () => {
        try {
            const res = await fetch(`${API_URL}/payment-methods`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: "Nova Forma de Pagamento" })
            });
            if (res.ok) {
                fetchItems();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="manage-recurring-container fade-in">
            <div className="manage-header">
                <button className="back-btn" onClick={() => navigate("/settings")}>
                    <ArrowLeft size={24} />
                </button>
                <h2>Pagamentos Pessoais</h2>
            </div>

            <p className="settings-desc">
                Crie ou exclua formas de pagamento e contas (ex: Nubank, Cartão C6, Dinheiro).
            </p>

            <button className="submit-btn full-width" onClick={createNew} style={{ marginBottom: "1rem" }}>
                Adicionar Nova Forma +
            </button>

            {loading ? (
                <p>Carregando...</p>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <p>Nenhuma forma de pagamento.</p>
                </div>
            ) : (
                <div className="recurring-list">
                    {items.map((item, index) => {
                        const isEditing = editingId === item.id;

                        return (
                            <div key={item.id} className="recurring-list-item">
                                <div className="item-order-controls">
                                    <button onClick={() => moveUp(index)} disabled={index === 0}>▲</button>
                                    <button onClick={() => moveDown(index)} disabled={index === items.length - 1}>▼</button>
                                </div>

                                <div className="item-details" style={{ flex: 1, gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                                    {isEditing ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                                placeholder="Ex: Itaú"
                                            />
                                            <input
                                                type="text"
                                                value={editImageUrl}
                                                onChange={e => setEditImageUrl(e.target.value)}
                                                style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                                placeholder="URL da Imagem (Opcional)"
                                            />
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                            ) : (
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>?</div>
                                            )}
                                            <strong>{item.name}</strong>
                                        </div>
                                    )}
                                </div>

                                <div className="item-action-controls" style={{ display: 'flex', gap: '0.2rem' }}>
                                    {isEditing ? (
                                        <>
                                            <button className="action-btn" onClick={() => saveEdit(item.id)} style={{ color: 'var(--success-color)' }}>
                                                <Check size={18} />
                                            </button>
                                            <button className="action-btn" onClick={cancelEdit} style={{ color: 'var(--text-secondary)' }}>
                                                <X size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <button className="action-btn" onClick={() => startEdit(item)} style={{ color: 'var(--text-secondary)' }}>
                                            <Edit2 size={18} />
                                        </button>
                                    )}

                                    {!isEditing && (
                                        <button
                                            className="delete-item-btn"
                                            onClick={() => handleDeleteClick(item.id, item.name)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
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
                onConfirm={dialogState.onConfirm}
                onCancel={closeDialog}
                confirmText="Confirmar"
            />
        </div>
    );
};

export default ManagePaymentMethods;
