import { useState } from "react";
import { Chip, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteTicketType } from "../../api/ticketTypes";
import { extractApiError } from "./formUtils";

// Renders the existing ticket types and owns the delete action. Editing is
// delegated to the parent (it selects a row, TicketTypeForm does the rest).
export default function TicketTypeList({
  eventId,
  ticketTypes,
  editingTicketTypeId,
  canManage,
  busy: externalBusy,
  onEditClick,
  onDeleted,
  onError,
  onDeletingChange,
}) {
  const [deleting, setDeleting] = useState(false);
  const busy = deleting || externalBusy;

  const handleDelete = async (ticketType) => {
    if (!window.confirm(`Delete ticket type "${ticketType.name}"? This cannot be undone.`)) return;

    setDeleting(true);
    onDeletingChange(true);
    onError("");

    try {
      await deleteTicketType(eventId, ticketType.id);
      onDeleted(ticketType.id);
    } catch (error) {
      console.error(error);
      onError(extractApiError(error, "Failed to delete ticket type."));
    } finally {
      setDeleting(false);
      onDeletingChange(false);
    }
  };

  if (ticketTypes.length === 0) {
    return (
      <Typography color="text.secondary" className="edit-event-modal__empty-note">
        No ticket types added yet.
      </Typography>
    );
  }

  return (
    <div className="edit-event-modal__ticket-grid">
      {ticketTypes.map((ticketType) => (
        <div
          key={ticketType.id}
          className={`ticket-type-card${editingTicketTypeId === ticketType.id ? " ticket-type-card--editing" : ""}`}
        >
          <div className="ticket-type-card__head">
            <Typography className="ticket-type-card__name">{ticketType.name}</Typography>
            <Chip
              label={ticketType.isActive ? "Active" : "Inactive"}
              size="small"
              color={ticketType.isActive ? "success" : "default"}
            />
          </div>
          <Typography className="ticket-type-card__category">
            {ticketType.category || "STANDARD"}
          </Typography>
          <Typography className="ticket-type-card__price">{ticketType.price} ₺</Typography>
          <Typography className="ticket-type-card__meta">Capacity: {ticketType.totalCount}</Typography>
          {typeof ticketType.soldCount === "number" && (
            <Typography className="ticket-type-card__meta">
              Remaining: {ticketType.totalCount - ticketType.soldCount}
            </Typography>
          )}

          {canManage && (
            <div className="ticket-type-card__actions">
              <IconButton
                size="small"
                className="icon-action"
                aria-label="Edit ticket type"
                onClick={() => onEditClick(ticketType)}
                disabled={busy}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                className="icon-action icon-action--danger"
                aria-label="Delete ticket type"
                onClick={() => handleDelete(ticketType)}
                disabled={busy}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
