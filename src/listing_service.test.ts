import { appointmentRequest, notificationFor } from "./appointment_notifications.js";

const now = new Date("2026-01-01T09:00:00Z");
const request = appointmentRequest.parse({ patientName: "Mina", appointmentId: "apt-42", startsAt: "2026-01-01T18:00:00Z", channel: "sms", listingImage: { base64: "data:image/png;base64,photo" } });
const decision = notificationFor(request, now);
if (decision.state !== "send") throw new Error("A same-day appointment must send a reminder");
console.log("notification decision:", decision.state);
