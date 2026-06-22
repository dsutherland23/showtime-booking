import React from 'react';
import { HeroSection } from "@/components/ui/3d-hero-section-boxes";

// This is the main component for this specific page/route
export function HomePage() {
  return (
    // You might have a <main> tag or other wrappers provided by your layout.tsx
    // but the core usage is just rendering the component.
    <div>
      <HeroSection />

      {/* Optional: Add other sections of your page below the hero */}
      {/*
      <section className="py-16 bg-white text-black">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Features Section</h2>
          <p>More content goes here...</p>
        </div>
      </section>
      */}
    </div>
  );
}
