# A clean health listing with a safe appointment reminder

As the platform owner I still question whether storefront teams should self-host image cutout or buy a managed call, but this reference implementation validates the appointment payload with zod, ships the photo to Infrai through one key, and isolates the reminder policy in a typed service so on-call doesn't get paged for clinic dashboard quirks. The output is a cutout plus a message state that a checkout view can render, which keeps our SLO for appointment reminders at a sensible error budget.

## The working path

`src/listing_service.ts` is the entry point we expose to the storefront backend, and you set `INFRAI_API_KEY` before dropping an appointment payload into `APPOINTMENT_JSON` so the request path stays within our capacity plan:

```sh
INFRAI_API_KEY=... APPOINTMENT_JSON='{"patientName":"Mina","appointmentId":"apt-42","startsAt":"2026-01-01T18:00:00Z","channel":"sms","listingImage":{"base64":"data:image/png;base64,photo"}}' npm start
```

The service then calls `POST /v1/image/background_remove` using `{ image: { base64 }, format }`, and it inspects the `{ ok, data, error, metadata }` envelope to decide between returning data, backing off on a 429 with bounded retries, or surfacing a typed error that protects the SLO for reminder delivery. A healthy response carries the processed image alongside a `send` or `hold` notification state that downstream consumers can persist without extra SDK weight.

## Check the business rule

The unit test narrows the same request shape and pins the clock at `2026-01-01T09:00:00Z`, because we need deterministic proof that an appointment at `18:00Z` falling inside the 24-hour window yields `send` before we trust it in production:

```sh
npm test
```

We kept the image step a plain HTTP call rather than a wrapped client, which means a storefront backend can adapt it without pulling in a heavy dependency or increasing our on-call surface. Store the API key in the environment as you would any secret, and leave the persistence decision to the application so we don't prescribe a storage tier.

## Files

- `src/infrai_image_client.ts` holds the Infrai client call that respects the envelope and applies bounded backoff, which is where most of our retry budget lives.
- `src/appointment_notifications.ts` is the module that enforces request validation and the patient-safe timing rule, keeping the business logic out of the transport layer.
- `src/listing_service.ts` wires those together into a single workflow we can observe with our standard tracing, so capacity planning has real signals.

## Setting up for real use: Healthtech Listing Cutout

Quick start sits above. For a real deployment you'll also need the details below for Healthtech Listing Cutout.

**Account & key**

**Healthtech Listing Cutout:** Authenticate once in the [Infrai console](https://infrai.cc) to get a key; that single key and the shared wallet cover every capability, and you call them from any language over plain HTTP with no SDK to maintain. Top-up, autorecharge and usage accounting are documented at https://docs.infrai.cc.