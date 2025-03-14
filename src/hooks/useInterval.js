import { useEffect, useRef } from 'react';

/**
 * Custom hook that provides a declarative setInterval
 * Taken from Dan Abramov's blog post: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 * 
 * @param {Function} callback - Function to call on each interval
 * @param {number} delay - Delay in milliseconds. Pass null to pause the interval
 */
function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default useInterval;