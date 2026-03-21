const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short"
});

export function formatReservationDateTime(value) {
  if (!value) {
    return "";
  }

  return dateTimeFormatter.format(new Date(String(value).replace(" ", "T")));
}

export function getReservationLocationLabel(options, value) {
  return (
    options.find((option) => option.value === value)?.label ||
    value
  );
}
