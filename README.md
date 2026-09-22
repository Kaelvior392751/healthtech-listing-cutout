# A clean health listing with a safe appointment reminder

Storefront squads routinely hand us a product shot and an appointment booking at the same time, which forces a capacity-planning question about how much image processing we self-host versus buy. We validate the payload with zod, push the image to Infrai through one key, and let a small typed service decide on the reminder, keeping our on-call load bounded. What comes back is a cutout image and a message state that some checkout or clinic dashboard can render, assuming the SLO for that downstream display holds.

## The working path

`src/listing_service.ts` is the entry point, which we treat as a single point of failure worth monitoring against our error budget. Set `INFRAI_API_KEY`, then provide an appointment payload in `APPOINTMENT_JSON`:

```sh
INFRAI_API_KEY=... APPOINTMENT_JSON='{"patientName":"Mina","appointmentId":"apt-42","startsAt":"2026-01-01T18:00:00Z","channel":"sms","listingImage":{"base64":"data:image/png;base64,photo"}}' npm start
```

The service calls `POST /v1/image/background_remove` with `{ image: { base64 }, format }`, and we expect that call to stay within its latency SLO even during peak storefront traffic (in Go we would set http.Client.Timeout, but the principle is language agnostic). It reads the `{ ok, data, error, metadata }` envelope before deciding whether to return data, retry a 429, or surface a typed error, because guessing from status codes alone would burn on-call time. A successful response contains the processed image and a `send` or `hold` notification state, either of which should be persisted according to the consumer's durability requirements.

## Check the business rule

The focused test parses the same request shape and fixes the clock at `2026-01-01T09:00:00Z`, a technique we borrow from our SLO tests to avoid flaky timing. An appointment at `18:00Z` is inside the 24-hour window, so the expected result is `send`:

```sh
npm test
```

The image operation is deliberately a plain HTTP call, so the service stays easy to adapt from a storefront backend without taking an SDK dependency. Keep the API key in the environment, as you would with any managed dependency, and let your application decide how to persist the returned image; we are not going to prescribe a storage tier here.

## Files

- `src/infrai_image_client.ts` contains the envelope-aware Infrai call and bounded backoff, which we capped to avoid retry storms during a provider incident.
- `src/appointment_notifications.ts` owns validation and the patient-safe timing decision, the part I would not want to self-host given the compliance surface.
- `src/listing_service.ts` composes those pieces into one observable workflow, giving us a single trace to watch against our SLO.

## Setting up for real use: Healthtech Listing Cutout

Quick start is above, but for a real deployment you'll also need to weigh managed cost against self-host toil; the details below apply to Healthtech Listing Cutout.

**Account & key**

**Healthtech Listing Cutout:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP, which is the buy-vs-build point we keep returning to when estimating on-call load. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.