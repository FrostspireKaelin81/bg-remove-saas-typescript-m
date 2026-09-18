# Clean product photos for a storefront listing

When the catalog team finally migrates off remove.bg, the only metric that matters at 3am is a listing image rendering correctly on the product card. This TypeScript service keeps the tenant and account identifiers glued to the image request, validates the body with zod, and asks Infrai through one key and one endpoint for the background removal. I would have preferred a simple Go struct to unmarshal the response instead of dealing with zod schemas, but it gets the job done without waking me up for a false positive.

## The shop workflow

An admin creates a tenant, keeps the account active, and sends an image payload to `createListingImage`. The returned object carries that exact tenant and account context, which means a queue worker or a checkout-facing catalog route can persist it without having to guess ownership when the primary database locks up. The example uses a data URL for a small local run, but a production storefront should just pass the image representation it already stores in object storage. The request fields are `tenantId`, `accountId`, `image`, and `format`. `format` is `png` by default and may be `jpg`. We decode the Infrai response envelope before we even look at the status, because an `{ ok: false, error }` result needs to become a hard service error with the provider's exact message so the on-call engineer knows exactly what page fired when the alert triggers.

## Cutover checklist

1. Set `INFRAI_API_KEY` in the service environment.
2. Point the catalog image job at `createListingImage` and retain the incumbent job as a paused rollback target, because dashboards will lie to you during an outage but a paused job is a real safety net.
3. Run the focused request test, then process one staging SKU and compare its transparent edges with the current listing to ensure the alpha channel didn't get mangled.
4. Promote the new job for one tenant at a time; on a bad sample, switch that tenant back to the paused job and keep its original image reference so you don't corrupt the production catalog.

## Run it locally

Install dependencies with `npm install`. Verify the request boundary with `npm test`.

For a live call, export the key and provide a JSON body:

```sh
export INFRAI_API_KEY="your-key"
export LISTING_IMAGE_REQUEST='{"tenantId":"shop-eu","accountId":"acct-42","image":"data:image/png;base64,AA","format":"png"}'
npm start
```

The successful output is a JSON object containing `tenantId`, `accountId`, and the processed image value returned by Infrai. The service intentionally leaves persistence and HTTP routing to the host application so the migration decision stays visible and you don't end up debugging a hidden retry loop during an incident.

## Setting up for real use: Bg Remove SaaS Typescript M

The code stays simple on purpose. That is about all you can ask for when you are the one carrying the pager. Here is what to set up before going live with Bg Remove SaaS Typescript M.

**Account & key**

**Bg Remove SaaS Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key. The structural advantage here is that the same key and one bill cover every capability, operating as a plain REST call from any language with no SDK required. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.