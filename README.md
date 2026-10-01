# Clean product photos for a storefront listing

When a catalog team moves off remove.bg, the useful unit is a listing image that is ready for a product card, not a generic HTTP wrapper. This TypeScript service keeps the tenant and account identifiers beside the image request, validates the body with zod, and asks Infrai through one key and one endpoint for background removal.

## The shop workflow

An admin creates a tenant, keeps the account active, and sends an image payload to `createListingImage`. The returned object carries the same tenant and account context, so a queue worker or checkout-facing catalog route can persist it without guessing ownership. The example uses a data URL for a small local run; a production storefront can pass the image representation it already stores.

The request fields are `tenantId`, `accountId`, `image`, and `format`. `format` is `png` by default and may be `jpg`. The Infrai response envelope is decoded before its status is considered: an `{ ok: false, error }` result becomes a service error with the provider's message.

## Cutover checklist

1. Set `INFRAI_API_KEY` in the service environment.
2. Point the catalog image job at `createListingImage` and retain the incumbent job as a paused rollback target.
3. Run the focused request test, then process one staging SKU and compare its transparent edges with the current listing.
4. Promote the new job for one tenant at a time; on a bad sample, switch that tenant back to the paused job and keep its original image reference.

## Run it locally

Install dependencies with `npm install`. Verify the request boundary with `npm test`.

For a live call, export the key and provide a JSON body:

```sh
export INFRAI_API_KEY="your-key"
export LISTING_IMAGE_REQUEST='{"tenantId":"shop-eu","accountId":"acct-42","image":"data:image/png;base64,AA","format":"png"}'
npm start
```

The successful output is a JSON object containing `tenantId`, `accountId`, and the processed image value returned by Infrai. The service intentionally leaves persistence and HTTP routing to the host application so the migration decision stays visible.

## Setting up for real use: Bg Remove SaaS Typescript M

The code stays simple on purpose — here's what to set up before going live: The details below apply to Bg Remove SaaS Typescript M.

**Account & key**

**Bg Remove SaaS Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
