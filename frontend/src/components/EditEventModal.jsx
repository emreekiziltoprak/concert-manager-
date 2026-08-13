import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  Card,
  CardActions,
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
  IconButton,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../config/axios";
import { useAuth } from "../authContext/authcontext";

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

const managerEventRoles = ["OWNER", "CO_ORGANISER"];

// `datetime-local` inputs only accept "YYYY-MM-DDTHH:mm" in local time,
// while the API returns UTC ISO strings.
const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const toTextValue = (value) => (value === null || value === undefined ? "" : String(value));

const toEventFormValues = (event) => {
  if (!event) return initialState;

  return {
    categoryId: toTextValue(event.categoryId),
    title: toTextValue(event.title),
    slug: toTextValue(event.slug),
    description: toTextValue(event.description),
    coverImageUrl: toTextValue(event.coverImageUrl),
    startDate: toDateTimeLocal(event.startDate),
    endDate: toDateTimeLocal(event.endDate),
    address: toTextValue(event.address),
    latitude: toTextValue(event.latitude),
    longitude: toTextValue(event.longitude),
    capacity: toTextValue(event.capacity),
    status: event.status || "DRAFT",
  };
};

// The API answers with {errors: [...]} for body-shape failures and {error} for
// the business rules, so both shapes have to be unwrapped.
const extractApiError = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.errors?.join(" ") || fallback;

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

const getError = (formik, name) => (formik.touched[name] ? formik.errors[name] : "");

