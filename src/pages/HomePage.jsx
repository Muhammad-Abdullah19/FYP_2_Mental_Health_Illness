import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import IslamicTherapy from '../components/IslamicTherapy';
import DisorderLibrary from '../components/DisorderLibrary';
import DashboardPreview from '../components/DashboardPreview';

function HomePage() {
    return (
        <div className="home-page">
            <Hero />
            <Features />
            <IslamicTherapy />
            <DisorderLibrary />
            <DashboardPreview />
        </div>
    );
}

export default HomePage;
