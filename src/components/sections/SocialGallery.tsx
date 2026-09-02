import Image from "next/image";
import { InstagramIcon } from "@/components/icons/SocialIcons";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { siteConfig } from "@/config/site";

const galleryImages = [
  { id: "social-1", image: "/images/social-1.svg", alt: "A styled table with Clink & Co coupe glasses" },
  { id: "social-2", image: "/images/social-2.svg", alt: "Clink & Co rocks glasses on a home bar cart" },
  { id: "social-3", image: "/images/social-3.svg", alt: "A gift set boxed and ribboned on a linen tablecloth" },
  { id: "social-4", image: "/images/social-4.svg", alt: "Dinner plates and napkins set for a dinner party" },
  { id: "social-5", image: "/images/social-5.svg", alt: "A cocktail shaker and jigger on a marble counter" },
  { id: "social-6", image: "/images/social-6.svg", alt: "Candles and coasters styled on a side table" },
];

export function SocialGallery() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Tag us"
          title="@clinkandco"
          description="Share the moments you raise a glass to — we feature our favourites."
          cta={{ label: "Follow on Instagram", href: siteConfig.social.instagram }}
        />
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {galleryImages.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.05}>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="focus-ring group relative block aspect-square overflow-hidden rounded-2xl"
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal/0 transition-colors duration-300 group-hover:bg-charcoal/40">
                <InstagramIcon className="h-6 w-6 text-warm-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
