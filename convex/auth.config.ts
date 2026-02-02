import { AuthConfig } from "convex/server";

export default {
    providers: [
        {
            // Firebase uses securetoken.google.com/{project-id} as the issuer
            domain: "https://securetoken.google.com/duotrak-6367d",
            // The applicationID must match the 'aud' claim in Firebase JWTs
            applicationID: "duotrak-6367d",
        },
    ],
} satisfies AuthConfig;
