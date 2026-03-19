import { useEffect, useState } from "react";
import { useAuth, API_URL } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatName } from "../utils/formatName";
import NotificationsBell from "../components/NotificationsBell";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

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

interface PeerDetails {
  totalIowe: number;
  totalToReceive: number;
  netBalance: number;
  pendingTransactions: Transaction[];
  paidTransactions: Transaction[];
}

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usersInfo, setUsersInfo] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<
    "thisMonth" | "lastMonth" | "all"
  >("thisMonth");

  // State for expandable details
  const [expandedPeer, setExpandedPeer] = useState<string | null>(null);
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({
    pendentes: true,
    pagas: false,
  });

  useEffect(() => {
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

    fetchData();
  }, [token]);

  if (loading || !user) {
    return <div className="loading-state">Carregando resumo...</div>;
  }

  // Helper variables for filtering dates
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

  // Filter relevant transactions based on month and participation
  const filteredTx = transactions.filter((t) => {
    const isPayer = t.payer_id === user.id;
    const isReceiver = t.receiver_id === user.id;
    const isCreator = t.created_by === user.id;

    if (!isPayer && !isReceiver && !isCreator) return false;

    if (filterMonth === "thisMonth") {
      if (t.due_date < currentMonthStart || t.due_date > currentMonthEnd) return false;
    } else if (filterMonth === "lastMonth") {
      if (t.due_date < lastMonthStart || t.due_date > lastMonthEnd) return false;
    }

    return true;
  });

  // Calculate my overall summary (pending only)
  let totalIowe = 0;
  let totalToReceive = 0;

  // Group by peer
  const peersData: Record<string, PeerDetails> = {};

  filteredTx.forEach((t) => {
    const iAmPayer = t.payer_id === user.id;
    const iAmReceiver = t.receiver_id === user.id;

    // Ignore transactions where user is only creator
    if (!iAmPayer && !iAmReceiver) return;

    const peerId = iAmPayer ? t.receiver_id : t.payer_id;

    if (!peersData[peerId]) {
      peersData[peerId] = {
        totalIowe: 0,
        totalToReceive: 0,
        netBalance: 0,
        pendingTransactions: [],
        paidTransactions: [],
      };
    }

    const peer = peersData[peerId];

    if (t.status === "pending") {
      peer.pendingTransactions.push(t);
      if (iAmPayer) {
        peer.totalIowe += t.amount;
        totalIowe += t.amount;
      }
      if (iAmReceiver) {
        peer.totalToReceive += t.amount;
        totalToReceive += t.amount;
      }
    } else if (t.status === "paid") {
      peer.paidTransactions.push(t);
    }
  });

  Object.values(peersData).forEach(peer => {
    peer.netBalance = peer.totalToReceive - peer.totalIowe;
  });

  const overallNetBalance = totalToReceive - totalIowe;

  const togglePeerExpander = (peerId: string) => {
    if (expandedPeer === peerId) {
      setExpandedPeer(null);
    } else {
      setExpandedPeer(peerId);
      // Reset lists state when opening a new peer
      setExpandedLists({ pendentes: true, pagas: false });
    }
  };

  const toggleListType = (e: React.MouseEvent, type: "pendentes" | "pagas") => {
    e.stopPropagation();
    setExpandedLists(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const renderTransactionGroup = (transactionsList: Transaction[]) => {
    // If the grouping is disabled OR there's only 1 item, render flats
    if (user?.group_recurring === false) {
      return transactionsList.map(t => renderTransactionItem(t));
    }

    // Grouping logic by description
    const grouped: Record<string, Transaction[]> = {};

    transactionsList.forEach(t => {
      // Create a normalized key
      const key = t.description.trim().toLowerCase();
      // Only group if we have identically named recurring or at least it happens more than once? 
      // The requirement says: Group identical transactions mapping by t.description.
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    const elements: React.ReactNode[] = [];

    Object.entries(grouped).forEach(([key, txs]) => {
      if (txs.length === 1) {
        // Render single item
        elements.push(renderTransactionItem(txs[0]));
      } else {
        // Render Group Component
        elements.push(<TransactionGroup key={key} txs={txs} />);
      }
    });

    return elements;
  };

  const renderTransactionItem = (t: Transaction) => {
    const isOwe = t.payer_id === user.id;
    return (
      <div
        key={t.id}
        className="detail-tx-item"
        onClick={() => navigate(`/transactions/${t.id}`)}
        style={{ cursor: "pointer" }}
      >
        <div className="detail-tx-info">
          <p className="detail-tx-desc">{t.description}</p>
          <span className="detail-tx-date">{new Date(t.date).toLocaleDateString("pt-BR")}</span>
        </div>
        <p className={`detail-tx-amount ${isOwe ? "negative" : "positive"}`}>
          {formatCurrency(t.amount)}
        </p>
      </div>
    );
  };

  const TransactionGroup = ({ txs }: { txs: Transaction[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const totalAmount = txs.reduce((sum, current) => sum + current.amount, 0);
    // Determine direction from the first item (grouped transactions share the same role)
    const isOwe = txs[0].payer_id === user.id;

    return (
      <div className="tx-group-container">
        <div
          className="detail-tx-item group-header"
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: "pointer", backgroundColor: isOpen ? 'var(--bg-color)' : '' }}
        >
          <div className="detail-tx-info">
            <p className="detail-tx-desc">
              {isOpen ? <ChevronDown size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> : <ChevronRight size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
              {txs[0].description} <span className="group-badge">{txs.length}</span>
            </p>
            <span className="detail-tx-date">Vários fechamentos</span>
          </div>
          <p className={`detail-tx-amount ${isOwe ? "negative" : "positive"}`}>
            {formatCurrency(totalAmount)}
          </p>
        </div>

        {isOpen && (
          <div className="group-children">
            {txs.map(t => renderTransactionItem(t))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="user-profile">
          <img
            src={user.picture}
            alt={user.name}
            className="avatar"
            referrerPolicy="no-referrer"
          />
          <div className="user-greeting">
            <p>Olá,</p>
            <h2>{formatName(user.name)}</h2>
          </div>
        </div>
        <NotificationsBell />
      </header>

      <div className="dashboard-filters">
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

      <section className="summary-cards">
        <div className="card total-balance">
          <p>Saldo Líquido</p>
          <h1 className={overallNetBalance >= 0 ? "positive" : "negative"}>
            {formatCurrency(overallNetBalance)}
          </h1>
        </div>
        <div className="card-row">
          <div className="card sub-card receive">
            <p>A Receber</p>
            <h3>{formatCurrency(totalToReceive)}</h3>
          </div>
          <div className="card sub-card pay">
            <p>A Pagar</p>
            <h3>{formatCurrency(totalIowe)}</h3>
          </div>
        </div>
      </section>

      <section className="dynamic-balances">
        <h3>Sua situação detalhada</h3>

        {Object.keys(peersData).length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma transação encontrada no período selecionado.</p>
          </div>
        ) : (
          <div className="balances-list">
            {Object.entries(peersData).map(([peerId, peerData]) => {
              const peer = usersInfo[peerId];
              if (!peer) return null;

              // Only show in the list if there's SOME transaction (paid or pending)
              if (peerData.pendingTransactions.length === 0 && peerData.paidTransactions.length === 0) return null;

              const isExpanded = expandedPeer === peerId;
              const hasPendencies = peerData.netBalance !== 0;
              const iOweOverall = peerData.netBalance < 0;
              const absNetBalance = Math.abs(peerData.netBalance);

              return (
                <div key={peerId} className={`balance-wrapper ${isExpanded ? "expanded" : ""}`}>
                  <div
                    className="balance-item"
                    onClick={() => togglePeerExpander(peerId)}
                  >
                    <div className="peer-info">
                      {peer.picture ? (
                        <img
                          src={peer.picture}
                          alt={peer.name}
                          className="peer-avatar"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="peer-avatar" style={{ backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                          P
                        </div>
                      )}
                      <span>{formatName(peer.name)}</span>
                    </div>
                    <div className="peer-amount">
                      {hasPendencies ? (
                        <>
                          <p className="status">{iOweOverall ? "Você deve" : "Te deve"}</p>
                          <p className={`amount ${iOweOverall ? "negative" : "positive"}`}>
                            {formatCurrency(absNetBalance)}
                          </p>
                        </>
                      ) : (
                        <p className="status" style={{ color: 'var(--success-color)' }}>Tudo quite</p>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="peer-details">
                      <div className="peer-details-summary">
                        <div className="stat-box pay">
                          <p>Você deve</p>
                          <span>{formatCurrency(peerData.totalIowe)}</span>
                        </div>
                        <div className="stat-box receive">
                          <p>A receber</p>
                          <span>{formatCurrency(peerData.totalToReceive)}</span>
                        </div>
                      </div>

                      <button className="btn-pay-pending" onClick={(e) => { e.stopPropagation(); navigate(`/pay/${peerId}`); }}>
                        Pagar Pendentes
                      </button>

                      <div className="collapsible-section">
                        <div
                          className="collapsible-header"
                          onClick={(e) => toggleListType(e, "pendentes")}
                        >
                          <h4>Pendentes ({peerData.pendingTransactions.length})</h4>
                          {expandedLists.pendentes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {expandedLists.pendentes && (
                          <div className="collapsible-content">
                            {peerData.pendingTransactions.length > 0 ? (
                              renderTransactionGroup(peerData.pendingTransactions)
                            ) : (
                              <p className="empty-sub">Nenhuma pendente.</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="collapsible-section">
                        <div
                          className="collapsible-header"
                          onClick={(e) => toggleListType(e, "pagas")}
                        >
                          <h4>Pagos ({peerData.paidTransactions.length})</h4>
                          {expandedLists.pagas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {expandedLists.pagas && (
                          <div className="collapsible-content">
                            {peerData.paidTransactions.length > 0 ? (
                              renderTransactionGroup(peerData.paidTransactions)
                            ) : (
                              <p className="empty-sub">Nenhum pago.</p>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
