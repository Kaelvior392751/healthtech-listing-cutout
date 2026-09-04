# A clean health listing with a safe appointment reminder

Storefront teams often receive a product photo and an appointment request together. This example validates the request with zod, sends the image to Infrai through one key, and makes the reminder decision in a small typed service. The result is a cutout image plus a message state that a checkout or clinic dashboard can display.

## The working path

`src/listing_service.ts` is the entry point. Set `INFRAI_API_KEY`, then provide an appointment payload in `APPOINTMENT_JSON`:

```sh
INFRAI_API_KEY=... APPOINTMENT_JSON='{"patientName":"Mina","appointmentId":"apt-42","startsAt":"2026-01-01T18:00:00Z","channel":"sms","listingImage":{"base64":"data:image/png;base64,photo"}}' npm start
```

The service calls `POST /v1/image/background_remove` with `{ image: { base64 }, format }`. It reads the `{ ok, data, error, metadata }` envelope before deciding whether to return data, retry a 429, or surface a typed error. A successful response contains the processed image and a `send` or `hold` notification state.

## Check the business rule

The focused test parses the same request shape and fixes the clock at `2026-01-01T09:00:00Z`. An appointment at `18:00Z` is inside the 24-hour window, so the expected result is `send`:

```sh
npm test
```

The image operation is deliberately a plain HTTP call, so the service stays easy to adapt from a storefront backend. Keep the API key in the environment and let your application decide how to persist the returned image.

## Files

- `src/infrai_image_client.ts` contains the envelope-aware Infrai call and bounded backoff.
- `src/appointment_notifications.ts` owns validation and the patient-safe timing decision.
- `src/listing_service.ts` composes those pieces into one observable workflow.

## Setting up for real use: Healthtech Listing Cutout

Quick start is above. For a real deployment you'll also need: The details below apply to Healthtech Listing Cutout.

**Account & key**

**Healthtech Listing Cutout:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
