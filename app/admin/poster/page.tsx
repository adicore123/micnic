import { redirect } from "next/navigation";

/** הפוסטר עבר לעמוד השיתוף המאוחד */
export default function PosterPage() {
  redirect("/admin/share");
}
