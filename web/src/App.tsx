import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";
import NewTransaction from "./pages/NewTransaction";
import Settings from "./pages/Settings";
import ManageRecurring from "./pages/ManageRecurring";
import ManagePaymentMethods from "./pages/ManagePaymentMethods";
import PayPending from "./pages/PayPending";

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pay/:peerId" element={<PayPending />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="transactions/:id" element={<TransactionDetails />} />
        <Route path="new" element={<NewTransaction />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/recurring" element={<ManageRecurring />} />
        <Route path="settings/payment-methods" element={<ManagePaymentMethods />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