export default function EditEventModal({ open, onClose, event, categories, onEventUpdated }) {
  const { user } = useAuth();
  const [eventDetail, setEventDetail] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [editingTicketTypeId, setEditingTicketTypeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ticketTypeBusy, setTicketTypeBusy] = useState(false);
  const [eventServerError, setEventServerError] = useState("");
  const [ticketTypeError, setTicketTypeError] = useState("");

  const eventInitialValues = useMemo(() => toEventFormValues(event), [event]);

  // The detail payload carries eventRoles, so prefer it over the list payload.
  const activeEvent = eventDetail || event;

  const canManage =
    Boolean(user && activeEvent) &&
    (user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      activeEvent.organizerId === user.userId ||
      (activeEvent.eventRoles || []).some(
        (eventRole) =>
          eventRole.userId === user.userId && managerEventRoles.includes(eventRole.role)
      ));

  // Everything except the row being edited: a ticket type must never collide
  // with itself on name, category or capacity.
  const otherTicketTypes = ticketTypes.filter(
    (ticketType) => ticketType.id !== editingTicketTypeId
  );
  const takenNames = otherTicketTypes.map((ticketType) =>
    (ticketType.name || "").trim().toLowerCase()
  );
  const takenCategories = otherTicketTypes.map(
    (ticketType) => ticketType.category || "STANDARD"
  );
  const firstFreeCategory =
    ticketCategoryOptions.find((category) => !takenCategories.includes(category)) || "";

  // Deliberately the persisted capacity, not eventFormik.values.capacity: an
  // unsaved capacity change would let the UI accept a value the server rejects.
  const eventCapacity = Number(activeEvent?.capacity ?? 0);
  const allocatedCapacity = otherTicketTypes.reduce(
    (sum, ticketType) => sum + (Number(ticketType.totalCount) || 0),
    0
  );
  const remainingCapacity = Math.max(eventCapacity - allocatedCapacity, 0);

  const editingTicketType = ticketTypes.find(
    (ticketType) => ticketType.id === editingTicketTypeId
  );
  const editingSoldCount = Number(editingTicketType?.soldCount) || 0;

  // Rebuilt every render on purpose: it is a handful of object allocations, and
  // memoising it would only pay off if every input above were memoised too.
  const ticketTypeValidationSchema = Yup.object({
    name: Yup.string()
      .trim()
      .required("Ticket type name is required.")
      .test(
        "unique-name",
        "A ticket type with this name already exists for this event.",
        (value) => !value || !takenNames.includes(value.trim().toLowerCase())
      ),
    price: Yup.number()
      .transform(numberFromEmptyString)
      .required("Price is required.")
      .min(0, "Price must be greater than or equal to 0."),
    capacity: Yup.number()
      .transform(numberFromEmptyString)
      .required("Capacity is required.")
      .positive("Capacity must be greater than 0.")
      .integer("Capacity must be an integer.")
      .min(
        editingSoldCount,
        `Capacity cannot be lower than ${editingSoldCount} already sold or reserved.`
      )
      .max(
        remainingCapacity,
        `Capacity cannot exceed ${remainingCapacity} (event capacity minus the other ticket types).`
      ),
    category: Yup.string()
      .oneOf(ticketCategoryOptions, "Invalid ticket category.")
      .required("Category is required.")
      .test(
        "category-available",
        "This category is already used by another ticket type.",
        (value) => !value || !takenCategories.includes(value)
      ),
    isActive: Yup.boolean().required("Status is required."),
  });

  const eventFormik = useFormik({
    initialValues: eventInitialValues,
    enableReinitialize: true,
    validationSchema: eventValidationSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!event?.id) return;

      setLoading(true);
      setEventServerError("");

      const payload = {
        categoryId: values.categoryId,
        title: values.title.trim(),
        slug: values.slug.trim(),
        description: values.description.trim(),
        coverImageUrl: values.coverImageUrl.trim() || null,
        address: values.address.trim(),
        status: values.status,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        capacity: Number(values.capacity),
      };

      // latitude/longitude are non-nullable on the server, so leave them
      // untouched instead of sending null when the inputs are empty.
      if (values.latitude !== "") payload.latitude = Number(values.latitude);
      if (values.longitude !== "") payload.longitude = Number(values.longitude);

      try {
        await api.put(`/events/${event.id}`, payload);
        onEventUpdated();
        onClose();
      } catch (error) {
        console.error(error);
        setEventServerError(extractApiError(error, "Failed to update event."));
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

      const payload = {
        name: values.name.trim(),
        price: Number(values.price),
        capacity: Number(values.capacity),
        category: values.category,
        isActive: values.isActive,
      };

      try {
        if (editingTicketTypeId) {
          const response = await api.put(
            `/events/${event.id}/ticket-types/${editingTicketTypeId}`,
            payload
          );
          const updated = response.data.ticketType;

          // Spread over the previous row so a locally known soldCount survives
          // even if the response omits it.
          setTicketTypes((prev) =>
            prev.map((ticketType) =>
              ticketType.id === updated.id ? { ...ticketType, ...updated } : ticketType
            )
          );
          setEditingTicketTypeId(null);
        } else {
          const response = await api.post(`/events/${event.id}/ticket-types`, payload);
          setTicketTypes((prev) => [response.data.ticketType, ...prev]);
        }

        ticketTypeFormik.resetForm({
          values: { ...initialTicketTypeForm, category: firstFreeCategory },
        });
        onEventUpdated?.();
      } catch (error) {
        console.error(error);
        setTicketTypeError(extractApiError(error, "Failed to save ticket type."));
      }
    },
  });

  // GET /events omits soldCount, so the detail endpoint is what makes the
  // "already reserved" floor and the Remaining line work.
  useEffect(() => {
    if (!open || !event?.id) return undefined;

    let cancelled = false;

    setEditingTicketTypeId(null);
    setTicketTypeError("");

    api
      .get(`/events/${event.id}`)
      .then((response) => {
        if (cancelled) return;
        setEventDetail(response.data.event);
        setTicketTypes(response.data.event.ticketTypes || []);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setEventDetail(event);
        setTicketTypes(event.ticketTypes || []);
      });

    return () => {
      cancelled = true;
    };
  }, [open, event?.id]);

  // Formik picks up the new schema on its own, but it does not revalidate just
  // because the schema changed -- and the submit button is gated on isValid.
  // Keyed on primitives so it does not re-run on every new array identity.
  const takenCategoriesKey = [...takenCategories].sort().join(",");

  useEffect(() => {
    ticketTypeFormik.validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingCapacity, editingSoldCount, editingTicketTypeId, takenCategoriesKey]);

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

  const startEditTicketType = (ticketType) => {
    setEditingTicketTypeId(ticketType.id);
    setTicketTypeError("");
    ticketTypeFormik.setValues(
      {
        name: ticketType.name ?? "",
        price: toTextValue(ticketType.price),
        capacity: toTextValue(ticketType.totalCount),
        category: ticketType.category || "STANDARD",
        isActive: Boolean(ticketType.isActive),
      },
      true
    );
  };

  const cancelEditTicketType = () => {
    setEditingTicketTypeId(null);
    setTicketTypeError("");
    ticketTypeFormik.resetForm({
      values: { ...initialTicketTypeForm, category: firstFreeCategory },
    });
  };

  const handleDeleteTicketType = async (ticketType) => {
    if (!window.confirm(`Delete ticket type "${ticketType.name}"? This cannot be undone.`)) return;

    setTicketTypeBusy(true);
    setTicketTypeError("");

    try {
      await api.delete(`/events/${event.id}/ticket-types/${ticketType.id}`);
      setTicketTypes((prev) => prev.filter((current) => current.id !== ticketType.id));
      if (editingTicketTypeId === ticketType.id) cancelEditTicketType();
      onEventUpdated?.();
    } catch (error) {
      console.error(error);
      setTicketTypeError(extractApiError(error, "Failed to delete ticket type."));
    } finally {
      setTicketTypeBusy(false);
    }
  };

  const capacityChanged =
    eventFormik.values.capacity !== "" && Number(eventFormik.values.capacity) !== eventCapacity;

  const capacityHelperText =
    getError(ticketTypeFormik, "capacity") ||
    `Remaining event capacity: ${remainingCapacity}${
      editingSoldCount ? ` · ${editingSoldCount} already reserved` : ""
    }`;

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
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">Ticket Types</Typography>
                <Chip label={ticketTypes.length} size="small" />
              </Stack>

              {editingTicketTypeId && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`Editing: ${ticketTypeFormik.values.name || "ticket type"}`}
                    size="small"
                    color="primary"
                  />
                  <Button size="small" onClick={cancelEditTicketType}>
                    Cancel
                  </Button>
                </Stack>
              )}
            </Stack>

            {!canManage ? (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                You do not have permission to manage this event.
              </Typography>
            ) : (
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
                      helperText={capacityHelperText}
                      inputProps={{
                        min: Math.max(editingSoldCount, 1),
                        max: remainingCapacity,
                        step: "1",
                      }}
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
                        {ticketCategoryOptions.map((category) => {
                          const taken = takenCategories.includes(category);

                          return (
                            <MenuItem key={category} value={category} disabled={taken}>
                              {taken ? `${category} (already used)` : category}
                            </MenuItem>
                          );
                        })}
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
                      disabled={
                        !ticketTypeFormik.isValid ||
                        ticketTypeFormik.isSubmitting ||
                        ticketTypeBusy
                      }
                      sx={{ height: "100%" }}
                    >
                      {editingTicketTypeId
                        ? ticketTypeFormik.isSubmitting
                          ? "Saving..."
                          : "Save Ticket Type"
                        : ticketTypeFormik.isSubmitting
                        ? "Adding..."
                        : "Add Ticket Type"}
                    </Button>
                  </Grid>
                </Grid>

                {capacityChanged && (
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    Save the event capacity change before allocating it to ticket types.
                  </Typography>
                )}

                {ticketTypeError && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {ticketTypeError}
                  </Typography>
                )}
              </Box>
            )}

            {ticketTypes.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                No ticket types added yet.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {ticketTypes.map((ticketType) => (
                  <Grid item xs={12} sm={6} md={4} key={ticketType.id}>
                    <Card
                      variant="outlined"
                      sx={
                        editingTicketTypeId === ticketType.id
                          ? { borderColor: "primary.main", borderWidth: 2 }
                          : undefined
                      }
                    >
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

                      {canManage && (
                        <CardActions sx={{ justifyContent: "flex-end" }}>
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label="Edit ticket type"
                            onClick={() => startEditTicketType(ticketType)}
                            disabled={ticketTypeBusy || ticketTypeFormik.isSubmitting}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Delete ticket type"
                            onClick={() => handleDeleteTicketType(ticketType)}
                            disabled={ticketTypeBusy || ticketTypeFormik.isSubmitting}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </CardActions>
                      )}
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
        {canManage && (
          <Button
            onClick={eventFormik.submitForm}
            variant="contained"
            disabled={!eventFormik.isValid || loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
