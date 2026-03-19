import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { NavLink, useSearchParams } from "react-router-dom";
import logo from "../../../logo-final.svg";
import "./Login.css";

const Login = () => {
  const { login, authError } = useAuth();
  const [searchParams] = useSearchParams();

  // Check for invite token in URL
  const rawInvite = searchParams.get("invite");
  // Some share APIs append the text message to the copied URL.
  // We split by space to get only the token part.
  const inviteToken = rawInvite ? rawInvite.split(" ")[0] : undefined;

  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      await login(credentialResponse.credential, inviteToken);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <NavLink to="/" className="brand-link" end>
          <img src={logo} alt="Família Finance" className="brand-logo" />
        </NavLink>
      </header>

      <div className="login-container">
        <div className="login-card">
          <h1>Família Finance</h1>
          <p>Gestão de gastos compartilhados e divisões da família.</p>

          {authError && <div className="login-error">{authError}</div>}

          <div className="login-button-wrapper">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                console.log("Login Failed");
              }}
              useOneTap
              shape="rectangular"
              theme="filled_blue"
              size="large"
              text="continue_with"
            />
          </div>

          {authError && (
            <p className="login-hint">
              Novos usuários só podem se cadastrar através de um link de convite
              válido enviado por um administrador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
