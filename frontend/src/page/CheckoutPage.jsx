import React, { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Alert,
  Paper,
  Typography,
} from "@mui/material";
import api from "../config/axios";
import stripePromise from "../config/stripe";
import CheckoutForm from "../components/CheckoutForm";

export default function CheckoutPage() {
  const location = useLocation();
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCheckoutSession = async () => {
      const cartData = location.state;

      if (!cartData?.eventId || !cartData?.cartItems) {
        setError("Invalid checkout session. Please try again.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/payments/checkout", cartData);
        setClientSecret(response.data.clientSecret);
        setOrderId(response.data.orderId);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            "Failed to initialize payment. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutSession();
  }, [location.state]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Preparing payment...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" py={4}>
      <Paper sx={{ p: 4, maxWidth: 500, width: "100%" }}>
        <Typography variant="h5" mb={3}>
          Complete Your Payment
        </Typography>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
            },
          }}
        >
          <CheckoutForm orderId={orderId} />
        </Elements>
      </Paper>
    </Box>
  );
}