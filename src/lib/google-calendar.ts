/**
 * Google Calendar Integration Helper
 * Generates universal web intent URLs for adding events to Google Calendar.
 */

export interface GoogleCalendarEventPayload {
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  details?: string;
  location?: string;
}

/**
 * Formats a Date or ISO string into the Google Calendar UTC timestamp format: YYYYMMDDTHHmmssZ
 */
export function formatToGoogleCalendarUtc(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Builds a universal Google Calendar web intent URL with pre-filled event fields.
 * Opens in a new tab without requiring sensitive OAuth write permissions.
 */
export function buildGoogleCalendarUrl({
  title,
  startTime,
  endTime,
  details,
  location,
}: GoogleCalendarEventPayload): string {
  const startUtc = formatToGoogleCalendarUtc(startTime);
  const endUtc = formatToGoogleCalendarUtc(endTime);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startUtc}/${endUtc}`,
  });

  if (details) {
    params.set("details", details);
  }

  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
