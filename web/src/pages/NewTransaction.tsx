import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API_URL } from "../context/AuthContext";
import { formatName } from "../utils/formatName";
import { ArrowRightLeft, Scissors, Plus, Minus } from "lucide-react";
import Dialog from "../components/Dialog";
import "./NewTransaction.css";

interface UserOption {
  id: string;
  name: string;
  picture: string;
}

const toDateInputValue = (value: number | Date = Date.now()) => {
  const d = value instanceof Date ? value : new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateInputValue = (value: string) =>
  new Date(`${value}T12:00:00`).getTime();

const NewTransaction = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserOption[]>([]);

  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [payerId, setPayerId] = useState(user?.id || "");
  const [receiverId, setReceiverId] = useState("");
  const [date, setDate] = useState(toDateInputValue());
  const [dueDate, setDueDate] = useState(toDateInputValue());
  const [type, setType] = useState("single");
  const [installments, setInstallments] = useState("2");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split Bill State
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitTabs, setSplitTabs] = useState<{
    amountInput: string;
    payerId: string;
    receiverId: string;
    description: string;
    isPersonal: boolean;
    personalDirection: 'outgoing' | 'incoming';
    paymentMethodId: string;
  }[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showSplitError, setShowSplitError] = useState(false);

  // Recurring Shortcuts
  const [recurrings, setRecurrings] = useState<any[]>([]);
  const [showSaveRecurringPrompt, setShowSaveRecurringPrompt] = useState(false);
  const [lastSavedTxProps, setLastSavedTxProps] = useState<any>(null);

  const [isPersonal, setIsPersonal] = useState(false);
  const [personalDirection, setPersonalDirection] = useState<'outgoing' | 'incoming'>('outgoing');
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  useEffect(() => {
    const fetchInitData = async () => {
      const [usersRes, recRes, pmRes] = await Promise.all([
        fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/recurring`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/payment-methods`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
        const others = data.users.filter((u: any) => u.id !== user?.id);
        if (others.length > 0) {
          setReceiverId(others[0].id);
        } else if (data.users.length > 0) {
          setReceiverId(data.users[0].id);
        }
      }
      if (recRes.ok) {
        const data = await recRes.json();
        setRecurrings(data.recurring_purchases);
      }
      if (pmRes.ok) {
        const data = await pmRes.json();
        setPaymentMethods(data.payment_methods);
        if (data.payment_methods.length > 0) {
          setPaymentMethodId(data.payment_methods[0].id);
        }
      }
    };
    fetchInitData();
  }, [token]);

  const fillFromRecurring = (rec: any) => {
    setDescription(rec.name);
    if (rec.payer_id) setPayerId(rec.payer_id);
    if (rec.receiver_id) setReceiverId(rec.receiver_id);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const cleanDigits = digits ? parseInt(digits, 10).toString() : "";
    setAmountInput(cleanDigits);
  };

  const getDisplayAmount = (val?: string) => {
    const numericValue = parseInt(val || amountInput || "0", 10) / 100;
    return numericValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleEnableSplit = () => {
    const totalCents = parseInt(amountInput || "0", 10);
    const initialCount = 2;
    const perPerson = Math.floor(totalCents / initialCount);
    const others = users.filter(u => u.id !== user?.id);
    const defaultReceiver = others.length > 0 ? others[0].id : (users.length > 0 ? users[0].id : "");

    const tabs = Array.from({ length: initialCount }, (_, i) => ({
      amountInput: (i === 0 ? (totalCents - perPerson * (initialCount - 1)).toString() : perPerson.toString()),
      payerId: user?.id || "",
      receiverId: defaultReceiver,
      description: description ? `${description} (Conta ${i + 1})` : `Conta ${i + 1}`,
      isPersonal: false,
      personalDirection: 'outgoing' as const,
      paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : "",
    }));
    setSplitTabs(tabs);
    setActiveTab(0);
    setIsSplitMode(true);
  };

  const handleDisableSplit = () => {
    setIsSplitMode(false);
    setSplitTabs([]);
    setActiveTab(0);
  };

  const addSplitTab = () => {
    const totalCents = parseInt(amountInput || "0", 10);
    const newCount = splitTabs.length + 1;
    const perPerson = Math.floor(totalCents / newCount);
    const others = users.filter(u => u.id !== user?.id);
    const defaultReceiver = others.length > 0 ? others[0].id : (users.length > 0 ? users[0].id : "");

    const newTabs = Array.from({ length: newCount }, (_, i) => ({
      amountInput: (i === 0 ? (totalCents - perPerson * (newCount - 1)).toString() : perPerson.toString()),
      payerId: splitTabs[i]?.payerId || user?.id || "",
      receiverId: splitTabs[i]?.receiverId || defaultReceiver,
      description: splitTabs[i]?.description || (description ? `${description} (Conta ${i + 1})` : `Conta ${i + 1}`),
      isPersonal: splitTabs[i]?.isPersonal || false,
      personalDirection: splitTabs[i]?.personalDirection || 'outgoing' as const,
      paymentMethodId: splitTabs[i]?.paymentMethodId || (paymentMethods.length > 0 ? paymentMethods[0].id : ""),
    }));
    setSplitTabs(newTabs);
    setActiveTab(newCount - 1);
  };

  const removeSplitTab = () => {
    if (splitTabs.length <= 2) return;
    const totalCents = parseInt(amountInput || "0", 10);
    const newCount = splitTabs.length - 1;
    const perPerson = Math.floor(totalCents / newCount);

    const newTabs = splitTabs.slice(0, newCount).map((tab, i) => ({
      ...tab,
      amountInput: (i === 0 ? (totalCents - perPerson * (newCount - 1)).toString() : perPerson.toString()),
    }));
    setSplitTabs(newTabs);
    if (activeTab >= newCount) setActiveTab(newCount - 1);
  };

  const updateSplitTab = (index: number, field: string, value: any) => {
    setSplitTabs(prev => prev.map((tab, i) => i === index ? { ...tab, [field]: value } : tab));
  };

  const handleSplitAmountChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const cleanDigits = digits ? parseInt(digits, 10).toString() : "";
    updateSplitTab(index, 'amountInput', cleanDigits);
  };


  const handleSwapUsers = () => {
    if (isPersonal) {
      setPersonalDirection(prev => prev === 'outgoing' ? 'incoming' : 'outgoing');
    }
    const currentPayer = payerId;
    setPayerId(receiverId);
    setReceiverId(currentPayer);
  };

  const handleSaveRecurring = async () => {
    if (!lastSavedTxProps) {
      setShowSaveRecurringPrompt(false);
      navigate("/transactions");
      return;
    }

    try {
      await fetch(`${API_URL}/recurring`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: lastSavedTxProps.description,
          payer_id: lastSavedTxProps.payer_id,
          receiver_id: lastSavedTxProps.receiver_id
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setShowSaveRecurringPrompt(false);
      navigate("/transactions");
    }
  };

  const handleSkipRecurring = () => {
    setShowSaveRecurringPrompt(false);
    navigate("/transactions");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSplitMode) {
      // Split mode: create multiple transactions
      const totalCents = parseInt(amountInput || "0", 10);
      const currentParticipantBalances = getParticipantBalances();
      const currentSplitBalanceTotal = currentParticipantBalances.reduce((sum, b) => b.balance > 0 ? sum + b.balance : sum, 0);
      const txDate = fromDateInputValue(date);
      const txDueDate = fromDateInputValue(dueDate);

      const payloads = splitTabs.map(tab => {
        let finalPayer = tab.payerId;
        let finalReceiver = tab.receiverId;
        if (tab.isPersonal) {
          if (tab.personalDirection === 'outgoing') {
            finalReceiver = `pm_${tab.paymentMethodId}`;
          } else {
            finalPayer = `pm_${tab.paymentMethodId}`;
          }
        }
        return {
          description: tab.description,
          details,
          amount: parseInt(tab.amountInput || "0", 10),
          payer_id: finalPayer,
          receiver_id: finalReceiver,
          date: txDate,
          due_date: txDueDate,
          type: 'single',
          total_installments: null,
          is_personal: tab.isPersonal
        };
      });

      // Validate all tabs have required fields
      for (const p of payloads) {
        if (!p.description || p.amount === 0 || !p.payer_id || !p.receiver_id) return;
      }

      // Error if totals don't match
      if (currentSplitBalanceTotal !== totalCents) {
        setShowSplitError(true);
        return;
      }

      await submitSplitPayloads(payloads);
      return;
    }

    // Normal flow
    const amountInCents = parseInt(amountInput || "0", 10);

    let targetPayer = payerId;
    let targetReceiver = receiverId;

    if (isPersonal) {
      if (personalDirection === 'outgoing') {
        targetReceiver = `pm_${paymentMethodId}`;
      } else {
        targetPayer = `pm_${paymentMethodId}`;
      }
    }

    if (!description || amountInCents === 0 || !targetPayer || !targetReceiver || !date)
      return;

    setIsSubmitting(true);

    const txDate = fromDateInputValue(date);
    const txDueDate = fromDateInputValue(dueDate);

    const payload = {
      description,
      details,
      amount: amountInCents,
      payer_id: targetPayer,
      receiver_id: targetReceiver,
      date: txDate,
      due_date: txDueDate,
      type,
      total_installments:
        type === "installment" ? parseInt(installments, 10) : null,
      is_personal: isPersonal
    };

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const exists = recurrings.some(r => r.name.toLowerCase() === description.trim().toLowerCase());
        if (!exists) {
          setLastSavedTxProps(payload);
          setShowSaveRecurringPrompt(true);
        } else {
          navigate("/transactions");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSplitPayloads = async (payloads: any[]) => {
    setIsSubmitting(true);
    try {
      const results = await Promise.all(
        payloads.map(p =>
          fetch(`${API_URL}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(p)
          })
        )
      );
      if (results.every(r => r.ok)) {
        navigate("/transactions");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParticipantBalances = () => {
    const balances: Record<string, { name: string; paid: number; received: number; balance: number }> = {};

    const addAmount = (id: string, name: string, isPaid: boolean, amountStr: string) => {
      if (!id) return;
      const amount = parseInt(amountStr || "0", 10);
      if (amount === 0) return;

      if (!balances[id]) {
        balances[id] = { name, paid: 0, received: 0, balance: 0 };
      }
      if (isPaid) {
        balances[id].paid += amount;
      } else {
        balances[id].received += amount;
      }
      balances[id].balance = balances[id].received - balances[id].paid;
    };

    splitTabs.forEach(tab => {
      let payerId = tab.payerId;
      let receiverId = tab.receiverId;
      let payerName = users.find(u => u.id === payerId)?.name || 'Desconhecido';
      let receiverName = users.find(u => u.id === receiverId)?.name || 'Desconhecido';

      if (tab.isPersonal) {
        const pmName = paymentMethods.find(pm => pm.id === tab.paymentMethodId)?.name || 'Cartão/Conta';
        if (tab.personalDirection === 'outgoing') {
          receiverId = `pm_${tab.paymentMethodId}`;
          receiverName = pmName;
        } else {
          payerId = `pm_${tab.paymentMethodId}`;
          payerName = pmName;
        }
      }

      addAmount(payerId, payerName, true, tab.amountInput);
      addAmount(receiverId, receiverName, false, tab.amountInput);
    });

    return Object.values(balances);
  };

  const participantBalances = getParticipantBalances();
  const splitBalanceTotal = participantBalances.reduce((sum, b) => b.balance > 0 ? sum + b.balance : sum, 0);
  const totalCents = parseInt(amountInput || "0", 10);
  const splitBalancesMatch = splitBalanceTotal === totalCents && totalCents > 0;

  return (
    <div className="new-tx-container">
      <h2>Novo Registro</h2>

      {recurrings.length > 0 && (
        <div className="recurring-chips-container">
          <span className="recurring-label">Atalhos:</span>
          <div className="recurring-chips-scroll">
            {recurrings.map(rec => (
              <button
                key={rec.id}
                type="button"
                className="recurring-chip"
                onClick={() => fillFromRecurring(rec)}
              >
                {rec.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="tx-form">
        <label>
          Descrição
          <input
            type="text"
            placeholder="Ex: Supermercado"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <label>
          Detalhes / Notas (Opcional)
          <textarea
            placeholder="Informações adicionais da compra..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </label>

        <label>
          Valor
          <input
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={getDisplayAmount()}
            onChange={handleAmountChange}
            required
          />
        </label>

        {!isSplitMode ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="tx-participants-input-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                {isPersonal && personalDirection === 'incoming' ? (
                  <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                    <span className="tx-participant-label">Pagador</span>
                    <div className="tx-participant-select-control">
                      {(() => {
                        const selectedPM = paymentMethods.find(pm => pm.id === paymentMethodId);
                        if (!selectedPM) return null;
                        return selectedPM.image_url ? (
                          <img src={selectedPM.image_url} alt={selectedPM.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selectedPM.name?.[0]?.toUpperCase() || 'P'}</div>
                        );
                      })()}
                      <select
                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                        value={paymentMethodId}
                        onChange={(e) => setPaymentMethodId(e.target.value)}
                        required
                      >
                        {paymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                    <span className="tx-participant-label">Pagador</span>
                    <div className="tx-participant-select-control">
                      {(() => {
                        const selectedPayer = users.find(u => u.id === payerId);
                        if (!selectedPayer) return null;
                        return selectedPayer.picture ? (
                          <img src={selectedPayer.picture} alt={selectedPayer.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selectedPayer.name?.[0]?.toUpperCase() || 'P'}</div>
                        );
                      })()}
                      <select
                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                        value={payerId}
                        onChange={(e) => setPayerId(e.target.value)}
                        required
                        disabled={isPersonal && personalDirection === 'outgoing'}
                      >
                        {users.filter(u => (isPersonal && personalDirection === 'outgoing') || u.id !== receiverId).map((u) => (
                          <option key={u.id} value={u.id}>
                            {formatName(u.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="swap-btn"
                  onClick={handleSwapUsers}
                  title="Inverter pagador e recebedor"
                >
                  <ArrowRightLeft size={20} />
                </button>

                {isPersonal && personalDirection === 'outgoing' ? (
                  <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                    <span className="tx-participant-label">Recebedor</span>
                    <div className="tx-participant-select-control">
                      {(() => {
                        const selectedPM = paymentMethods.find(pm => pm.id === paymentMethodId);
                        if (!selectedPM) return null;
                        return selectedPM.image_url ? (
                          <img src={selectedPM.image_url} alt={selectedPM.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selectedPM.name?.[0]?.toUpperCase() || 'P'}</div>
                        );
                      })()}
                      <select
                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                        value={paymentMethodId}
                        onChange={(e) => setPaymentMethodId(e.target.value)}
                        required
                      >
                        {paymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                    <span className="tx-participant-label">Recebedor</span>
                    <div className="tx-participant-select-control">
                      {(() => {
                        const selectedReceiver = users.find(u => u.id === receiverId);
                        if (!selectedReceiver) return null;
                        return selectedReceiver.picture ? (
                          <img src={selectedReceiver.picture} alt={selectedReceiver.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selectedReceiver.name?.[0]?.toUpperCase() || 'P'}</div>
                        );
                      })()}
                      <select
                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                        value={receiverId}
                        onChange={(e) => setReceiverId(e.target.value)}
                        required
                        disabled={isPersonal && personalDirection === 'incoming'}
                      >
                        {users.filter(u => (isPersonal && personalDirection === 'incoming') || u.id !== payerId).map((u) => (
                          <option key={u.id} value={u.id}>
                            {formatName(u.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span style={{ flex: 1 }}></span>
                {!isPersonal && <span style={{ width: '46px', flexShrink: 0 }}></span>}
                <label style={{ flex: 1, margin: 0, fontWeight: 'normal', fontSize: '0.85em', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => {
                      setIsPersonal(e.target.checked);
                      if (e.target.checked) {
                        setPayerId(user?.id || "");
                        setPersonalDirection('outgoing');
                      }
                    }}
                  />
                  Pessoal
                  <span
                    className="info-icon"
                    onClick={(e) => { e.preventDefault(); setShowInfoDialog(true); }}
                    style={{ display: 'inline-flex', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--border-color)', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold' }}
                  >?</span>
                </label>
              </div>
            </div>

            <div className="tx-date-row" style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <label style={{ flex: 1 }}>
                Data da Compra
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const prevDate = date;
                    const newDate = e.target.value;
                    setDate(newDate);
                    if (dueDate === prevDate) {
                      setDueDate(newDate);
                    }
                  }}
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                Data para Pagar
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Tipo
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="single">Única</option>
                <option value="installment">Parcelada</option>
                <option value="subscription">Assinatura Mensal</option>
              </select>
            </label>

            {type === "installment" && (
              <label className="animate-reveal">
                Número de Parcelas
                <input
                  type="number"
                  min="2"
                  max="48"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  required
                />
              </label>
            )}

            <button
              type="button"
              className="split-btn"
              onClick={handleEnableSplit}
              disabled={parseInt(amountInput || "0", 10) === 0}
            >
              <Scissors size={18} />
              Dividir a Conta
            </button>
          </>
        ) : (
          /* ================== SPLIT MODE ================== */
          <div className="split-mode-container animate-reveal">
            <div className="tx-date-row" style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <label style={{ flex: 1 }}>
                Data da Compra
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const prevDate = date;
                    const newDate = e.target.value;
                    setDate(newDate);
                    if (dueDate === prevDate) setDueDate(newDate);
                  }}
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                Data para Pagar
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </label>
            </div>

            {/* Split Stats */}
            <div className="split-stats">
              <div className="split-stat-item">
                <span className="split-stat-label">Total</span>
                <span className="split-stat-value">{getDisplayAmount()}</span>
              </div>
              <div className="split-stat-item">
                <span className="split-stat-label">Balanço das contas</span>
                <span className={`split-stat-value ${splitBalancesMatch ? 'split-match' : (totalCents > 0 ? 'split-mismatch' : '')}`}>
                  {getDisplayAmount(splitBalanceTotal.toString())}
                </span>
              </div>
              <div className="split-stat-item">
                <span className="split-stat-label">Nº de contas</span>
                <span className="split-stat-value">{splitTabs.length}</span>
              </div>
            </div>

            {/* Participant Balances */}
            {participantBalances.length > 0 && (
              <div className="participant-balances animate-reveal">
                {participantBalances.map((b, i) => (
                  <div className="participant-balance-row" key={i}>
                    <div className="participant-name" title={b.name}>{formatName(b.name)}</div>
                    <div className="participant-metrics">
                      <div className="participant-metric">
                        <span className="participant-metric-label">Pagou</span>
                        <span className={`participant-metric-value ${b.paid > 0 ? 'paid' : 'neutral'}`}>
                          {b.paid > 0 ? getDisplayAmount(b.paid.toString()) : '-'}
                        </span>
                      </div>
                      <div className="participant-metric">
                        <span className="participant-metric-label">Recebeu</span>
                        <span className={`participant-metric-value ${b.received > 0 ? 'received' : 'neutral'}`}>
                          {b.received > 0 ? getDisplayAmount(b.received.toString()) : '-'}
                        </span>
                      </div>
                      <div className="participant-metric balanco">
                        <span className="participant-metric-label">Balanço</span>
                        <span className={`participant-metric-value ${b.balance > 0 ? 'received' : b.balance < 0 ? 'paid' : 'neutral'}`}>
                          {b.balance !== 0 ? getDisplayAmount(Math.abs(b.balance).toString()) : '0,00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab Header Row */}
            <div className="split-tabs-header">
              <div className="split-tabs-scroll">
                {splitTabs.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`split-tab-btn ${activeTab === i ? 'active' : ''}`}
                    onClick={() => setActiveTab(i)}
                  >
                    Conta {i + 1}
                  </button>
                ))}
              </div>
              <div className="split-tabs-actions">
                <button type="button" className="split-tab-action-btn" onClick={addSplitTab} title="Adicionar conta">
                  <Plus size={16} />
                </button>
                <button type="button" className="split-tab-action-btn" onClick={removeSplitTab} disabled={splitTabs.length <= 2} title="Remover última conta">
                  <Minus size={16} />
                </button>
              </div>
            </div>

            {/* Active Tab Content */}
            {splitTabs[activeTab] && (
              <div className="split-tab-content animate-reveal" key={activeTab}>
                <label>
                  Descrição da Conta {activeTab + 1}
                  <input
                    type="text"
                    value={splitTabs[activeTab].description}
                    onChange={(e) => updateSplitTab(activeTab, 'description', e.target.value)}
                    required
                  />
                </label>

                <label>
                  Valor da Conta
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={getDisplayAmount(splitTabs[activeTab].amountInput)}
                    onChange={(e) => handleSplitAmountChange(activeTab, e)}
                    required
                  />
                </label>

                <div className="tx-participants-input-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* PAYER SELECT */}
                  {splitTabs[activeTab].isPersonal && splitTabs[activeTab].personalDirection === 'incoming' ? (
                    <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                      <span className="tx-participant-label">Pagador</span>
                      <div className="tx-participant-select-control">
                        {(() => {
                          const selectedPM = paymentMethods.find(pm => pm.id === splitTabs[activeTab].paymentMethodId);
                          if (!selectedPM) return null;
                          return selectedPM.image_url ? (
                            <img src={selectedPM.image_url} alt={selectedPM.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selectedPM.name?.[0]?.toUpperCase() || 'P'}</div>
                          );
                        })()}
                        <select style={{ width: '100%', paddingLeft: '2.5rem' }} value={splitTabs[activeTab].paymentMethodId} onChange={e => updateSplitTab(activeTab, 'paymentMethodId', e.target.value)} required>
                          {paymentMethods.map(pm => (
                            <option key={pm.id} value={pm.id}>{pm.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                      <span className="tx-participant-label">Pagador</span>
                      <div className="tx-participant-select-control">
                        {(() => {
                          const selected = users.find(u => u.id === splitTabs[activeTab].payerId);
                          if (!selected) return null;
                          return selected.picture ? (
                            <img src={selected.picture} alt={selected.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selected.name?.[0]?.toUpperCase() || 'P'}</div>
                          );
                        })()}
                        <select style={{ width: '100%', paddingLeft: '2.5rem' }} value={splitTabs[activeTab].payerId} onChange={e => updateSplitTab(activeTab, 'payerId', e.target.value)} required disabled={splitTabs[activeTab].isPersonal && splitTabs[activeTab].personalDirection === 'outgoing'}>
                          {users.filter(u => (splitTabs[activeTab].isPersonal && splitTabs[activeTab].personalDirection === 'outgoing') || u.id !== splitTabs[activeTab].receiverId).map(u => (
                            <option key={u.id} value={u.id}>{formatName(u.name)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <button type="button" className="swap-btn" onClick={() => {
                    if (splitTabs[activeTab].isPersonal) {
                      updateSplitTab(activeTab, 'personalDirection', splitTabs[activeTab].personalDirection === 'outgoing' ? 'incoming' : 'outgoing');
                    }
                    setSplitTabs(prev => prev.map((t, i) => i === activeTab ? { ...t, payerId: t.receiverId, receiverId: t.payerId, personalDirection: t.isPersonal ? (t.personalDirection === 'outgoing' ? 'incoming' : 'outgoing') as any : t.personalDirection } : t));
                  }} title="Inverter">
                    <ArrowRightLeft size={20} />
                  </button>

                  {/* RECEIVER SELECT */}
                  {splitTabs[activeTab].isPersonal && splitTabs[activeTab].personalDirection === 'outgoing' ? (
                    <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                      <span className="tx-participant-label">Recebedor</span>
                      <div className="tx-participant-select-control">
                        {(() => {
                          const selectedPM = paymentMethods.find(pm => pm.id === splitTabs[activeTab].paymentMethodId);
                          if (!selectedPM) return null;
                          return selectedPM.image_url ? (
                            <img src={selectedPM.image_url} alt={selectedPM.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selectedPM.name?.[0]?.toUpperCase() || 'P'}</div>
                          );
                        })()}
                        <select style={{ width: '100%', paddingLeft: '2.5rem' }} value={splitTabs[activeTab].paymentMethodId} onChange={e => updateSplitTab(activeTab, 'paymentMethodId', e.target.value)} required>
                          {paymentMethods.map(pm => (
                            <option key={pm.id} value={pm.id}>{pm.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="tx-participant-select" style={{ flex: 1, minWidth: 0 }}>
                      <span className="tx-participant-label">Recebedor</span>
                      <div className="tx-participant-select-control">
                        {(() => {
                          const selected = users.find(u => u.id === splitTabs[activeTab].receiverId);
                          if (!selected) return null;
                          return selected.picture ? (
                            <img src={selected.picture} alt={selected.name} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{selected.name?.[0]?.toUpperCase() || 'P'}</div>
                          );
                        })()}
                        <select style={{ width: '100%', paddingLeft: '2.5rem' }} value={splitTabs[activeTab].receiverId} onChange={e => updateSplitTab(activeTab, 'receiverId', e.target.value)} required disabled={splitTabs[activeTab].isPersonal && splitTabs[activeTab].personalDirection === 'incoming'}>
                          {users.filter(u => (splitTabs[activeTab].isPersonal && splitTabs[activeTab].personalDirection === 'incoming') || u.id !== splitTabs[activeTab].payerId).map(u => (
                            <option key={u.id} value={u.id}>{formatName(u.name)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Personal checkbox */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ flex: 1 }}></span>
                  {!splitTabs[activeTab].isPersonal && <span style={{ width: '46px', flexShrink: 0 }}></span>}
                  <label style={{ flex: 1, margin: 0, fontWeight: 'normal', fontSize: '0.85em', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={splitTabs[activeTab].isPersonal}
                      onChange={(e) => {
                        updateSplitTab(activeTab, 'isPersonal', e.target.checked);
                        if (e.target.checked) {
                          updateSplitTab(activeTab, 'payerId', user?.id || "");
                          updateSplitTab(activeTab, 'personalDirection', 'outgoing');
                        }
                      }}
                    />
                    Pessoal
                    <span
                      onClick={(e) => { e.preventDefault(); setShowInfoDialog(true); }}
                      style={{ display: 'inline-flex', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--border-color)', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold' }}
                    >?</span>
                  </label>
                </div>
              </div>
            )}

            <button type="button" className="split-btn cancel-split" onClick={handleDisableSplit}>
              Cancelar Divisão
            </button>
          </div>
        )}

        <div className="registered-by">
          Registrado por: <strong>{formatName(user?.name)}</strong> em{" "}
          {new Date().toLocaleDateString("pt-BR")}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="submit-btn full-width"
        >
          {isSubmitting ? "Salvando..." : "Salvar Transação"}
        </button>
      </form>

      <Dialog
        isOpen={showSaveRecurringPrompt}
        title="Salvar como Recorrente"
        message={`Gostaria de salvar "${lastSavedTxProps?.description}" como um atalho? Isso facilita a criação da próxima vez!`}
        confirmText="Sim, salvar atalho"
        onConfirm={handleSaveRecurring}
        onCancel={handleSkipRecurring}
        type="info"
      />

      <Dialog
        isOpen={showInfoDialog}
        title="Formas de Pagamento Pessoais"
        message="Se a forma de pagamento que você deseja não estiver na lista, você pode cadastrá-la indo em Ajustes > Formas de Pagamento Pessoais."
        confirmText="Entendi"
        onConfirm={() => setShowInfoDialog(false)}
        onCancel={() => setShowInfoDialog(false)}
        showCancel={false}
        type="info"
      />

      <Dialog
        isOpen={showSplitError}
        title="Valores Incorretos"
        message="A soma dos balanços está diferente do total. Verifique se alguma pessoa está listada pagando ou recebendo um valor a mais ou a menos do que deveria."
        confirmText="Entendi"
        onConfirm={() => setShowSplitError(false)}
        onCancel={() => setShowSplitError(false)}
        showCancel={false}
        type="error"
      />
    </div>
  );
};

export default NewTransaction;
