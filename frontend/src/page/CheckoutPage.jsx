import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation, Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import stripePromise from "../config/stripe";
import CheckoutForm from "../components/CheckoutForm";

export default function CheckoutPage() {
  const location = useLocation();

  // Veriler EventDetail sayfasındaki butona tıklandığında hazırlanıp buraya gönderiliyor
  const { clientSecret, orderId } = location.state || {};

  // Eğer doğrudan URL yazılarak bu sayfaya girilmeye çalışılırsa veya veri yoksa ana sayfaya/sepete postala
  if (!clientSecret || !orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="centered-panel">
      <div className="centered-panel__card">
        <Typography variant="h5" className="section__title">
          Ödemenizi Tamamlayın
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
      </div>
    </div>
  );
}
