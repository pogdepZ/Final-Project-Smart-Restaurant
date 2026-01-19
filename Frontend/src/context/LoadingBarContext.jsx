import React, { createContext, useContext, useRef, useCallback, useEffect } from "react";
import LoadingBar from "react-top-loading-bar";

const LoadingBarContext = createContext(null);

export const useLoadingBar = () => {
  const context = useContext(LoadingBarContext);
  if (!context) throw new Error("useLoadingBar must be used within LoadingBarProvider");
  return context;
};

// module-level ref để axios interceptor dùng được
let loadingBarRef = null;
let activeRequests = 0;

export const startLoading = () => {
  activeRequests += 1;
  if (activeRequests === 1 && loadingBarRef?.current) {
    loadingBarRef.current.continuousStart(0, 500);
  }
};

export const completeLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0 && loadingBarRef?.current) {
    loadingBarRef.current.complete();
  }
};

export const LoadingBarProvider = ({ children }) => {
  const ref = useRef(null);

  useEffect(() => {
    loadingBarRef = ref;
    return () => {
      loadingBarRef = null;
      activeRequests = 0;
    };
  }, []);

  const start = useCallback(() => startLoading(), []);
  const complete = useCallback(() => completeLoading(), []);
  const staticStart = useCallback(() => ref.current?.staticStart(), []);

  return (
    <LoadingBarContext.Provider value={{ start, complete, staticStart }}>
      <LoadingBar
        ref={ref}
        color="#f97316"
        height={3}
        shadow={true}
        transitionTime={300}
        waitingTime={400}
      />
      {children}
    </LoadingBarContext.Provider>
  );
};

export default LoadingBarProvider;
