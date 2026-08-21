import React from 'react';

interface WelcomeSectionProps {
  userName?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName = 'Sahil' }) => {
  return (
    <section className="mb-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gym-dark">
          Good Evening, {userName} 👋
        </h1>
        <p className="text-gym-subtle text-sm sm:text-base mt-1 font-medium">
          Check the crowd before you visit.
        </p>
      </div>
    </section>
  );
};
