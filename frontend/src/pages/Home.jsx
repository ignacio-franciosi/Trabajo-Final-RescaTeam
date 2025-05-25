import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import FilterPanel from "../components/pets/FilterPanel";
import PetList from "../components/pets/PetList";

const Home = () => {
  const scrollToPets = () => {
    const petsList = document.getElementById("pets-list");
    if (petsList) {
      petsList.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <HeroSection onScrollToPets={scrollToPets} />
      <AboutSection />
      <section id="pets-list" className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Mascotas en Adopción</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FilterPanel onFilterChange={() => {}} />
          </div>
          <div className="md:col-span-3">
            <PetList pets={[]} onPetClick={() => {}} />
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
