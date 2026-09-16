import { useEffect, useRef } from "react";

/**
 * Ensures that whenever the user attempts to go back — whether via:
 * 1. UI "Back to dashboards" button (which calls onBack directly)
 * 2. Browser back button (popstate event)
 * 3. Touchpad swipe back gesture (popstate event)
 * 4. Mouse back side button (auxclick button 3 / 4)
 * 5. Keyboard back shortcuts (Alt+Left / Cmd+[)
 *
 * the onBack callback is executed cleanly to reset template state and navigate.
 */
export function useOnBackHandler(onBack) {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (typeof onBack !== "function") return;

    const handlePopState = () => {
      if (onBackRef.current) {
        onBackRef.current();
      }
    };

    const handleAuxClick = (e) => {
      // Mouse button 3 or 4 is Browser Back in DOM MouseEvent standard
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        if (onBackRef.current) {
          onBackRef.current();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("auxclick", handleAuxClick);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("auxclick", handleAuxClick);
    };
  }, [onBack]);
}
