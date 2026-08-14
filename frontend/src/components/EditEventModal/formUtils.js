export const toTextValue = (value) => (value === null || value === undefined ? "" : String(value));

// `datetime-local` inputs only accept "YYYY-MM-DDTHH:mm" in local time,
// while the API returns UTC ISO strings.
export const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

// The API answers with {errors: [...]} for body-shape failures and {error} for
// the business rules, so both shapes have to be unwrapped.
export const extractApiError = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.errors?.join(" ") || fallback;

export const numberFromEmptyString = (value, originalValue) => (originalValue === "" ? undefined : value);

export const getError = (formik, name) => (formik.touched[name] ? formik.errors[name] : "");
