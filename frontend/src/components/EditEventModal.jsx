import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../config/axios";

const initialState = {
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

const initialTicketTypeForm = {
  name: "",
  price: "",
  capacity: "",
  category: "STANDARD",
  isActive: true,
};

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

const ticketCategoryOptions = ["STANDARD", "CHILD", "STUDENT", "EARLY_BID", "FREE"];

const numberFromEmptyString = (value, originalValue) => (originalValue === "" ? undefined : value);

const eventValidationSchema = Yup.object({
  categoryId: Yup.string().required("Category is required."),
  title: Yup.string().trim().required("Title is required."),
  slug: Yup.string().trim().required("Slug is required."),
  description: Yup.string().trim().required("Description is required."),
  startDate: Yup.string().required("Start date is required."),
  endDate: Yup.string()
    .required("End date is required.")
    .test("end-after-start", "End date must be after start date.", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) > new Date(startDate);
    }),
  capacity: Yup.number()
    .transform(numberFromEmptyString)
    .required("Capacity is required.")
    .positive("Capacity must be greater than 0.")
    .integer("Capacity must be an integer."),
  latitude: Yup.number()
    .transform(numberFromEmptyString)
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90.")
    .nullable(),
  longitude: Yup.number()
    .transform(numberFromEmptyString)
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180.")
    .nullable(),
  status: Yup.string().oneOf(statusOptions.map((option) => option.value), "Invalid status.").required("Status is required."),
});

const ticketTypeValidationSchema = Yup.object({
  name: Yup.string().trim().required("Ticket type name is required."),
  price: Yup.number()
    .transform(numberFromEmptyString)
    .required("Price is required.")
    .min(0, "Price must be greater than or equal to 0."),
  capacity: Yup.number()
    .transform(numberFromEmptyString)
    .required("Capacity is required.")
    .positive("Capacity must be greater than 0.")
    .integer("Capacity must be an integer."),
  category: Yup.string().oneOf(ticketCategoryOptions, "Invalid ticket category.").required("Category is required."),
  isActive: Yup.boolean().required("Status is required."),
});

const getError = (formik, name) => (formik.touched[name] ? formik.errors[name] : "");

