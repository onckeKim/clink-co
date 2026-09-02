import { Reveal } from "@/components/motion/Reveal";

const stats = [
  { value: "2018", label: "Founded in Cape Town" },
  { value: "120+", label: "Considered pieces" },
  { value: "30k+", label: "Tables set since" },
];

export function BrandStory() {
  return (
    <section className="bg-soft-grey py-20">
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Our Story</p>
          <h2 className="font-display mt-4 text-display-lg text-charcoal">
            Clink & Co by HEIMSIGHT
          </h2>
          <p className="mt-6 text-base leading-relaxed text-stone">
            We started Clink & Co with a simple frustration: most &ldquo;entertaining&rdquo; ranges are built
            for a single dinner party, then relegated to the back of a cupboard. We wanted the
            opposite — glassware, barware and tableware considered enough for a Saturday dinner
            and sturdy enough for a Tuesday glass of wine on the couch.
          </p>
          <p className="mt-4 text-base leading-relaxed text-stone">
            Every piece in the range is chosen by HEIMSIGHT&apos;s product team for how it feels in the
            hand, not just how it photographs — because the things you gather around should earn
            their place in your everyday rituals, not just your gift registry.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-taupe/30 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-2xl text-charcoal sm:text-3xl">{stat.value}</dd>
                <p className="mt-1 text-xs text-stone">{stat.label}</p>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
