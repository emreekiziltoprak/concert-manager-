import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Stack,
  Chip,
  Box,
  Button,
  IconButton,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../config/axios";

export default function EventCard({ event, categories, onEventUpdated, onEditClick }) {
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete("/events", { data: { eventId: event.id } });
      onEventUpdated?.();
    } catch (error) {
      console.error(error);
      alert("Failed to delete event");
    }
  };

  const handleEditClick = () => {
    onEditClick?.(event);
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: 3,
        transition: "0.2s",
        "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
      }}
    >
      {/* IMAGE */}
      <CardMedia
        component="img"
        height="180"
        sx={{objectFit: "contain"}}
        image={
          event.coverImageUrl ||
          "https://via.placeholder.com/400x200?text=Event"
        }
        alt={event.title}
      />

      <CardContent>
        {/* TITLE + STATUS */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            {event.title}
          </Typography>

          <Chip
            label={event.status}
            size="small"
            color={event.status === "published" ? "success" : "default"}
          />
        </Stack>

        {/* DESCRIPTION */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 2 }}
        >
          {event.description}
        </Typography>

        {/* DATE */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <CalendarMonthIcon fontSize="small" />
          <Typography variant="body2">
            {new Date(event.startDate).toLocaleString("tr-TR")}
          </Typography>
        </Stack>

        {/* ADDRESS */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <LocationOnIcon fontSize="small" />
          <Typography variant="body2">{event.address}</Typography>
        </Stack>

        {/* FOOTER */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Capacity: {event.capacity}
          </Typography>

          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              color="primary"
              onClick={handleEditClick}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
            <Button size="small" variant="contained">
              Detay
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}