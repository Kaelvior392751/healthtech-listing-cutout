import { z } from "zod";

export const appointmentRequest = z.object({
  patientName: z.string().min(1),
  appointmentId: z.string().min(1),
  startsAt: z.string().datetime(),
  channel: z.enum(["sms", "email"]),
  listingImage: z.union([
    z.object({ base64: z.string().min(1) }),
    z.object({ image_id: z.string().min(1) })
  ])
});
export type AppointmentRequest = z.infer<typeof appointmentRequest>;

export function notificationFor(input: AppointmentRequest, now = new Date()): { state: "send" | "hold"; message: string } {
  const starts = new Date(input.startsAt).getTime();
  const hours = (starts - now.getTime()) / 3_600_000;
  if (hours < 0) return { state: "hold", message: `Appointment ${input.appointmentId} is already past; contact ${input.patientName} through ${input.channel}.` };
  if (hours <= 24) return { state: "send", message: `Reminder for ${input.patientName}: appointment ${input.appointmentId} starts within 24 hours.` };
  return { state: "hold", message: `Appointment ${input.appointmentId} is scheduled for later; no reminder yet.` };
}
