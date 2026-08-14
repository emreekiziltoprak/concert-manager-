import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button, Alert, CircularProgress } from "@mui/material";

export default function CheckoutForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="stripe-element-wrapper">
        <PaymentElement />
      </div>

      {errorMessage && (
        <Alert severity="error" className="alert-spacing">
          {errorMessage}
        </Alert>
      )}

      <Button type="submit" variant="contained" color="primary" size="large" fullWidth disabled={!stripe || isProcessing}>
        {isProcessing ? (
          <>
            <CircularProgress size={20} className="btn-spinner" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}
