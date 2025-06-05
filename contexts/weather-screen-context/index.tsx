import React, { createContext, useRef, useState } from "react";
import { View } from "react-native";

const WeatherTabContext = createContext({});

const WeatherTabProvider = ({ children }: { children: React.ReactNode }) => {
  const [isChildVisible, setIsChildVisible] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const hasDaysTabAnimated = useRef(false);
  const hasHourlyTabChild1Animated = useRef(false);
  const hasProgressBarAnimated = useRef(0);
  const [childRefs, setChildRefs] = useState([
    { ref: useRef<View>(null), isVisible: false },
    { ref: useRef<View>(null), isVisible: false },
  ]);

  return (
    <WeatherTabContext.Provider
      value={{
        isChildVisible,
        setIsChildVisible,
        selectedTabIndex,
        setSelectedTabIndex,
        scrollViewRef,
        hasDaysTabAnimated,
        hasHourlyTabChild1Animated,
        hasProgressBarAnimated,
        childRefs,
        setChildRefs,
      }}
    >
      {children}
    </WeatherTabContext.Provider>
  );
};

export { WeatherTabContext, WeatherTabProvider };