export default function EditEventModal({ open, onClose, event, categories, onEventUpdated }) {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventServerError, setEventServerError] = useState("");
  const [ticketTypeError, setTicketTypeError] = useState("");

  const eventFormik = useFormik({
    initialValues: initialState,
    enableReinitialize: true,
    validationSchema: eventValidationSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!event?.id) return;

      setLoading(true);
      setEventServerError("");

      const payload = {
        id: event.id,
        ...values,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        latitude: values.latitude ? Number(values.latitude) : null,
        longitude: values.longitude ? Number(values.longitude) : null,
        capacity: values.capacity ? Number(values.capacity) : null,
      };

      try {
        await api.put(`/events/${event.id}`, payload);
        onEventUpdated();
        onClose();
      } catch (error) {
        console.error(error);
        setEventServerError(error.response?.data?.error || "Failed to update event.");
      } finally {
        setLoading(false);
      }
    },
  });

  const ticketTypeFormik = useFormik({
    initialValues: initialTicketTypeForm,
    validationSchema: ticketTypeValidationSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!event?.id) return;

      setTicketTypeError("");

      try {
        const response = await api.post(`/events/${event.id}/ticket-types`, {
          name: values.name.trim(),
          price: Number(values.price),
          capacity: Number(values.capacity),
          category: values.category,
          isActive: values.isActive,
        });

        setTicketTypes((prev) => [response.data.ticketType, ...prev]);
        ticketTypeFormik.resetForm();
      } catch (error) {
        console.error(error);
        setTicketTypeError(
          error.response?.data?.error ||
            error.response?.data?.errors?.join(" ") ||
            "Failed to add ticket type."
        );
      }
    },
  });

  React.useEffect(() => {
    if (event) {
      setTicketTypes(event.ticketTypes || []);
      ticketTypeFormik.resetForm();
      setTicketTypeError("");
    }
  }, [event]);

  const handleEventChange = (e) => {
    const { name, value } = e.target;

    eventFormik.handleChange(e);

    if (name === "title") {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      eventFormik.setFieldValue("slug", slug);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Event</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth error={Boolean(getError(eventFormik, "categoryId"))}>
            <InputLabel>Category</InputLabel>
            <Select
              name="categoryId"
              value={eventFormik.values.categoryId}
              label="Category"
              onChange={handleEventChange}
            >
              {categories?.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{getError(eventFormik, "categoryId")}</FormHelperText>
          </FormControl>

          <TextField
            label="Title"
            name="title"
            value={eventFormik.values.title}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "title"))}
            helperText={getError(eventFormik, "title")}
            fullWidth
          />

          <TextField
            label="Slug"
            name="slug"
            value={eventFormik.values.slug}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "slug"))}
            helperText={getError(eventFormik, "slug")}
            fullWidth
          />

          <TextField
            label="Description"
            name="description"
            value={eventFormik.values.description}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "description"))}
            helperText={getError(eventFormik, "description")}
            multiline
            rows={3}
            fullWidth
          />

          <TextField
            label="Cover Image URL"
            name="coverImageUrl"
            value={eventFormik.values.coverImageUrl}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            fullWidth
          />

          <TextField
            label="Start Date"
            name="startDate"
            type="datetime-local"
            value={eventFormik.values.startDate}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "startDate"))}
            helperText={getError(eventFormik, "startDate")}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="End Date"
            name="endDate"
            type="datetime-local"
            value={eventFormik.values.endDate}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "endDate"))}
            helperText={getError(eventFormik, "endDate")}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Address"
            name="address"
            value={eventFormik.values.address}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            fullWidth
          />

          <TextField
            label="Latitude"
            name="latitude"
            type="number"
            value={eventFormik.values.latitude}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "latitude"))}
            helperText={getError(eventFormik, "latitude")}
            inputProps={{ step: "0.000001" }}
            fullWidth
          />

          <TextField
            label="Longitude"
            name="longitude"
            type="number"
            value={eventFormik.values.longitude}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "longitude"))}
            helperText={getError(eventFormik, "longitude")}
            inputProps={{ step: "0.000001" }}
            fullWidth
          />

          <TextField
            label="Capacity"
            name="capacity"
            type="number"
            value={eventFormik.values.capacity}
            onChange={handleEventChange}
            onBlur={eventFormik.handleBlur}
            error={Boolean(getError(eventFormik, "capacity"))}
            helperText={getError(eventFormik, "capacity")}
            inputProps={{ min: 1, step: "1" }}
            fullWidth
          />

          <FormControl fullWidth error={Boolean(getError(eventFormik, "status"))}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={eventFormik.values.status}
              label="Status"
              onChange={handleEventChange}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{getError(eventFormik, "status")}</FormHelperText>
          </FormControl>

          {eventServerError && (
            <Typography color="error">{eventServerError}</Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Ticket Types</Typography>
              <Chip label={ticketTypes.length} size="small" />
            </Stack>

            <Box component="form" onSubmit={ticketTypeFormik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Ticket Type Name"
                    name="name"
                    value={ticketTypeFormik.values.name}
                    onChange={ticketTypeFormik.handleChange}
                    onBlur={ticketTypeFormik.handleBlur}
                    error={Boolean(getError(ticketTypeFormik, "name"))}
                    helperText={getError(ticketTypeFormik, "name")}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Price"
                    name="price"
                    type="number"
                    value={ticketTypeFormik.values.price}
                    onChange={ticketTypeFormik.handleChange}
                    onBlur={ticketTypeFormik.handleBlur}
                    error={Boolean(getError(ticketTypeFormik, "price"))}
                    helperText={getError(ticketTypeFormik, "price")}
                    inputProps={{ min: 0, step: "0.01" }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Capacity"
                    name="capacity"
                    type="number"
                    value={ticketTypeFormik.values.capacity}
                    onChange={ticketTypeFormik.handleChange}
                    onBlur={ticketTypeFormik.handleBlur}
                    error={Boolean(getError(ticketTypeFormik, "capacity"))}
                    helperText={getError(ticketTypeFormik, "capacity")}
                    inputProps={{ min: 1, step: "1" }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={Boolean(getError(ticketTypeFormik, "category"))}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={ticketTypeFormik.values.category}
                      label="Category"
                      onChange={ticketTypeFormik.handleChange}
                      onBlur={ticketTypeFormik.handleBlur}
                    >
                      {ticketCategoryOptions.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{getError(ticketTypeFormik, "category")}</FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={Boolean(getError(ticketTypeFormik, "isActive"))}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="isActive"
                      value={ticketTypeFormik.values.isActive}
                      label="Status"
                      onChange={ticketTypeFormik.handleChange}
                      onBlur={ticketTypeFormik.handleBlur}
                    >
                      <MenuItem value={true}>Active</MenuItem>
                      <MenuItem value={false}>Inactive</MenuItem>
                    </Select>
                    <FormHelperText>{getError(ticketTypeFormik, "isActive")}</FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={!ticketTypeFormik.isValid || ticketTypeFormik.isSubmitting}
                    sx={{ height: "100%" }}
                  >
                    {ticketTypeFormik.isSubmitting ? "Adding..." : "Add Ticket Type"}
                  </Button>
                </Grid>
              </Grid>

              {ticketTypeError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {ticketTypeError}
                </Typography>
              )}
            </Box>

            {ticketTypes.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                No ticket types added yet.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {ticketTypes.map((ticketType) => (
                  <Grid item xs={12} sm={6} md={4} key={ticketType.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {ticketType.name}
                          </Typography>
                          <Chip
                            label={ticketType.isActive ? "Active" : "Inactive"}
                            size="small"
                            color={ticketType.isActive ? "success" : "default"}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {ticketType.category || "STANDARD"}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ my: 1 }}>
                          {ticketType.price} ₺
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Capacity: {ticketType.totalCount}
                        </Typography>
                        {typeof ticketType.soldCount === "number" && (
                          <Typography variant="body2" color="text.secondary">
                            Remaining: {ticketType.totalCount - ticketType.soldCount}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={eventFormik.submitForm}
          variant="contained"
          disabled={!eventFormik.isValid || loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
