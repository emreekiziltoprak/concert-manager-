import React, { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Typography, CircularProgress, Alert, Divider } from "@mui/material";
import api from "../config/axios";
import { QRCodeSVG } from 'qrcode.react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users/profile");
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile. Please try again later.");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Alert severity="warning">No profile data found.</Alert>
      </Box>
    );
  }

  const { fullName, email, avatarUrl, bio, phoneNumber, role, orders = [] } = profile;

  // Sort orders by creation date (newest first)
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        {avatarUrl ? (
          <Box
            component="img"
            src={avatarUrl}
            alt="Avatar"
            sx={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ width: 80, height: 80, bgcolor: "grey.300", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="h6">{fullName?.charAt(0) || "?"}</Typography>
          </Box>
        )}
        <Box sx={{ ml: 3 }}>
          <Typography variant="h4">{fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
          {bio && (
            <Typography variant="body1" mt={1}>
              {bio}
            </Typography>
          )}
          {phoneNumber && (
            <Typography variant="body2" mt={1}>
              {phoneNumber}
            </Typography>
          )}
          <Typography variant="body2" mt={1}>
            Role: {role}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          My Orders
        </Typography>
        {sortedOrders.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1">
              You haven't purchased any tickets yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => window.location.href = "/events"}
            >
              Browse Events
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {sortedOrders.map((order) => {
              const event = order.event;
              const orderDate = new Date(order.createdAt).toLocaleString();

              return (
                <Card key={order.id} sx={{ border: "1px solid grey.300" }}>
                  <CardContent>
                    {event && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" component="div">
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(event.startDate).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Order Date: {orderDate}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {order.orderItems && order.orderItems.length > 0 ? (
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2 }}>
                        {order.orderItems.map((item) => {
                          const ticketType = item.ticketType;
                          const tickets = item.tickets || [];

                          return (
                            <Box key={item.id} sx={{ border: "1px solid grey.200", borderRadius: 1, p: 2 }}>
                              <Typography variant="body1" color="text.secondary" gutterBottom>
                                Ticket Type:
                              </Typography>
                              <Typography variant="h6" gutterBottom>
                                {ticketType?.name || "Standard"}
                              </Typography>
                              
                              {tickets.map((ticket) => {
                                const isUsed = ticket.isUsed ?? false;
                                return (
                                  <Box key={ticket.id} sx={{ position: "relative", mt: 1, p: 1, border: "1px dashed grey.300", borderRadius: 1, opacity: isUsed ? 0.6 : 1 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                      <QRCodeSVG
                                        value={ticket.id}
                                        size={100}
                                        level="H"
                                        includeMargin={false}
                                      />
                                      <Typography variant="body2" mt={1}>
                                        Ticket ID: {ticket.id}
                                      </Typography>
                                      {isUsed && (
                                        <Box sx={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", px: 1, borderRadius: 0.5 }}>
                                          <Typography variant="caption">Used</Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No tickets in this order.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <Box sx={{ textAlign: "center", mt: 6 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => window.location.href = "/events"}
        >
          Browse Events
        </Button>
      </Box>
    </Box>
  );
};

export default Profile;