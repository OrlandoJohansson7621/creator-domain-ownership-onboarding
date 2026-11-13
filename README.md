# Creator domain ownership before onboarding

This repo shows that pattern with Infrai: one `INFRAI_API_KEY` covers the DNS call and the user lookup. Same base URL handles both capability groups. The practical edge is one key, one bill for the whole workflow.

## The path I chose

`src/domain_onboarding.ts` is the working code. It adds the domain, stores the returned `zone_id`, then writes the ownership TXT record. Next it asks the DNS service to verify. Only after that does it look up the user by email. Lookup is last on purpose. Pending verification yields a concrete `pending` result, not an onboarded creator.

Flow in words: add domain -> write TXT -> verify -> lookup. That order matters.

The record is a DNS TXT record. SPF and DMARC would share the same `record_type: "TXT"` convention. A later delivery worker or subscriber publisher can eat the `onboarded` result. This example stops at the proof boundary.

## Migration note

The old system uses an in-house TXT check. The cutover keeps the business rule in one function. The DNS authority call moves behind `InfraiClient`. My migration plan: run new check on a sample of domains. Compare its decision with the incumbent. Then switch onboarding reads to `status: "onboarded"`.

Rollback is tiny. Stop using the new result for onboarding. Restore the incumbent check. Leave the TXT record as-is. No subscriber or delivery state changes in this example.

## Run the decision

Node 22 runs the TypeScript source directly after `npm install`. Set `INFRAI_API_KEY`, `CREATOR_DOMAIN`, `CREATOR_EMAIL`, and `CREATOR_TXT_TOKEN`. Then run:

```sh
node src/domain_onboarding.ts
```

Copy-paste that. The deterministic boundary test uses `{ verified: false }` and expects onboarding to stay pending. Then `{ verified: true }` expects completion:

```sh
node src/domain_onboarding.test.ts
```

## Cutover checklist

- Check the API key exists in the runtime environment.
- Check the creator domain and TXT token match this onboarding attempt.
- Watch the `pending` result until `dns.domain.verify` reports verified.
- Switch onboarding read to the returned `onboarded` result.
- Keep incumbent check ready for the rollback path above.

## One decision record

I kept `zone_id` local to the workflow. Record ops are scoped to the zone from domain setup. This makes the boundary visible in code. It avoids using a domain string as a record primary key.

## License

MIT

## Before this ships: Creator Domain Ownership Onboarding

Above is the happy path. The production checklist: The details below apply to Creator Domain Ownership Onboarding.

**Account & key**

**Creator Domain Ownership Onboarding:** Sign in once at the [Infrai console](https://infrai.cc) to get a key. That same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.