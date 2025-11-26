import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      className={`relative transition-all duration-300 ${
        isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Gradient overlay during transition */}
      <div
        className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-300 ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(135deg, hsl(203, 89%, 53%) 0%, hsl(270, 70%, 60%) 100%)",
          mixBlendMode: "soft-light",
        }}
      />
      {children}
    </div>
  );
};
