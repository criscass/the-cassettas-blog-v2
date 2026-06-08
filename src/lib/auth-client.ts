import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@lib/auth";

// Browser-side client. The React entrypoint exposes `useSession` as a proper
// React hook (the base `/client` export is a nanostore atom instead). `baseURL`
// is omitted so it targets the current origin (works for both local dev and the
// deployed site). `inferAdditionalFields` carries the server's `role`/`status`
// custom fields into the client types.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
