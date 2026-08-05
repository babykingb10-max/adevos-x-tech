import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import Heading from "../ui/Heading";
import { usePopup } from "../../context/PopupContext";

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const { open } = usePopup();

  useEffect(() => {
    api.get("/hero-slides").then((res) => setSlides(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 4000); // short slide interval
    return () => clearInterval(t);
  }, [slides]);

  if (!slides.length) return null;
  const slide = slides[active];
  const isPopup = slide.actionType === "internal" && slide.actionTarget.startsWith("popup:");
  const isExternal = slide.actionType === "external";

  return (
    <section className="relative overflow-hidden rounded-2xl mx-4 mt-4">
      <img src={slide.imageUrl} alt={slide.heading} className="w-full h-64 md:h-96 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
        <Heading as="h1" className="text-2xl md:text-4xl text-white dark:text-white">{slide.heading}</Heading>
        <p className="text-white/80 text-sm mt-2 max-w-md font-body">{slide.description}</p>

        {isExternal ? (
          <a href={slide.actionTarget} target="_blank" rel="noreferrer" className="btn-primary inline-block mt-4 w-fit">{slide.buttonLabel}</a>
        ) : isPopup ? (
          <button onClick={() => open(slide.actionTarget)} className="btn-primary inline-block mt-4 w-fit">{slide.buttonLabel}</button>
        ) : (
          <Link to={slide.actionTarget} className="btn-primary inline-block mt-4 w-fit">{slide.buttonLabel}</Link>
        )}
      </div>

      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full ${i === active ? "bg-brand-dark" : "bg-white/40"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
