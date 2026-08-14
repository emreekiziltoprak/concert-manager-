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

        // Settled, not all: a cart holding one deleted event used to reject the
        // whole batch and leave the page looking like an empty cart.
        const responses = await Promise.allSettled(
          eventIds.map(eventId => api.get(`/events/${eventId}`))
        );

        responses.forEach((response, index) => {
          if (response.status === "fulfilled") {
            eventsData[eventIds[index]] = response.value.data.event;
          } else {
            console.error(`Failed to fetch event ${eventIds[index]}:`, response.reason);
          }
        });

        const enrichedCart = cartItems.map(item => {
          const event = eventsData[item.eventId];
          const ticketType = event?.ticketTypes?.find(t => t.id === item.ticketTypeId);

          return {
            ...item,
            event,
            ticketType,
            // The event or the ticket type is gone, or it was deactivated.
            // Cart entries live in localStorage forever, so this is reachable.
            unavailable: !ticketType || ticketType.isActive === false
          };
        });

        setCartData(enrichedCart);
      } catch (error) {
        console.error("Failed to fetch cart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [cartItems]);

  const unavailableItems = cartData.filter(item => item.unavailable);

  const totalAmount = cartData.reduce((sum, item) => {
    if (item.unavailable) return sum;
    return sum + Number(item.ticketType?.price ?? 0) * item.count;
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

    // Sending these would fail at the API with "ticket type cant be found".
    // Dropping them silently would change the order behind the user's back, so
    // ask instead.
    if (unavailableItems.length > 0) {
      alert("Sepetinizde artık satışta olmayan biletler var. Devam etmek için onları kaldırın.");
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
          {cartData.map((item) => (
            <Card
              key={`${item.eventId}-${item.ticketTypeId}`}
              sx={{ mb: 2, ...(item.unavailable && { borderColor: "error.main", borderWidth: 1, borderStyle: "solid" }) }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">
                      {item.event?.title || "Etkinlik bulunamadı"}
                    </Typography>
                    {item.unavailable ? (
                      <Typography variant="body2" color="error">
                        Bu bilet artık satışta değil.
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {item.ticketType.name} - {item.ticketType.price} ₺ x {item.count}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    {!item.unavailable && (
                      <Typography variant="h6" color="primary">
                        {(Number(item.ticketType.price) * item.count).toFixed(2)} ₺
                      </Typography>
                    )}
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
              {unavailableItems.length > 0 && (
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                  Satışta olmayan {unavailableItems.length} bilet var. Ödemeye geçmek için
                  onları sepetten kaldırın.
                </Typography>
              )}
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCheckout}
                  disabled={unavailableItems.length > 0}
                >
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