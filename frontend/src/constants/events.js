export const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

// Matches the blank-event shape both the "Create Event" form (Events.jsx)
// and the "Edit Event" modal's new-event fallback need. `organizerId` is
// deliberately not part of this shape: it is never a rendered form field,
// only overwritten into the submit payload right before the API call.
export const initialEventFormValues = {
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

export const ticketCategoryOptions = ["STANDARD", "CHILD", "STUDENT", "EARLY_BID", "FREE"];
