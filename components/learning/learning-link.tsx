import Link from "next/link";
import type { ComponentProps } from "react";

// Dense public catalogs should navigate on demand, not prefetch every linked
// topic or personalized destination merely because it entered the viewport.
export default function LearningLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false}/>;
}
