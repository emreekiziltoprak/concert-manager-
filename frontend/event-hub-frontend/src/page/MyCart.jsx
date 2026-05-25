import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useCart } from "../context/cartContext";
import api from "../config/axios";

export default function MyCart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCartData = async () => {
      if (cartItems.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const eventIds = [...new Set(cartItems.map(item => item.eventId))];
        const eventsData = {};

        for (const eventId of eventIds) {
          const response = await api.get(`/events/${eventId}`);
          eventsData[eventId] = response.data.event;
        }

        const enrichedCart = cartItems.map(item => ({
          ...item,
          event: eventsData[item.eventId],
          ticketType: eventsData[item.eventId]?.ticketTypes?.find(t => t.id === item.ticketTypeId)
        }));

        setCartData(enrichedCart);
      } catch (error) {
        console.error("Failed to fetch cart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [cartItems]);

  const totalAmount = cartData.reduce((sum, item) => {
    return sum + (item.ticketType?.price || 0) * item.count;
  }, 0);

  const handleCheckout = () => {
    const cartItemsArray = cartItems.map(item => ({
      ticketTypeId: item.ticketTypeId,
      count: item.count
    }));
    
    if (cartItemsArray.length === 0) {
      alert("Sepetiniz boş");
      return;
    }

    const eventId = cartItems[0].eventId;
    navigate("/checkout", { state: { cartItems: cartItemsArray, eventId } });
  };

  if (loading) {
    return <Container sx={{ py: 4 }}><Typography>Loading...</Typography></Container>;
  }

  if (cartData.length === 0) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Sepetiniz Boş</Typography>
        <Button variant="contained" onClick={() => navigate("/events")}>
          Etkinliklere Dön
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Sepetim
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {cartData.map((item, index) => (
            <Card key={`${item.eventId}-${item.ticketTypeId}`} sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{item.event?.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.ticketType?.name} - {item.ticketType?.price} ₺ x {item.count}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="primary">
                      {(item.ticketType?.price * item.count).toFixed(2)} ₺
                    </Typography>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => removeFromCart(item.ticketTypeId, item.eventId)}
                    >
                      Sil
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: "sticky", top: 20 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Özet
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Toplam:</Typography>
                  <Typography fontWeight="bold">{totalAmount.toFixed(2)} ₺</Typography>
                </Stack>
              </Stack>
              <Stack spacing={1}>
                <Button variant="contained" fullWidth onClick={handleCheckout}>
                  Ödemeye Geç
                </Button>
                <Button variant="outlined" fullWidth onClick={() => navigate("/events")}>
                  Etkinliklere Dön
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}