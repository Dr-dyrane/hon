"use client";

import { useEffect } from "react";
import AOS from "aos";

export function AOSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 100,
      delay: 0,
    });
  }, []);

  return <>{children}</>;
}
