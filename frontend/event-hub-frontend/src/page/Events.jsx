// EventForm.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
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
import api from "../config/axios";
import EventCard from "../components/Eventcard";
import EditEventModal from "../components/EditEventModal";

const initialState = {
  organizerId: "",
  categoryId: "",
  title: "",
  slug: "",
  description: "",
  coverImageUrl: "",
  startDate: "",
  endDate: "",
  address: "",
  latitude: "",
  longitude: "",
  capacity: "",
  status: "DRAFT",
};

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function EventForm() {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState([]);
  const [events, setEvents] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const refreshEvents = () => {
    api.get("/events").then(r => {
      setEvents(r.data.events);
    });
  };

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

  useEffect(()=>{
    api.get("/categories").then(c=>{
     setCats(c.data.categories);
    });

    api.get("/events").then(r=> {
      setEvents(r.data.events);
    });
  },[]);

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

      await api.post("/events", payload);

      alert("Event created successfully!");
      setFormData(initialState);
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
    <Paper sx={{ p: 4, height: "100%", mx: "auto" }}>
      <Typography variant="h5" mb={3}>
        Create Event
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          

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
                    <MenuItem
                        key={cat.id}
                        value={cat.id}
                    >
                        {cat.name}
                    </MenuItem>
                    ))}
            </Select>
            
        </FormControl>
          

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
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

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Cover Image URL"
              name="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
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

          <Grid item xs={12} md={6}>
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

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Latitude"
              name="latitude"
              type="number"
              inputProps={{ step: "0.000001" }}
              value={formData.latitude}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Longitude"
              name="longitude"
              type="number"
              inputProps={{ step: "0.000001" }}
              value={formData.longitude}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12}>
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

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? "Saving..." : "Create Event"}
            </Button>
          </Grid>
        </Grid>
      </Box>

<Grid container spacing={2}>
        {/* EVENTS */}
        {Array.isArray(events) && events.length > 0 && events.map((event) => {
          return (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <EventCard
                event={event}
                categories={cats}
                onEventUpdated={refreshEvents}
                onEditClick={(event) => {
                  setSelectedEvent(event);
                  setEditModalOpen(true);
                }}
              />
            </Grid>
          );
        })}
      </Grid>

      <EditEventModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={selectedEvent}
        categories={cats}
        onEventUpdated={refreshEvents}
      />
    </Paper>
  );
}