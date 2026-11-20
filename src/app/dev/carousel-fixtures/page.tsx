import { notFound } from "next/navigation";
import { FixtureStudio } from "./studio";
export default function FixturePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <FixtureStudio/>;
}
