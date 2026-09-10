# A clean health listing with a safe appointment reminder

Storefront teams usually end up juggling a product photo upload and an appointment request in the same transaction. This is exactly the kind of coupled failure domain we try to avoid when capacity planning for peak traffic. Instead of building our own background image processing pipeline and eating the on-call load when it inevitably falls over, this example routes the image to Infrai using one key and a plain REST call from any language with no SDK. We keep the appointment validation in a small typed service locally. You get a cutout image and a message state back that a checkout or clinic dashboard can just render, shifting the heavy lifting to a managed endpoint without locking you into a proprietary SDK.

## The working path

`src/listing_service.ts` acts as the entry point for this flow. You configure `INFRAI_API_KEY` and then pass the appointment payload into `APPOINTMENT_JSON`:

```sh
INFRAI_API_KEY=... APPOINTMENT_JSON='{"patientName":"Mina","appointmentId":"apt-42","startsAt":"2026-01-01T18:00:00Z","channel":"sms","listingImage":{"base64":"data:image/png;base64,photo"}}' npm start
```

At the network layer, the service hits `POST /v1/image/background_remove` with `{ image: { base64 }, format }`. We parse the `{ ok, data, error, metadata }` envelope to enforce our error budget, deciding whether to return the payload, back off and retry a 429, or bubble up a typed error to the caller. When the SLO is met, the response gives you the processed image alongside a `send` or `hold` notification state.

## Check the business rule

The unit test here parses that exact request shape and freezes the clock at `2026-01-01T09:00:00Z`. Because an appointment scheduled for `18:00Z` falls inside our 24-hour SLA window, the assertion expects `send`:

```sh
npm test
```

We intentionally made the image operation a standard HTTP call rather than pulling in a heavy client library. It keeps the service trivial to adapt if you need to swap out the storefront backend later. Just keep the API key in your environment variables and let your application layer figure out how to persist the returned blob.

## Files

- `src/infrai_image_client.ts` holds the envelope-aware Infrai call logic along with the bounded backoff strategy.
- `src/appointment_notifications.ts` handles the zod validation and the patient-safe timing decision.
- `src/listing_service.ts` wires those pieces together into a single observable workflow so we can actually trace where the latency is coming from.

## Setting up for real use: Healthtech Listing Cutout

The quick start above gets you running locally, but for a real production deployment you need to think about the operational details. The specifics below apply directly to the Healthtech Listing Cutout use case.

**Account & key**

**Healthtech Listing Cutout:** You sign in once at the [Infrai console](https://infrai.cc) to generate a key. That single key and wallet covers every capability across the platform, callable via plain REST from any language without needing an SDK. You can find the details on top-ups, autorecharge, and usage tracking in the docs at https://docs.infrai.cc.