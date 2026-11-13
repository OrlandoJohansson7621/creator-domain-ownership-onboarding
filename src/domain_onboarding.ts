import { clientFromEnvironment, InfraiClient } from "./infrai_client.ts";
import { z } from "zod";

type Domain = { zone_id: string };
type Verification = { verified?: boolean };
type User = { id?: string; email?: string };

export async function onboardCreator(input: { domain: string; email: string; token: string }, client = clientFromEnvironment()) {
  const request = z.object({ domain: z.string().min(1), email: z.string().email(), token: z.string().min(1) }).parse(input);
  const domain = await client.request<Domain>("POST", "/v1/dns/domain/add", { domain: request.domain });
  await client.request("PUT", "/v1/dns/record/upsert", {
      zone_id: domain.zone_id,
      record_type: "TXT",
      name: request.domain,
      content: request.token,
      ttl: 300,
      metadata: { purpose: "creator-domain-ownership" }
  });
  const verification = await client.request<Verification>("POST", "/v1/dns/domain/verify", { domain: request.domain });
  if (!verification.verified) return { status: "pending", domain: request.domain } as const;
  const user = await client.request<User>("GET", "/v1/auth/user/get_by_email", { email: request.email }, true);
  return { status: "onboarded", domain: request.domain, user } as const;
}

export function shouldCompleteOnboarding(verification: Verification): boolean {
  return verification.verified === true;
}

export async function run() {
  const domain = process.env.CREATOR_DOMAIN;
  const email = process.env.CREATOR_EMAIL;
  const token = process.env.CREATOR_TXT_TOKEN;
  if (!domain || !email || !token) throw new Error("CREATOR_DOMAIN, CREATOR_EMAIL, and CREATOR_TXT_TOKEN are required");
  console.log(await onboardCreator({ domain, email, token }));
}

if (process.argv[1]?.endsWith("domain_onboarding.ts")) run();
