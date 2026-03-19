import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API_URL } from "../context/AuthContext";
import { ArrowLeft, Trash2 } from "lucide-react";
import Dialog from "../components/Dialog";
import "./ManageRecurring.css";

interface RecurringItem {
    id: string;
    name: string;
    payer_id: string;
    receiver_id: string;
    order_index: number;
}

const ManageRecurring = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState<RecurringItem[]>([]);
    const [loading, setLoading] = useState(true);

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
            const res = await fetch(`${API_URL}/recurring`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.recurring_purchases);
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
            title: "Excluir Atalho",
            message: `Tem certeza que deseja excluir o atalho "${name}"?`,
            onConfirm: () => confirmDelete(id)
        });
    };

    const confirmDelete = async (id: string) => {
        closeDialog();
        try {
            const res = await fetch(`${API_URL}/recurring/${id}`, {
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

    const saveOrder = async (reordered: RecurringItem[]) => {
        setItems(reordered); // optimistic update
        const payload = reordered.map((item, i) => ({ id: item.id, order_index: i }));
        try {
            await fetch(`${API_URL}/recurring/order`, {
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

    return (
        <div className="manage-recurring-container fade-in">
            <div className="manage-header">
                <button className="back-btn" onClick={() => navigate("/settings")}>
                    <ArrowLeft size={24} />
                </button>
                <h2>Gerenciar Atalhos</h2>
            </div>

            <p className="settings-desc">
                Ordene para mudar a posição que aparecem na tela de Nova Transação, ou exclua os que não usa mais.
            </p>

            {loading ? (
                <p>Carregando atalhos...</p>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <p>Nenhum atalho criado ainda.</p>
                    <br />
                    <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                        Para criar, faça uma nova transação e escolha "Salvar como Recorrente" ao final.
                    </p>
                </div>
            ) : (
                <div className="recurring-list">
                    {items.map((item, index) => (
                        <div key={item.id} className="recurring-list-item">
                            <div className="item-order-controls">
                                <button onClick={() => moveUp(index)} disabled={index === 0}>▲</button>
                                <button onClick={() => moveDown(index)} disabled={index === items.length - 1}>▼</button>
                            </div>

                            <div className="item-details">
                                <strong>{item.name}</strong>
                            </div>

                            <button
                                className="delete-item-btn"
                                onClick={() => handleDeleteClick(item.id, item.name)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
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

export default ManageRecurring;
