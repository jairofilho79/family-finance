import { NavLink } from "react-router-dom";
import logo from "../../../logo-final.svg";
import "./BrandHeader.css";

export default function BrandHeader() {
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

