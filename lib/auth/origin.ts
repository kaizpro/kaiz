import "server-only";
import { headers } from "next/headers";
import { resolveAuthOrigin } from "./urls";

export async function getAuthOrigin() {
  return resolveAuthOrigin(process.env, (await headers()).get("origin"));
}
