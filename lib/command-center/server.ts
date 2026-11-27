import { requireAuthenticatedUser } from "../structural-labeling/server";
export async function requireCommandCenterOwner(authorization: string | null) {
  if (!authorization?.match(/^Bearer \S+$/)) throw new Error("authentication_required");
  const context = await requireAuthenticatedUser(authorization);
  if (context.user.email?.toLowerCase() !== "dehghani.pmp@gmail.com" || !context.user.email_confirmed_at)
    throw new Error("forbidden");
  return context;
}
export function commandCenterError(error: unknown) {
  const message = error instanceof Error ? error.message : "request_failed";
  return { status: message === "authentication_required" ? 401 : message === "forbidden" ? 403 : 503,
    error: message === "authentication_required" || message === "forbidden" ? message : "Command Center backend unavailable" };
}
