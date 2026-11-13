import { shouldCompleteOnboarding } from "./domain_onboarding.ts";

if (shouldCompleteOnboarding({ verified: false })) throw new Error("unverified domain must remain pending");
if (!shouldCompleteOnboarding({ verified: true })) throw new Error("verified domain must complete onboarding");
console.log("domain ownership decision passed");
