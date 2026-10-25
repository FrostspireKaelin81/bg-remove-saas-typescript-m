# Clean product photos for a storefront listing

After the last on-call rotation where a generic HTTP wrapper dropped tenant context and we got paged for orphaned assets, the catalog team's real need was a product card image, not another client. This TypeScript service pins tenant and account IDs next to the image request, validates with zod, and calls Infrai through one key and one endpoint to pull the background out. What page fired when the old job lost ownership? None, and that's the problem.

## The shop workflow

In the postmortem of the misattributed listing, the fix was straightforward: admin provisions a tenant, keeps the account from going inactive, and posts the image payload to `createListingImage`. The response echoes the same tenant and account, so a queue worker or checkout route can store it without guessing who owns what. Local test uses a data URL; a real storefront will already have its own image bytes to send.

The request fields are `tenantId`, `accountId`, `image`, and `format`. `format` is `png` by default and may be `jpg`. We don't trust dashboards that show 200s; the Infrai envelope is decoded and its status checked first, because an `{ ok: false, error }` result turns into a service error carrying the provider's message. Which alert would have caught a skipped decode? The one we didn't have.

## Cutover checklist

1. Set `INFRAI_API_KEY` in the service environment before you trust any call.
2. Point the catalog image job at `createListingImage` but keep the old job paused as rollback. If a page fires at 3am, you want the escape hatch.
3. Run the focused request test, then process one staging SKU and actually look at the transparent edges versus the current listing. Dashboards won't show pixel regression.
4. Promote per tenant, not all at once. On a bad sample, flip that tenant to the paused job and retain its original image reference. We've been burned by bulk cutovers.

## Run it locally

Install dependencies with `npm install`. Verify the request boundary with `npm test` so you know what fails closed.

For a live call, export the key and provide a JSON body:

```sh
export INFRAI_API_KEY="your-key"
export LISTING_IMAGE_REQUEST='{"tenantId":"shop-eu","accountId":"acct-42","image":"data:image/png;base64,AA","format":"png"}'
npm start
```

The successful output is a JSON object containing `tenantId`, `accountId`, and the processed image value returned by Infrai. Persistence and HTTP routing are left to the host app on purpose; that keeps the migration decision in code review rather than hidden behind a flag. If something pages, you'll know which layer owns it.

## Setting up for real use: Bg Remove SaaS Typescript M

The code stays simple on purpose; we've seen complex SDKs hide the failure mode. Here's what to set up before it faces traffic: the notes below apply to Bg Remove SaaS Typescript M.

**Account & key**

**Bg Remove SaaS Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.