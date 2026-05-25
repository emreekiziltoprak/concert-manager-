import { Link, useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import { useAuth } from "../authContext/authcontext";
import { useCart } from "../context/cartContext";

export default function Header() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { getCartItemCount } = useCart();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppBar position="static">
      <Toolbar>

        {/* LEFT - Logo */}
        <Typography
          variant="h6"
          sx={{ flexGrow: 1 }}
        >
          Admin Panel
        </Typography>

        {/* NAV LINKS */}
        <Box sx={{ display: "flex", gap: 2, mr: 2 }}>
          <Button color="inherit" component={Link} to="/events">
            Events
          </Button>

          <Button color="inherit" component={Link} to="/users">
            Users
          </Button>

          <Button color="inherit" component={Link} to="/categories">
            Categories
          </Button>

          <Button color="inherit" component={Link} to="/my-cart">
            <Badge badgeContent={getCartItemCount()} color="secondary">
              Sepetim
            </Badge>
          </Button>
        </Box>

        {/* LOGOUT */}
        <Button
          color="error"
          variant="contained"
          onClick={handleLogout}
        >
          Logout
        </Button>

      </Toolbar>
    </AppBar>
  );
}