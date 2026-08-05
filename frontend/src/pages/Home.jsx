import HeroSlider from "../components/home/HeroSlider";
import {
  ServicesSection, InTouchSection, SupportSection, TestimonialsSection, StayConnectedSection,
} from "../components/home/HomeSections";
import { usePopup } from "../context/PopupContext";

export default function Home() {
  const { open } = usePopup();

  return (
    <div>
      <HeroSlider />
      <ServicesSection />
      <InTouchSection onOpenPopup={open} />
      <SupportSection />
      <TestimonialsSection />
      <StayConnectedSection />
    </div>
  );
}
