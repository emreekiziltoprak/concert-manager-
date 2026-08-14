import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Typography, Button, Alert, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cartContext";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const { clearCart } = useCart();

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status");

    if (!redirectStatus || redirectStatus === "succeeded") {
      setStatus("success");
      clearCart();
      return;
    }

    if (redirectStatus === "processing") {
      setStatus("processing");
      return;
    }

    setStatus("failed");
  }, [searchParams, clearCart]);

  if (status === "loading") {
    return (
      <div className="centered-panel">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="centered-panel">
      <div className="centered-panel__card">
        {status === "success" && (
          <>
            <CheckCircleIcon color="success" className="status-icon" />
            <Typography variant="h4" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" className="alert-spacing">
              Thank you for your purchase. Your tickets have been confirmed.
              Check your email for the confirmation and ticket details.
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate("/events")}>
              Back to Events
            </Button>
          </>
        )}

        {status === "processing" && (
          <>
            <CircularProgress className="alert-spacing" />
            <Typography variant="h4" gutterBottom>
              Payment Processing
            </Typography>
            <Alert severity="info" className="alert-spacing">
              Your bank is still reviewing this payment. We will email your
              tickets as soon as it clears — there is no need to pay again.
            </Alert>
            <Button variant="contained" size="large" onClick={() => navigate("/events")}>
              Back to Events
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <ErrorIcon color="error" className="status-icon" />
            <Typography variant="h4" gutterBottom>
              Payment Failed
            </Typography>
            <Alert severity="error" className="alert-spacing">
              Your payment could not be processed. Please try again.
            </Alert>
            <Button variant="contained" size="large" onClick={() => navigate("/events")}>
              Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
