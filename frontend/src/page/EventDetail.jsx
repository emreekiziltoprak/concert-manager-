import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useNavigate, useParams } from "react-router";
import { useCart } from "../context/cartContext";
import api from "../config/axios";
import { useAuth } from "../authContext/authcontext";
import { v4 as uuidv4 } from "uuid";
export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imdempotencyK, setIdempotencyKey] = useState(uuidv4());
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false); // 🚀 Yeni: Ödeme yüklenme durumu
  
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data.event);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch event:", error);
        alert("Etkinlik detayları yüklenemedi");
        navigate(-1);
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  if (loading) {
    return <Container sx={{ py: 4 }}><Typography>Yükleniyor...</Typography></Container>;
  }

  if (!event) {
    return <Container sx={{ py: 4 }}><Typography>Etkinlik bulunamadı</Typography></Container>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "PUBLISHED": return "success";
      case "CANCELLED": return "error";
      case "COMPLETED": return "info";
      case "ARCHIVED": return "warning";
      default: return "default";
    }
  };

  // Deactivating a ticket type is what the API tells a manager to do when a
  // delete is refused because orders reference it, so the buyer view has to
  // honour the flag or "deactivate" means nothing.
  const availableTicketTypes = (event.ticketTypes || []).filter(
    (ticketType) => ticketType.isActive !== false
  );

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ textAlign: "right", mb: 2 }}>
        <Button variant="text" size="small" onClick={() => navigate(-1)}>
          ← Geri
        </Button>
      </Box>
      
      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
        <CardMedia
          component="img"
          height="200"
          sx={{ objectFit: "cover" }}
          image={
            event.coverImageUrl ||
            "https://via.placeholder.com/800x400?text=Event+Image"
          }
          alt={event.title}
        />
        
        <CardContent sx={{ p: 4 }}>
          {/* TITLE + STATUS */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              {event.title}
            </Typography>
            <Chip
              label={event.status}
              size="small"
              color={getStatusColor(event.status)}
            />
          </Stack>
          
          {/* DESCRIPTION */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {event.description}
          </Typography>
          
          {/* DATE AND TIME */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthIcon fontSize="medium" />
              <Typography variant="body2">
                {new Date(event.startDate).toLocaleString("tr-TR", { 
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })} - {new Date(event.endDate).toLocaleString("tr-TR", {
                  hour: '2-digit', minute: '2-digit'
                })}
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnIcon fontSize="medium" />
              <Typography variant="body2">{event.address}</Typography>
            </Stack>
          </Stack>
          
          {/* CAPACITY */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="500">
              Kapasite: {event.capacity} kişi
            </Typography>
          </Stack>
          
          {/* TICKET TYPES */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              Bilet Tipleri
            </Typography>
            {availableTicketTypes.length === 0 && (
              <Typography color="text.secondary">
                Bu etkinlik için şu anda satışta bilet bulunmuyor.
              </Typography>
            )}
            <Grid container spacing={3}>
              {availableTicketTypes.map((ticketType) => (
                <Grid item xs={12} sm={6} md={4} key={ticketType.id}>
                  <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {ticketType.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Kategori: {ticketType.category}
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                        {ticketType.price} ₺
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        {ticketType.totalCount - ticketType.soldCount} adet available
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        label="Adet"
                        value={quantities[ticketType.id] || 0}
                        onChange={(e) => setQuantities(prev => ({
                          ...prev,
                          [ticketType.id]: Math.max(0, parseInt(e.target.value) || 0)
                        }))}
                        inputProps={{ min: 0, max: ticketType.totalCount }}
                        sx={{ width: '100%' }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* ACTION BUTTONS */}
          <Box sx={{ textAlign: "right", mb: 4 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                variant="outlined" 
                size="large"
                onClick={() => {
                  Object.entries(quantities).forEach(([ticketTypeId, count]) => {
                    if (count > 0) {
                      addToCart({
                        eventId: event.id,
                        ticketTypeId,
                        count,
                        price: event.ticketTypes.find(t => t.id === ticketTypeId)?.price
                      });
                    }
                  });
                  alert("Sepete eklendi!");
                }}
              >
                Sepete Ekle
              </Button>
              
              <Button 
                variant="contained" 
                size="large"
                disabled={checkoutLoading}
                onClick={async () => {
                  const cartItems = Object.entries(quantities)
                    .filter(([_, count]) => count > 0)
                    .map(([ticketTypeId, count]) => ({
                      ticketTypeId,
                      count: parseInt(count, 10)
                    }));
                  
                  if (cartItems.length === 0) {
                    alert("Lütfen en az bir bilet seçin");
                    return;
                  }
                  
                  setCheckoutLoading(true);
                  try {
                    const response = await api.post("/payments/checkout", {
                      eventId: event.id,
                      cartItems
                    }, {headers: {
                        "Idempotency-Key": `${imdempotencyK}-${user.userId}`,
                      },});

                    const { status, clientSecret, orderId } = response.data;

                    setIdempotencyKey(uuidv4());
                    if (status === "SUCCESS") {
                      navigate("/payment-success", { state: { orderId } });
                      return;
                    }

                    if (status === "PROCESSING") {
                      alert("Ödemeniz banka tarafından kontrol ediliyor. Sonuçlandığında e-posta ile bilgilendirileceksiniz.");
                      return;
                    }

                    navigate("/checkout", {
                      state: { clientSecret, orderId }
                    });

                  } catch (err) {
                    console.error("Checkout error:", err);
                    alert(err.response?.data?.error || "Ödeme başlatılamadı, lütfen tekrar deneyin.");
                  } finally {
                    setCheckoutLoading(false);
                  }
                }}
              >
                {checkoutLoading ? "Hazırlanıyor..." : "Ödemeye Geç"}
              </Button>
            </Stack>
          </Box>
          
          {/* BACK BUTTON */}
          <Box sx={{ textAlign: "right" }}>
            <Button variant="contained" size="medium" onClick={() => navigate(-1)}>
              Geri Dön
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
} 