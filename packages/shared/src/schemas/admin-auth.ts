import { z } from "zod";

/**
 * Request body for the admin login endpoint. The server verifies these against
 * the configured admin credentials; they are never persisted client-side.
 */
export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Response from a successful admin login: an opaque session token used to
 * authorize subsequent admin requests (sent as an `authorization: Bearer`
 * header). The token carries no meaning to the client.
 */
export const loginResponseSchema = z.object({
  token: z.string().min(1),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
