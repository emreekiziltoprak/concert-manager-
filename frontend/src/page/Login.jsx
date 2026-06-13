import { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Typography,
  Button,
  Box,
  Stack,
  Divider,
} from "@mui/material";
import axios from "axios";
import api from "../config/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext/authcontext";

function AuthPage() {
  const nav = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const {login} = useAuth();
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
  
    const url = isLogin ? "/auth/login" : "/auth/register";

    const body = isLogin
      ? { email: form.email, password: form.password }
      : form;

    await api.post(url, body).then((resp)=> {
      if(resp.data?.token)
      {
        login(resp.data.token);
        localStorage.setItem("user", JSON.stringify(resp.data.user));
        nav("/");

      }
    })
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 4,
            backdropFilter: "blur(10px)",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight="bold" textAlign="center">
              {isLogin ? "Welcome Back" : "Create Account"}
            </Typography>

            <Typography
              variant="body2"
              textAlign="center"
              color="text.secondary"
            >
              {isLogin
                ? "Login to continue to your account"
                : "Register to start using the app"}
            </Typography>

            <Divider />

            <Stack spacing={2}>
              {!isLogin && (
                <TextField
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  fullWidth
                />
              )}

              <TextField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
              />

              <Button
                variant="contained"
                size="large"
                sx={{
                  py: 1.2,
                  fontWeight: "bold",
                  borderRadius: 2,
                  textTransform: "none",
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                }}
                onClick={handleSubmit}
              >
                {isLogin ? "Login" : "Sign Up"}
              </Button>

              <Button
                onClick={() => setIsLogin(!isLogin)}
                sx={{ textTransform: "none" }}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Login"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default AuthPage;