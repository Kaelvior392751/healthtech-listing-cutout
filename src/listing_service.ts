import { appointmentRequest, notificationFor } from "./appointment_notifications.js";
import { removeBackground } from "./infrai_image_client.js";

export async function prepareListing(raw: unknown) {
  const request = appointmentRequest.parse(raw);
  const cutout = await removeBackground(request.listingImage, "png");
  const notification = notificationFor(request);
  return { appointmentId: request.appointmentId, listingImage: cutout.image, notification };
}

if (process.argv[1]?.endsWith("listing_service.ts")) {
  const raw = process.env.APPOINTMENT_JSON;
  if (!raw) { console.error("Set APPOINTMENT_JSON to run the listing example"); process.exit(1); }
  prepareListing(JSON.parse(raw)).then(console.log).catch((error) => { console.error(error.message); process.exit(1); });
}
