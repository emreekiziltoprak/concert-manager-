import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { updateEvent } from "../../api/events";
import { statusOptions, initialEventFormValues } from "../../constants/events";
import { extractApiError, getError, numberFromEmptyString, toDateTimeLocal, toTextValue } from "./formUtils";

const toEventFormValues = (event) => {
  if (!event) return initialEventFormValues;

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

// Owns the event-fields form and its submit handler. The dialog shell drives
// submission through `ref.submitForm()` and reads live validity/saving/draft
// capacity via the callback props, since the "Save Changes" button and the
// ticket-type capacity warning both live outside this component.
const EventEditForm = forwardRef(function EventEditForm(
  { event, categories, onSaved, onValidityChange, onSavingChange, onCapacityDraftChange },
  ref
) {
  const eventInitialValues = useMemo(() => toEventFormValues(event), [event]);
  const [eventServerError, setEventServerError] = useState("");

  const eventFormik = useFormik({
    initialValues: eventInitialValues,
    enableReinitialize: true,
    validationSchema: eventValidationSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!event?.id) return;

      onSavingChange(true);
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
        await updateEvent(event.id, payload);
        onSaved();
      } catch (error) {
        console.error(error);
        setEventServerError(extractApiError(error, "Failed to update event."));
      } finally {
        onSavingChange(false);
      }
    },
  });

  useImperativeHandle(ref, () => ({ submitForm: eventFormik.submitForm }), [eventFormik.submitForm]);

  useEffect(() => {
    onValidityChange(eventFormik.isValid);
  }, [eventFormik.isValid, onValidityChange]);

  useEffect(() => {
    onCapacityDraftChange(eventFormik.values.capacity);
  }, [eventFormik.values.capacity, onCapacityDraftChange]);

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
    <div className="edit-event-modal__event-form">
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
        slotProps={{ inputLabel: { shrink: true } }}
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
        slotProps={{ inputLabel: { shrink: true } }}
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
        slotProps={{ htmlInput: { step: "0.000001" } }}
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
        slotProps={{ htmlInput: { step: "0.000001" } }}
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
        slotProps={{ htmlInput: { min: 1, step: "1" } }}
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

      {eventServerError && <Typography color="error">{eventServerError}</Typography>}
    </div>
  );
});

export default EventEditForm;
