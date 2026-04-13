import { useState } from "react";
import { useAuth, API_URL } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { formatName } from "../utils/formatName";
import { isSupportedPixKey, normalizePixKey } from "../utils/pixPayload";
import { LogOut, Link } from "lucide-react";
import Dialog from "../components/Dialog";
import "./Settings.css";

const Settings = () => {
  const { user, logout, token } = useAuth();
  const { theme, fontSize, setPreferences } = useConfig();
  const [saving, setSaving] = useState(false);
  const [savingPix, setSavingPix] = useState(false);
  const [pixKey, setPixKey] = useState(user?.pix_key || "");
  const [inviteMessage, setInviteMessage] = useState("");

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "alert" | "error";
  }>({ isOpen: false, title: "", message: "", type: "info" });

  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }));

  const savePixKey = async () => {
    const normalizedPixKey = normalizePixKey(pixKey);
    const hasPixKey = normalizedPixKey.length > 0;
    if (hasPixKey && !isSupportedPixKey(pixKey)) {
      setDialogState({
        isOpen: true,
        type: "alert",
        title: "Formato inválido",
        message: "Informe uma chave Pix válida: celular, CPF, e-mail ou chave aleatória."
      });
      return;
    }

    setSavingPix(true);
    try {
      const res = await fetch(`${API_URL}/users/me/pix`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pix_key: normalizedPixKey || null }),
      });

      if (res.ok) {
        // user context will need to be re-fetched ideally, or we can just hope it syncs on next load
        // Let's trigger a light refetch from AuthContext if we could, 
        // but since we only use pixKey locally in the input state, it's fine.
        setDialogState({
          isOpen: true,
          type: "success",
          title: "Chave Salva",
          message: "A sua Chave Pix foi atualizada com sucesso."
        });
        setPixKey(normalizedPixKey);
      } else {
        setDialogState({
          isOpen: true,
          type: "error",
          title: "Erro ao Salvar",
          message: "Ocorreu um erro ao salvar a Chave Pix."
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingPix(false);
    }
  };

  const savePreferences = async (
    newTheme: "light" | "dark",
    newFontSize: "normal" | "large",
    newGroupRecurr?: boolean
  ) => {
    setSaving(true);
    const resolvedGroup = newGroupRecurr !== undefined ? newGroupRecurr : user?.group_recurring ?? true;

    try {
      const res = await fetch(`${API_URL}/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          theme: newTheme,
          font_size: newFontSize,
          group_recurring: resolvedGroup ? 1 : 0
        }),
      });

      if (res.ok) {
        setPreferences(newTheme, newFontSize, resolvedGroup);
      }
    } catch (error) {
      console.error("Error saving preferences", error);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      setInviteMessage("Gerando convite...");
      const res = await fetch(`${API_URL}/users/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Falha ao gerar convite");
      }

      const data = await res.json();
      const inviteUrl = `${window.location.origin}/login?invite=${data.token}`;

      if (navigator.share) {
        await navigator.share({
          title: "Convite Family Finance",
          text: "Acesse nosso app de finanças!",
          url: inviteUrl,
        });
        setInviteMessage("Convite compartilhado!");
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setInviteMessage("Link copiado para a área de transferência!");
      }

      setTimeout(() => setInviteMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setInviteMessage("Erro ao gerar convite.");
      setTimeout(() => setInviteMessage(""), 3000);
    }
  };

  return (
    <div className="settings-container fade-in">
      <h2>Configurações</h2>

      <div className="settings-profile">
        <img src={user?.picture} alt={user?.name} className="profile-pic" />
        <div className="profile-info">
          <h3>{formatName(user?.name)}</h3>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Recebimento Pix</h3>
        <p className="settings-desc">Sua chave Pix será usada para receber pagamentos de outros membros ao abrirem a tela de pendências.</p>

        <div className="pix-input-group">
          <input
            type="text"
            placeholder="E-mail, CPF, Celular ou Aleatória"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className="pix-input"
          />
          <button
            className="pix-save-btn"
            onClick={savePixKey}
            disabled={savingPix || user?.pix_key === pixKey}
          >
            {savingPix ? "Salvando..." : (user?.pix_key === pixKey ? "Sincronizado" : "Salvar Chave")}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Aparência e Acessibilidade</h3>

        <div className="settings-group">
          <label>Tema Visão</label>
          <div className="toggle-group">
            <button
              className={theme === "dark" ? "active" : ""}
              onClick={() => savePreferences("dark", fontSize)}
              disabled={saving}
            >
              Escuro
            </button>
            <button
              className={theme === "light" ? "active" : ""}
              onClick={() => savePreferences("light", fontSize)}
              disabled={saving}
            >
              Claro
            </button>
          </div>
        </div>

        <div className="settings-group">
          <label>Tamanho da Fonte</label>
          <div className="toggle-group">
            <button
              className={fontSize === "normal" ? "active" : ""}
              onClick={() => savePreferences(theme, "normal")}
              disabled={saving}
            >
              Normal
            </button>
            <button
              className={fontSize === "large" ? "active" : ""}
              onClick={() => savePreferences(theme, "large")}
              disabled={saving}
            >
              Grande
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Compras Recorrentes</h3>
        <p className="settings-desc">Atalhos salvos agilizam a criação de compras comuns e agrupam elas no histórico.</p>

        <div className="settings-group">
          <label>Agrupar no Histórico</label>
          <div className="toggle-group">
            <button
              className={user?.group_recurring !== false ? "active" : ""}
              onClick={() => savePreferences(theme, fontSize, true)}
              disabled={saving}
            >
              Sim
            </button>
            <button
              className={user?.group_recurring === false ? "active" : ""}
              onClick={() => savePreferences(theme, fontSize, false)}
              disabled={saving}
            >
              Não
            </button>
          </div>
        </div>

        <button className="invite-btn" style={{ marginTop: "1rem" }} onClick={() => window.location.href = "/settings/recurring"}>
          Gerenciar Atalhos
        </button>
      </div>

      <div className="settings-section">
        <h3>Formas de Pagamento Pessoais</h3>
        <p className="settings-desc">Adicione, edite banco e contas para realizar pagamentos pessoais sem envolver outros membros.</p>

        <button className="invite-btn" style={{ marginTop: "1rem" }} onClick={() => window.location.href = "/settings/payment-methods"}>
          Gerenciar Pagamentos Pessoais
        </button>
      </div>

      {user?.email === "jairofilho79@gmail.com" && (
        <div className="settings-section">
          <h3>Administração</h3>
          <button className="invite-btn" onClick={handleGenerateInvite}>
            <Link size={18} />
            Gerar Link de Convite
          </button>
          {inviteMessage && <p className="invite-msg">{inviteMessage}</p>}
        </div>
      )}

      <div className="settings-section">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          Sair do Aplicativo
        </button>
      </div>

      <Dialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={closeDialog}
        onCancel={closeDialog}
        showCancel={false}
        confirmText="OK"
      />
    </div>
  );
};

export default Settings;
