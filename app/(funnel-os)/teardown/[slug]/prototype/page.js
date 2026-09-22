import Link from "next/link";
import { notFound } from "next/navigation";
import HelenaPrototype from "@/components/teardown/prototype/HelenaPrototype";
import { Wordmark } from "@/components/teardown/ui";
import { reports } from "@/lib/teardown/reports";

export function generateStaticParams() {
  return Object.keys(reports).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const report = reports[slug];
  return report ? { title: `A first run for ${report.profile.name} — Funnel OS` } : {};
}

/* The shareable prototype: what the prospect opens from a link. */
export default async function PrototypePage({ params }) {
  const { slug } = await params;
  const report = reports[slug];
  if (!report) notFound();

  return (
    <div className="warm-wash min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={`/teardown/${report.slug}`} aria-label="Back to the teardown">
          <Wordmark />
        </Link>
        <span className="text-sm text-kumo-subtle">Prepared for {report.profile.name}</span>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
        <div className="text-center">
          <h1 className="font-display text-[40px] leading-[1.05] text-kumo-strong sm:text-[60px]">
            Helena&apos;s first run, <em>rebuilt</em>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-kumo-strong/80">
            Gather the need, deliver one real win, then make the ask. Pick what you need help with and click through.
          </p>
        </div>
        <HelenaPrototype data={report.firstRun} url={report.url} height={620} className="mt-12" />
      </main>
    </div>
  );
}
