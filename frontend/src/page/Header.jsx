import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useAuth } from "../authContext/authcontext";
import { useCart } from "../context/cartContext";

const navLinks = [
  { to: "/events", label: "Events" },
  { to: "/users", label: "Users" },
  { to: "/categories", label: "Categories" },
  { to: "/profile", label: "Profile" },
];

export default function Header() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { getCartItemCount } = useCart();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppBar position="sticky" className="app-header">
      <div className="app-header__bar">
        <IconButton
          className="app-header__menu-btn"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label="Open navigation menu"
        >
          <MenuIcon htmlColor="#fff" />
        </IconButton>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          {navLinks.map((link) => (
            <MenuItem key={link.to} component={NavLink} to={link.to} onClick={() => setMenuAnchor(null)}>
              {link.label}
            </MenuItem>
          ))}
          <MenuItem component={NavLink} to="/my-cart" onClick={() => setMenuAnchor(null)}>
            Sepetim {getCartItemCount() ? `(${getCartItemCount()})` : ""}
          </MenuItem>
        </Menu>

        <NavLink to="/events" className="app-header__logo">
          Event<span className="app-header__logo-accent">Hub</span>
        </NavLink>

        <nav className="app-header__nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `app-header__nav-link${isActive ? " active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/my-cart"
            className={({ isActive }) => `app-header__nav-link${isActive ? " active" : ""}`}
          >
            <Badge badgeContent={getCartItemCount()} color="error">
              Sepetim
            </Badge>
          </NavLink>
        </nav>

        <div className="app-header__actions">
          <IconButton
            component={NavLink}
            to="/my-cart"
            className="app-header__cart-btn"
            aria-label="Sepetim"
          >
            <Badge badgeContent={getCartItemCount()} color="error">
              <ShoppingCartIcon htmlColor="#fff" />
            </Badge>
          </IconButton>

          <Button variant="outlined" className="app-header__logout" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </AppBar>
  );
}
