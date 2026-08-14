import { useState } from "react";
import { TextField, Typography, Button, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext/authcontext";
import { login as loginRequest, register as registerRequest } from "../api/auth";

function AuthPage() {
  const nav = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = isLogin
      ? { email: form.email, password: form.password }
      : form;

    const request = isLogin ? loginRequest(body) : registerRequest(body);

    await request.then((resp) => {
      if (resp.data?.token) {
        login(resp.data.token);
        localStorage.setItem("user", JSON.stringify(resp.data.user));
        nav("/");
      }
    });
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <Typography variant="h4" className="login-page__title">
          {isLogin ? "Welcome Back" : "Create Account"}
        </Typography>

        <Typography variant="body2" color="text.secondary" className="login-page__subtitle">
          {isLogin ? "Login to continue to your account" : "Register to start using the app"}
        </Typography>

        <Divider className="divider-spacing" />

        <form className="login-page__form" onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} fullWidth />
          )}

          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
          />

          <Button type="submit" variant="contained" size="large">
            {isLogin ? "Login" : "Sign Up"}
          </Button>

          <Button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
