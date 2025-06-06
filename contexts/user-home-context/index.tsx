import React, { createContext, useRef, useState } from "react";
import { View } from "react-native";

interface WeatherTabContextType {
  isChildVisible: boolean;
  setIsChildVisible: (v: boolean) => void;
  selectedTabIndex: number;
  setSelectedTabIndex: (v: number) => void;
  scrollViewRef: React.RefObject<any>;
  hasDaysTabAnimated: React.MutableRefObject<boolean>;
  hasHourlyTabChild1Animated: React.MutableRefObject<boolean>;
  hasProgressBarAnimated: React.MutableRefObject<number>;
  childRefs: { ref: React.RefObject<View | null>; isVisible: boolean }[];
  setChildRefs: React.Dispatch<React.SetStateAction<{ ref: React.RefObject<View | null>; isVisible: boolean }[]>>;
}

const WeatherTabContext = createContext({} as WeatherTabContextType);

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
