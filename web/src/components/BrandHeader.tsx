import { NavLink } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";
import logoGreen from "../../../logo-final.svg";
import logoWhite from "../../../logo-final-branca.svg";
import "./BrandHeader.css";

export default function BrandHeader() {
  const { theme } = useConfig();
  const logo = theme === "dark" ? logoWhite : logoGreen;

  return (
    <header className="brand-header">
      <NavLink to="/" className="brand-header-link" end>
        <div className="brand-logo-wrap">
          <img
            src={logo}
            alt="Family Finance"
            className="brand-logo-img"
          />
        </div>

        <div className="brand-title" aria-label="Family Finance">
          <span className="brand-title-word">Family</span>
          <span className="brand-title-word">Finance</span>
        </div>
      </NavLink>
    </header>
  );
}

