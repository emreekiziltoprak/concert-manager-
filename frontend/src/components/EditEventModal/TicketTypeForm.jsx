import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Button,
  Chip,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { createTicketType, updateTicketType } from "../../api/ticketTypes";
import { ticketCategoryOptions } from "../../constants/events";
import { extractApiError, getError, numberFromEmptyString, toTextValue } from "./formUtils";

const initialTicketTypeForm = {
  name: "",
  price: "",
  capacity: "",
  category: "STANDARD",
  isActive: true,
};

// Add/edit ticket type form and its submit handler. `editingTicketType` is
// the row selected in TicketTypeList (or null for "adding"); this form syncs
// its own Formik state to that prop instead of being driven imperatively.
export default function TicketTypeForm({
  eventId,
  editingTicketType,
  takenNames,
  takenCategories,
  firstFreeCategory,
  remainingCapacity,
  editingSoldCount,
  capacityDraftChanged,
  busy,
  error,
  onSaved,
  onCancelEdit,
  onSubmittingChange,
  onError,
}) {
  const editingTicketTypeId = editingTicketType?.id ?? null;

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

  const ticketTypeFormik = useFormik({
    initialValues: initialTicketTypeForm,
    validationSchema: ticketTypeValidationSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!eventId) return;

      onError("");

      const payload = {
        name: values.name.trim(),
        price: Number(values.price),
        capacity: Number(values.capacity),
        category: values.category,
        isActive: values.isActive,
      };

      try {
        if (editingTicketTypeId) {
          const response = await updateTicketType(eventId, editingTicketTypeId, payload);
          onSaved(response.data.ticketType, { wasEditing: true });
        } else {
          const response = await createTicketType(eventId, payload);
          onSaved(response.data.ticketType, { wasEditing: false });
        }

        ticketTypeFormik.resetForm({
          values: { ...initialTicketTypeForm, category: firstFreeCategory },
        });
      } catch (err) {
        console.error(err);
        onError(extractApiError(err, "Failed to save ticket type."));
      }
    },
  });

  useEffect(() => {
    onSubmittingChange(ticketTypeFormik.isSubmitting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketTypeFormik.isSubmitting]);

  // Pre-fill the form when a list row is selected for editing, and blank it
  // back out when the selection is cleared (cancel, delete, or save).
  useEffect(() => {
    if (editingTicketType) {
      ticketTypeFormik.setValues(
        {
          name: editingTicketType.name ?? "",
          price: toTextValue(editingTicketType.price),
          capacity: toTextValue(editingTicketType.totalCount),
          category: editingTicketType.category || "STANDARD",
          isActive: Boolean(editingTicketType.isActive),
        },
        true
      );
    } else {
      ticketTypeFormik.resetForm({
        values: { ...initialTicketTypeForm, category: firstFreeCategory },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTicketType]);

  // Formik picks up the new schema on its own, but it does not revalidate just
  // because the schema changed -- and the submit button is gated on isValid.
  // Keyed on primitives so it does not re-run on every new array identity.
  const takenCategoriesKey = [...takenCategories].sort().join(",");

  useEffect(() => {
    ticketTypeFormik.validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingCapacity, editingSoldCount, editingTicketTypeId, takenCategoriesKey]);

  const handleCancelEdit = () => {
    onCancelEdit();
  };

  const capacityHelperText =
    getError(ticketTypeFormik, "capacity") ||
    `Remaining event capacity: ${remainingCapacity}${
      editingSoldCount ? ` · ${editingSoldCount} already reserved` : ""
    }`;

  return (
    <form className="edit-event-modal__ticket-form" onSubmit={ticketTypeFormik.handleSubmit}>
      {editingTicketTypeId && (
        <div className="edit-event-modal__editing-row">
          <Chip
            label={`Editing: ${ticketTypeFormik.values.name || "ticket type"}`}
            size="small"
            color="primary"
          />
          <Button size="small" onClick={handleCancelEdit}>
            Cancel
          </Button>
        </div>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
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

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Price"
            name="price"
            type="number"
            value={ticketTypeFormik.values.price}
            onChange={ticketTypeFormik.handleChange}
            onBlur={ticketTypeFormik.handleBlur}
            error={Boolean(getError(ticketTypeFormik, "price"))}
            helperText={getError(ticketTypeFormik, "price")}
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Capacity"
            name="capacity"
            type="number"
            value={ticketTypeFormik.values.capacity}
            onChange={ticketTypeFormik.handleChange}
            onBlur={ticketTypeFormik.handleBlur}
            error={Boolean(getError(ticketTypeFormik, "capacity"))}
            helperText={capacityHelperText}
            slotProps={{
              htmlInput: {
                min: Math.max(editingSoldCount, 1),
                max: remainingCapacity,
                step: "1",
              },
            }}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
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

        <Grid size={{ xs: 12, md: 4 }}>
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

        <Grid size={{ xs: 12, md: 4 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="ticket-type-form__submit"
            disabled={!ticketTypeFormik.isValid || ticketTypeFormik.isSubmitting || busy}
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

      {capacityDraftChanged && (
        <Typography color="text.secondary" variant="body2" className="edit-event-modal__hint">
          Save the event capacity change before allocating it to ticket types.
        </Typography>
      )}

      {error && <Typography className="field-error">{error}</Typography>}
    </form>
  );
}
