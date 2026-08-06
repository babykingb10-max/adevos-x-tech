import HeroSlider from "../components/home/HeroSlider";
import {
  ServicesSection, InTouchSection, SupportSection, TestimonialsSection, StayConnectedSection,
} from "../components/home/HomeSections";

export default function Home() {
  return (
    <div>
      <HeroSlider />
      <ServicesSection />
      <InTouchSection />
      <SupportSection />
      <TestimonialsSection />
      <StayConnectedSection />
    </div>
  );
}
