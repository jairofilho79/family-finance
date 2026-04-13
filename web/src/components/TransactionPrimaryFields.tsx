import React from "react";
import { ArrowRightLeft } from "lucide-react";
import { formatName } from "../utils/formatName";
import "./TransactionPrimaryFields.css";

interface UserOption {
  id: string;
  name: string;
  picture?: string;
}

interface PaymentMethodOption {
  id: string;
  name: string;
  image_url?: string | null;
}

type ParticipantMode = "personal-toggle" | "mixed-options";

interface TransactionPrimaryFieldsProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  details: string;
  onDetailsChange: (value: string) => void;
  amountDisplay: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  payerId: string;
  onPayerIdChange: (value: string) => void;
  receiverId: string;
  onReceiverIdChange: (value: string) => void;
  onSwapParticipants: () => void;
  date: string;
  onDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  users: UserOption[];
  paymentMethods: PaymentMethodOption[];
  participantMode: ParticipantMode;
  isPersonal?: boolean;
  onIsPersonalChange?: (value: boolean) => void;
  personalDirection?: "outgoing" | "incoming";
  onPersonalDirectionChange?: (value: "outgoing" | "incoming") => void;
  paymentMethodId?: string;
  onPaymentMethodIdChange?: (value: string) => void;
  currentUserId?: string;
  onOpenPersonalInfo?: () => void;
  syncDueDateOnPurchaseDateChange?: boolean;
}

const avatarStyle: React.CSSProperties = {
  position: "absolute",
  left: "0.75rem",
  top: "50%",
  transform: "translateY(-50%)",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  pointerEvents: "none",
  objectFit: "cover",
};

const avatarFallbackStyle: React.CSSProperties = {
  ...avatarStyle,
  backgroundColor: "var(--border-color)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  fontWeight: "bold",
  color: "var(--text-secondary)",
};

const detailsStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-color)",
  backgroundColor: "var(--bg-color)",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  resize: "vertical",
};

