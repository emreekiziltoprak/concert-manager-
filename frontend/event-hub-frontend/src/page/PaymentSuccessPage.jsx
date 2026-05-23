import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const paymentIntentClientSecret = searchParams.get(
      "payment_intent_client_secret"
    );

    if (paymentIntent && paymentIntentClientSecret) {
      setStatus("success");
    } else if (searchParams.get("redirect_status") === "failed") {
      setStatus("failed");
    } else {
      setStatus("success");
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Paper sx={{ p: 4, maxWidth: 500, width: "100%", textAlign: "center" }}>
        {status === "success" ? (
          <>
            <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Thank you for your purchase. Your tickets have been confirmed.
              Check your email for the confirmation and ticket details.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/events")}
            >
              Back to Events
            </Button>
          </>
        ) : (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Payment Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              Your payment could not be processed. Please try again.
            </Alert>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/checkout")}
            >
              Try Again
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}