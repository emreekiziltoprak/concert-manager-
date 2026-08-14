import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Typography,
} from "@mui/material";
import { getEvent } from "../../api/events";
import { useAuth } from "../../authContext/authcontext";
import { ticketCategoryOptions } from "../../constants/events";
import EventEditForm from "./EventEditForm";
import TicketTypeForm from "./TicketTypeForm";
import TicketTypeList from "./TicketTypeList";

const managerEventRoles = ["OWNER", "CO_ORGANISER"];

// Dialog shell: owns which ticket type is being edited and the ticket type
// list itself, since both TicketTypeForm and TicketTypeList need to read and
// mutate them. The event-fields form is driven imperatively through a ref
// (submitForm) and read back through the validity/saving/capacity callbacks,
// because the "Save Changes" button and the capacity warning live here.
export default function EditEventModal({ open, onClose, event, categories, onEventUpdated }) {
  const { user } = useAuth();
  const eventFormRef = useRef(null);

  const [eventDetail, setEventDetail] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [editingTicketTypeId, setEditingTicketTypeId] = useState(null);
  const [ticketTypeError, setTicketTypeError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [listDeleting, setListDeleting] = useState(false);
  const [eventFormValid, setEventFormValid] = useState(true);
  const [eventSaving, setEventSaving] = useState(false);
  const [capacityDraft, setCapacityDraft] = useState("");

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

  // Deliberately the persisted capacity, not the unsaved draft: an unsaved
  // capacity change would let the UI accept a value the server rejects.
  const eventCapacity = Number(activeEvent?.capacity ?? 0);
  const allocatedCapacity = otherTicketTypes.reduce(
    (sum, ticketType) => sum + (Number(ticketType.totalCount) || 0),
    0
  );
  const remainingCapacity = Math.max(eventCapacity - allocatedCapacity, 0);

  const editingTicketType =
    ticketTypes.find((ticketType) => ticketType.id === editingTicketTypeId) || null;
  const editingSoldCount = Number(editingTicketType?.soldCount) || 0;

  const capacityDraftChanged = capacityDraft !== "" && Number(capacityDraft) !== eventCapacity;

  // GET /events omits soldCount, so the detail endpoint is what makes the
  // "already reserved" floor and the Remaining line work.
  useEffect(() => {
    if (!open || !event?.id) return undefined;

    let cancelled = false;

    setEditingTicketTypeId(null);
    setTicketTypeError("");

    getEvent(event.id)
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

  const handleEventSaved = useCallback(() => {
    onEventUpdated();
    onClose();
  }, [onEventUpdated, onClose]);

  const handleTicketTypeSaved = useCallback(
    (ticketType, { wasEditing }) => {
      setTicketTypes((prev) => {
        if (wasEditing) {
          // Spread over the previous row so a locally known soldCount
          // survives even if the response omits it.
          return prev.map((current) =>
            current.id === ticketType.id ? { ...current, ...ticketType } : current
          );
        }
        return [ticketType, ...prev];
      });
      setEditingTicketTypeId(null);
      onEventUpdated?.();
    },
    [onEventUpdated]
  );

  const handleTicketTypeDeleted = useCallback(
    (ticketTypeId) => {
      setTicketTypes((prev) => prev.filter((current) => current.id !== ticketTypeId));
      setEditingTicketTypeId((current) => (current === ticketTypeId ? null : current));
      onEventUpdated?.();
    },
    [onEventUpdated]
  );

  const handleEditClick = useCallback((ticketType) => {
    setEditingTicketTypeId(ticketType.id);
    setTicketTypeError("");
  }, []);

  const handleCancelEditTicketType = useCallback(() => {
    setEditingTicketTypeId(null);
    setTicketTypeError("");
  }, []);

  const handleSave = () => {
    eventFormRef.current?.submitForm();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="edit-event-modal__title">Edit Event</DialogTitle>
      <DialogContent className="edit-event-modal__content">
        <div className="edit-event-modal__body">
          <EventEditForm
            ref={eventFormRef}
            event={event}
            categories={categories}
            onSaved={handleEventSaved}
            onValidityChange={setEventFormValid}
            onSavingChange={setEventSaving}
            onCapacityDraftChange={setCapacityDraft}
          />

          <Divider className="divider-spacing" />

          <div>
            <div className="edit-event-modal__section-head">
              <Typography variant="h6">Ticket Types</Typography>
              <Chip label={ticketTypes.length} size="small" />
            </div>

            {!canManage ? (
              <Typography color="text.secondary" className="edit-event-modal__permission-note">
                You do not have permission to manage this event.
              </Typography>
            ) : (
              <TicketTypeForm
                eventId={event?.id}
                editingTicketType={editingTicketType}
                takenNames={takenNames}
                takenCategories={takenCategories}
                firstFreeCategory={firstFreeCategory}
                remainingCapacity={remainingCapacity}
                editingSoldCount={editingSoldCount}
                capacityDraftChanged={capacityDraftChanged}
                busy={listDeleting}
                error={ticketTypeError}
                onSaved={handleTicketTypeSaved}
                onCancelEdit={handleCancelEditTicketType}
                onSubmittingChange={setFormSubmitting}
                onError={setTicketTypeError}
              />
            )}

            <TicketTypeList
              eventId={event?.id}
              ticketTypes={ticketTypes}
              editingTicketTypeId={editingTicketTypeId}
              canManage={canManage}
              busy={formSubmitting}
              onEditClick={handleEditClick}
              onDeleted={handleTicketTypeDeleted}
              onError={setTicketTypeError}
              onDeletingChange={setListDeleting}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={eventSaving}>
          Cancel
        </Button>
        {canManage && (
          <Button onClick={handleSave} variant="contained" disabled={!eventFormValid || eventSaving}>
            {eventSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