const TransactionPrimaryFields = ({
  description,
  onDescriptionChange,
  details,
  onDetailsChange,
  amountDisplay,
  onAmountChange,
  payerId,
  onPayerIdChange,
  receiverId,
  onReceiverIdChange,
  onSwapParticipants,
  date,
  onDateChange,
  dueDate,
  onDueDateChange,
  users,
  paymentMethods,
  participantMode,
  isPersonal = false,
  onIsPersonalChange,
  personalDirection = "outgoing",
  onPersonalDirectionChange,
  paymentMethodId = "",
  onPaymentMethodIdChange,
  currentUserId = "",
  onOpenPersonalInfo,
  syncDueDateOnPurchaseDateChange = false,
}: TransactionPrimaryFieldsProps) => {
  const isMixedMode = participantMode === "mixed-options";

  const findSelectedOption = (id: string) => {
    if (!id) return null;
    if (id.startsWith("pm_")) {
      const pm = paymentMethods.find((item) => `pm_${item.id}` === id);
      if (!pm) return null;
      return { name: pm.name, image: pm.image_url || "", initial: pm.name?.[0] || "P" };
    }
    const usr = users.find((item) => item.id === id);
    if (!usr) return null;
    return { name: usr.name, image: usr.picture || "", initial: usr.name?.[0] || "U" };
  };

  const renderAvatar = (name: string, image: string, initial: string) => {
    if (image) {
      return <img src={image} alt={name} style={avatarStyle} referrerPolicy="no-referrer" />;
    }
    return <div style={avatarFallbackStyle}>{initial.toUpperCase()}</div>;
  };

  const renderParticipantSelect = ({
    label,
    value,
    onChange,
    oppositeValue,
    disabled,
    forcePaymentMethodOnly,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    oppositeValue: string;
    disabled?: boolean;
    forcePaymentMethodOnly?: boolean;
  }) => {
    const selectedMeta = (() => {
      if (forcePaymentMethodOnly) {
        const pm = paymentMethods.find((item) => item.id === paymentMethodId);
        if (!pm) return null;
        return { name: pm.name, image: pm.image_url || "", initial: pm.name?.[0] || "P" };
      }
      if (isMixedMode) {
        return findSelectedOption(value);
      }
      const usr = users.find((item) => item.id === value);
      if (!usr) return null;
      return { name: usr.name, image: usr.picture || "", initial: usr.name?.[0] || "U" };
    })();

    return (
      <div className="shared-participant-select" style={{ flex: 1, minWidth: 0 }}>
        <span className="shared-participant-label">{label}</span>
        <div className="shared-participant-select-control">
          {selectedMeta && renderAvatar(selectedMeta.name, selectedMeta.image, selectedMeta.initial)}
          <select
            style={{ width: "100%", paddingLeft: "2.5rem" }}
            value={forcePaymentMethodOnly ? paymentMethodId : value}
            onChange={(e) => {
              if (forcePaymentMethodOnly) {
                onPaymentMethodIdChange?.(e.target.value);
                return;
              }
              onChange(e.target.value);
            }}
            required
            disabled={disabled}
          >
            {forcePaymentMethodOnly
              ? paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))
              : (
                  <>
                    {isMixedMode &&
                      paymentMethods.map((pm) => (
                        <option key={`pm_${pm.id}`} value={`pm_${pm.id}`}>
                          {pm.name}
                        </option>
                      ))}
                    {users
                      .filter((u) => u.id !== oppositeValue || disabled)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {formatName(u.name)}
                        </option>
                      ))}
                  </>
                )}
          </select>
        </div>
      </div>
    );
  };

  const handleDateInputChange = (newDate: string) => {
    const previousDate = date;
    onDateChange(newDate);
    if (syncDueDateOnPurchaseDateChange && dueDate === previousDate) {
      onDueDateChange(newDate);
    }
  };

  return (
    <>
      <label>
        Descrição
        <input
          type="text"
          placeholder="Ex: Supermercado"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          required
        />
      </label>

      <label>
        Detalhes / Notas (Opcional)
        <textarea
          placeholder="Informações adicionais da compra..."
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          rows={3}
          style={detailsStyle}
        />
      </label>

      <label>
        Valor
        <input
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={amountDisplay}
          onChange={onAmountChange}
          required
        />
      </label>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="shared-participants-input-row">
          {participantMode === "personal-toggle" && isPersonal && personalDirection === "incoming"
            ? renderParticipantSelect({
                label: "Pagador",
                value: payerId,
                onChange: onPayerIdChange,
                oppositeValue: receiverId,
                forcePaymentMethodOnly: true,
              })
            : renderParticipantSelect({
                label: "Pagador",
                value: payerId,
                onChange: onPayerIdChange,
                oppositeValue: receiverId,
                disabled:
                  participantMode === "personal-toggle" && isPersonal && personalDirection === "outgoing",
              })}

          <button
            type="button"
            className="shared-swap-btn"
            onClick={() => {
              if (participantMode === "personal-toggle" && isPersonal && onPersonalDirectionChange) {
                onPersonalDirectionChange(personalDirection === "outgoing" ? "incoming" : "outgoing");
              }
              onSwapParticipants();
            }}
            title="Inverter pagador e recebedor"
          >
            <ArrowRightLeft size={20} />
          </button>

          {participantMode === "personal-toggle" && isPersonal && personalDirection === "outgoing"
            ? renderParticipantSelect({
                label: "Recebedor",
                value: receiverId,
                onChange: onReceiverIdChange,
                oppositeValue: payerId,
                forcePaymentMethodOnly: true,
              })
            : renderParticipantSelect({
                label: "Recebedor",
                value: receiverId,
                onChange: onReceiverIdChange,
                oppositeValue: payerId,
                disabled:
                  participantMode === "personal-toggle" && isPersonal && personalDirection === "incoming",
              })}
        </div>

        {participantMode === "personal-toggle" && (
          <div className="shared-personal-row">
            <span style={{ flex: 1 }} />
            {!isPersonal && <span style={{ width: "46px", flexShrink: 0 }} />}
            <label className="shared-personal-toggle">
              <input
                type="checkbox"
                checked={isPersonal}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onIsPersonalChange?.(checked);
                  if (checked) {
                    onPayerIdChange(currentUserId);
                    onPersonalDirectionChange?.("outgoing");
                  }
                }}
              />
              Pessoal
              <span
                className="shared-info-icon"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPersonalInfo?.();
                }}
              >
                ?
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="shared-date-row">
        <label style={{ flex: 1 }}>
          Data da Compra
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateInputChange(e.target.value)}
            required
          />
        </label>
        <label style={{ flex: 1 }}>
          Data para Pagar
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            required
          />
        </label>
      </div>
    </>
  );
};

export default TransactionPrimaryFields;
