import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import CategoryCards from "../components/home/CategoryCards";

const Home = () => {
  const location = useLocation();
  // const [filters, setFilters] = useState({});

  useEffect(() => {
    if (location.hash === "#pets-list") {
      const section = document.getElementById("pets-list");
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const scrollToPets = () => {
    const petsList = document.getElementById("pets-list");
    if (petsList) {
      petsList.scrollIntoView({ behavior: "smooth" });
    }
  };

  // const handleFilterChange = (updatedFilters) => {
  //   setFilters(updatedFilters);
  // };

  return (
    <>
      <HeroSection onScrollToPets={scrollToPets} />
      <AboutSection />
      <CategoryCards />
    </>
  );
};

export default Home;
