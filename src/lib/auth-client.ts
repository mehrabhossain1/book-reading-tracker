"use client";

import { createAuthClient } from "better-auth/react";

/** No baseURL: the client talks to /api/auth on whatever origin served the page. */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
