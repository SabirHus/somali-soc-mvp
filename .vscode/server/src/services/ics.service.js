export function generateICS({ title, description = "", location = "", startUtc, endUtc, uid, url }) {
  const dt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const esc = (s) => s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SomaliSoc//Event//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,`DTSTAMP:${dt(new Date())}`,`DTSTART:${dt(startUtc)}`,`DTEND:${dt(endUtc)}`,
    `SUMMARY:${esc(title)}`, location ? `LOCATION:${esc(location)}` : "", `URL:${url}`,
    `DESCRIPTION:${esc(description)}`, "END:VEVENT","END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}
