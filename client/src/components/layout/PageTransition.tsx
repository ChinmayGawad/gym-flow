import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [navigatingKey, setNavigatingKey] = useState(location.pathname);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Scroll to top cleanly upon navigation
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Trigger subtle top route progress bar
    setNavigatingKey(location.pathname);
    setIsNavigating(true);

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 320);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {/* Top 2px route loading bar indicator */}
      {isNavigating && (
        <div
          key={`bar-${navigatingKey}`}
          className="fixed top-0 left-0 right-0 h-[2.5px] bg-zinc-900 dark:bg-white z-[100] animate-route-progress pointer-events-none shadow-xs"
        />
      )}

      {/* Main Page Content Entrance Animation */}
      <div key={location.pathname} className="animate-page-enter w-full">
        {children}
      </div>
    </>
  );
};

export default PageTransition;
