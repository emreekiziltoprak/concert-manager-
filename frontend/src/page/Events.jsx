// EventForm.jsx
import React, { useState } from "react";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { createEvent } from "../api/events";
import { useEvents } from "../hooks/useEvents";
import { useCategories } from "../hooks/useCategories";
import { statusOptions, initialEventFormValues } from "../constants/events";
import EventCard from "../components/Eventcard";
import EditEventModal from "../components/EditEventModal";

export default function EventForm() {
  const [formData, setFormData] = useState({ ...initialEventFormValues, organizerId: "" });
  const [loading, setLoading] = useState(false);
  const { categories: cats } = useCategories();
  const { events, refetch: refreshEvents } = useEvents();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto generate slug from title
    if (name === "title") {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      setFormData((prev) => ({
        ...prev,
        title: value,
        slug,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const organizerId = user?.id;
      const payload = {
        ...formData,
        organizerId: organizerId,
        startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : null,

        endDate: formData.endDate
        ? new Date(formData.endDate).toISOString()
        : null,

        latitude: formData.latitude
          ? Number(formData.latitude)
          : null,
        longitude: formData.longitude
          ? Number(formData.longitude)
          : null,
        capacity: formData.capacity
          ? Number(formData.capacity)
          : null,
      };

      await createEvent(payload);

      alert("Event created successfully!");
      setFormData({ ...initialEventFormValues, organizerId: "" });
      refreshEvents();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onSelectChange = (event) => {
    const {name, value} = event.target;

    setFormData((prevFormData) => ({
        ...prevFormData, 
        [name]: value
    }));
  }
  

  return (
    <div className="page-container">
      <div className="page-header">
        <Typography variant="h3" className="page-header__title">
          Events
        </Typography>
        <Typography variant="body1" className="page-header__subtitle">
          Put a show on sale, then manage what's already booked.
        </Typography>
      </div>

      <Paper className="form-panel">
        <Typography variant="h5" className="form-panel__title">
          Create Event
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  onChange={onSelectChange}
                  name="categoryId"
                  label="Category"
                  value={formData.categoryId}
                >
                  {cats?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Cover Image URL"
              name="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Start Date"
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              slotProps={{
                inputLabel: {
                shrink: true,
                },
            }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="End Date"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              slotProps={{
                inputLabel: {
                shrink: true,
                },
            }}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Latitude"
              name="latitude"
              type="number"
              slotProps={{ htmlInput: { step: "0.000001" } }}
              value={formData.latitude}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Longitude"
              name="longitude"
              type="number"
              slotProps={{ htmlInput: { step: "0.000001" } }}
              value={formData.longitude}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Capacity"
              name="capacity"
              type="number"
              required
              value={formData.capacity}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {statusOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

            <Grid size={12}>
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? "Saving..." : "Create Event"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <div className="section">
        <Typography variant="h5" className="section__title">
          All Events
        </Typography>

        {Array.isArray(events) && events.length > 0 ? (
          <div className="events-page__grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEventUpdated={refreshEvents}
                onEditClick={(event) => {
                  setSelectedEvent(event);
                  setEditModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <Typography className="events-page__empty">No events yet — create the first one above.</Typography>
        )}
      </div>

      <EditEventModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={selectedEvent}
        categories={cats}
        onEventUpdated={refreshEvents}
      />
    </div>
  );
}