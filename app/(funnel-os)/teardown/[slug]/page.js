import { notFound } from "next/navigation";
import TeardownConsole from "@/components/teardown/TeardownConsole";
import { reports } from "@/lib/teardown/reports";

export function generateStaticParams() {
  return Object.keys(reports).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const report = reports[slug];
  return report ? { title: `${report.profile.name} teardown — Funnel OS` } : {};
}

export default async function TeardownPage({ params }) {
  const { slug } = await params;
  const report = reports[slug];
  if (!report) notFound();
  return <TeardownConsole report={report} start="done" />;
}
