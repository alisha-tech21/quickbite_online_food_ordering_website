import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Hero from "../../components/home/Hero";
import Categories from "../../components/home/Categories";
import PopularRestaurants from "../../components/home/PopularRestaurants";
import PopularDishes from "../../components/home/PopularDishes";
import SpecialOfferBanner from "../../components/home/SpecialOfferBanner";
import HowItWorks from "../../components/home/HowItWorks";
import Testimonials from "../../components/home/Testimonials";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f8fb]">
      {/* Main Navigation Bar */}
      <Navbar />

      {/* Hero Section Component */}
      <main className="flex-1">
        <Hero />
        <Categories />
        <PopularRestaurants />
        <PopularDishes />
        <SpecialOfferBanner />
        <HowItWorks />
        <Testimonials />
        {/* Baqi sections (Categories, Popular Restaurants, etc.) yahan aage add honge */}
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default Home;
