import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API_URL } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatName } from "../utils/formatName";
import "./Transactions.css";
import { Check, Clock } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  payer_id: string;
  receiver_id: string;
  created_by: string;
  created_at: number;
  date: number;
  due_date: number;
  type: string;
  status: string;
  group_id?: string;
}

interface UserMap {
  [id: string]: { name: string; picture: string };
}

const Transactions = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usersInfo, setUsersInfo] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterMonth, setFilterMonth] = useState<
    "thisMonth" | "lastMonth" | "all"
  >("thisMonth");
  const [filterType, setFilterType] = useState<
    "all" | "payer" | "receiver" | "creator"
  >("all");
  const [filterStatus, setFilterStatus] = useState<"pending" | "paid" | "all">(
    "pending",
  );
  const [filterPerson, setFilterPerson] = useState<string>("all");

  const fetchData = async () => {
    try {
      const [txRes, userRes, pmRes] = await Promise.all([
        fetch(`${API_URL}/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/payment-methods`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (txRes.ok && userRes.ok) {
        const txData = await txRes.json();
        const userData = await userRes.json();

        setTransactions(txData.transactions);

        const map: UserMap = {};
        userData.users.forEach((u: any) => {
          map[u.id] = u;
        });

        if (pmRes.ok) {
          const pmData = await pmRes.json();
          pmData.payment_methods.forEach((pm: any) => {
            map[`pm_${pm.id}`] = {
              name: pm.name,
              picture: pm.image_url || "" // Treat as picture
            };
          });
        }

        setUsersInfo(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading || !user)
    return <div className="loading-state">Carregando histórico...</div>;

  // Filter relevant transactions
  const myTransactions = transactions.filter((t) => {
    // Must be related to user
    const isPayer = t.payer_id === user.id;
    const isReceiver = t.receiver_id === user.id;
    const isCreator = t.created_by === user.id;

    if (!isPayer && !isReceiver && !isCreator) return false;

    // Month filter
    if (filterMonth === "thisMonth") {
      const txDate = new Date(t.due_date);
      const now = new Date();
      if (
        txDate.getMonth() !== now.getMonth() ||
        txDate.getFullYear() !== now.getFullYear()
      ) {
        return false;
      }
    } else if (filterMonth === "lastMonth") {
      const txDate = new Date(t.due_date);
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (
        txDate.getMonth() !== lastMonthDate.getMonth() ||
        txDate.getFullYear() !== lastMonthDate.getFullYear()
      ) {
        return false;
      }
    }

    // Status filter
    const isTxPaid = t.status === "paid";
    if (filterStatus === "paid" && !isTxPaid) return false;
    if (filterStatus === "pending" && isTxPaid) return false;

    // Type filter
    if (filterType === "payer" && !isPayer) return false;
    if (filterType === "receiver" && !isReceiver) return false;
    if (filterType === "creator" && (isPayer || isReceiver || !isCreator))
      return false;

    // Person filter
    if (filterPerson !== "all") {
      if (t.payer_id !== filterPerson && t.receiver_id !== filterPerson) {
        return false;
      }
    }

    return true;
  });
  const renderTxItem = (t: Transaction, overrideOwe?: boolean) => {
    const iAmPayer = t.payer_id === user.id;
    const otherPersonId = iAmPayer ? t.receiver_id : t.payer_id;
    const otherPerson = usersInfo[otherPersonId];

    // If I am paying, it's negative for my wallet. If I am receiving, it's positive.
    const isOwe = overrideOwe !== undefined ? overrideOwe : iAmPayer;
    const isPaid = t.status === "paid";

    let subRootStatus = t.status;

    if (t.type === "subscription" && t.group_id) {
      const root = transactions.find((x) => x.id === t.group_id);
      if (root) {
        subRootStatus = root.status;
      }
    }

    return (
      <div
        key={t.id}
        className={`tx-card ${isPaid ? "paid-card" : ""}`}
        onClick={() => navigate(`/transactions/${t.id}`)}
        style={{ cursor: "pointer" }}
      >
        <div className="tx-main">
          <div className="tx-info">
            <h4>
              {t.description}
              {t.type === "subscription" && (
                <span
                  className={`sub-badge ${subRootStatus === "cancelled" ? "cancelled" : "active"}`}
                >
                  {subRootStatus === "cancelled"
                    ? "Assinatura Cancelada"
                    : "Assinatura Ativa"}
                </span>
              )}
            </h4>
            <span className="tx-date">
              {new Date(t.due_date || t.date).toLocaleDateString("pt-BR")}
            </span>
            <span className="tx-who">
              {isOwe
                ? `Pagar para ${formatName(otherPerson?.name)}`
                : `Receber de ${formatName(otherPerson?.name)}`}
            </span>
          </div>

          <div className="tx-amount-section">
            <p
              className={`tx-amount ${isOwe ? "negative" : "positive"} ${isPaid ? "faded" : ""}`}
            >
              {formatCurrency(t.amount)}
            </p>
            <div
              className={`status-btn ${isPaid ? "paid-btn" : "pending-btn"}`}
            >
              {isPaid ? <Check size={16} /> : <Clock size={16} />}
              {isPaid ? "Pago" : "Pendente"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TransactionGroup = ({ txs }: { txs: Transaction[] }) => {
    const [isOpen, setIsOpen] = useState(false);

    // For grouping in history, total might be weird if I am mixed payer/receiver.
    // Generally user creates identical recurring for the SAME role. Let's assume the role of the first item
    const firstItem = txs[0];
    const allPaid = txs.every(t => t.status === 'paid');

    // Sum amount relative to my direction?
    let netAmount = 0;
    txs.forEach(t => {
      if (t.payer_id === user.id) netAmount -= t.amount;
      else if (t.receiver_id === user.id) netAmount += t.amount;
    });

    const absAmount = Math.abs(netAmount);
    const showsAsOwe = netAmount < 0;

    return (
      <div className="history-group-container fade-in">
        <div
          className={`tx-card group-card ${allPaid ? "paid-card" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: "pointer" }}
        >
          <div className="tx-main">
            <div className="tx-info">
              <h4>
                {firstItem.description} <span className="group-badge">{txs.length}</span>
              </h4>
              <span className="tx-date">
                Vários fechamentos
              </span>
            </div>

            <div className="tx-amount-section">
              <p className={`tx-amount ${showsAsOwe ? "negative" : "positive"} ${allPaid ? "faded" : ""}`}>
                {formatCurrency(absAmount)}
              </p>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="history-group-children">
            {txs.map(t => renderTxItem(t))}
          </div>
        )}
      </div>
    )
  };

  return (
    <div className="transactions-container">
      <h2>Histórico</h2>

      <div className="filters-bar">
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

          <button
            className={`filter-btn active ${filterStatus === "pending" ? "payer" : filterStatus === "paid" ? "receiver" : "all"}`}
            onClick={() => {
              if (filterStatus === "pending") setFilterStatus("paid");
              else if (filterStatus === "paid") setFilterStatus("all");
              else setFilterStatus("pending");
            }}
          >
            {filterStatus === "pending"
              ? "A Pagar"
              : filterStatus === "paid"
                ? "Pagos"
                : "Todos (Status)"}
          </button>

          <button
            className={`filter-btn active ${filterType}`}
            onClick={() => {
              if (filterType === "all") setFilterType("payer");
              else if (filterType === "payer") setFilterType("receiver");
              else if (filterType === "receiver") setFilterType("creator");
              else setFilterType("all");
            }}
          >
            {filterType === "all"
              ? "Todos (Tipos)"
              : filterType === "payer"
                ? "Pagamentos"
                : filterType === "receiver"
                  ? "Recebimentos"
                  : "Criados por mim"}
          </button>

          <select
            className={`filter-btn filter-select ${filterPerson !== "all" ? "active" : ""}`}
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
          >
            <option value="all">Quem: Todos</option>
            {Object.entries(usersInfo).map(([id, u]) => {
              if (id === user.id) return null;
              return (
                <option key={id} value={id}>
                  Para: {formatName(u.name)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {myTransactions.length === 0 ? (
        <div className="empty-state">Nenhum registro encontrado.</div>
      ) : (
        <div className="tx-list">
          {user?.group_recurring === false ? (
            myTransactions.map(t => renderTxItem(t))
          ) : (
            // Grouped processing
            (() => {
              const grouped: Record<string, Transaction[]> = {};
              myTransactions.forEach(t => {
                const key = t.description.trim().toLowerCase();
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(t);
              });

              return Object.entries(grouped).map(([key, txs]) => {
                if (txs.length === 1) return renderTxItem(txs[0]);
                return <TransactionGroup key={key} txs={txs} />;
              });
            })()
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;
