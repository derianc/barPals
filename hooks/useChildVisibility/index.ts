import { useEffect, useContext } from "react";
import { Dimensions } from "react-native";
import { WeatherTabContext } from "@/contexts/weather-screen-context";

const useChildVisibility = () => {
  const { scrollViewRef, childRefs, setChildRefs, selectedTabIndex }: any =
    useContext(WeatherTabContext);

  const checkChildVisibility = () => {
    if (childRefs.length !== 0) {
      let flag = false;
      const updatedChildRefs = childRefs.map((childRef: any) => {
        if (childRef.ref.current && scrollViewRef.current) {
          //@ts-ignore
          childRef.ref.current.measureLayout(
            scrollViewRef.current,
            (x: any, y: any, width: any, height: any) => {
              const windowHeight = Dimensions.get("window").height;
              //@ts-ignore
              const scrollY = scrollViewRef.current?._scrollY || 0;
              const isVisible =
                y >= scrollY && y <= scrollY + windowHeight - height;

              if (childRef.isVisible === false && isVisible) {
                childRef.isVisible = isVisible;
                flag = true;
              }
            },
            () => console.log("Measurement failed")
          );
        }
        return childRef;
      });
      if (flag) {
        setChildRefs(updatedChildRefs);
      }
    }
  };

  const handleScroll = (e: any) => {
    if (scrollViewRef.current) {
      scrollViewRef.current._scrollY = e.nativeEvent.contentOffset.y;
      checkChildVisibility();
    }
  };

  useEffect(() => {
    if (selectedTabIndex === 0) {
      checkChildVisibility();
    }
  }, [selectedTabIndex]);

  return { handleScroll };
};

export default useChildVisibility;
