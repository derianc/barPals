import {
  Wind,
  CloudRainWind,
  Waves,
  Sunrise,
  Sunset,
} from "lucide-react-native";
import { SunIcon } from "@/components/ui/icon";

export const WindAndPrecipitationData = [
  {
    id: 1,
    icon: Wind,
    text: "Wind speed",
    currentUpdate: "12km/h",
    lastUpdate: "2 km/h",
    arrowDownIcon: true,
    arrowUpIcon: false,
  },
  {
    id: 2,
    icon: CloudRainWind,
    text: "Rain chance",
    currentUpdate: "24%",
    lastUpdate: "10%",
    arrowDownIcon: false,
    arrowUpIcon: true,
  },
];

export const PressureAndUVIndexData = [
  {
    id: 3,
    icon: Waves,
    text: "Pressure",
    currentUpdate: "720 hpa",
    lastUpdate: "32 hpa",
    arrowDownIcon: false,
    arrowUpIcon: true,
  },
  {
    id: 4,
    icon: SunIcon,
    text: "UV Index",
    currentUpdate: "2,3",
    lastUpdate: "0.3",
    arrowDownIcon: true,
    arrowUpIcon: false,
  },
];

export const HourlyForecastData = [
  {
    id: 1,
    time: "Now",
    imgUrl: require("@/assets/images/sun-cloud.png"),
    temperature: 10,
  },
  {
    id: 2,
    time: "10 AM",
    imgUrl: require("@/assets/images/cloud.png"),
    temperature: 8,
  },
  {
    id: 3,
    time: "11 AM",
    imgUrl: require("@/assets/images/cloud.png"),
    temperature: 5,
  },
  {
    id: 4,
    time: "12 PM",
    imgUrl: require("@/assets/images/sun-cloud.png"),
    temperature: 12,
  },
  {
    id: 5,
    time: "1 PM",
    imgUrl: require("@/assets/images/sun-cloud.png"),
    temperature: 9,
  },
  {
    id: 6,
    time: "2 PM",
    imgUrl: require("@/assets/images/sun-cloud.png"),
    temperature: 12,
  },
  {
    id: 7,
    time: "3 PM",
    imgUrl: require("@/assets/images/sun-cloud.png"),
    temperature: 15,
  },
  {
    id: 8,
    time: "4 PM",
    imgUrl: require("@/assets/images/sun-cloud.png"),
    temperature: 13,
  },
  {
    id: 9,
    time: "5 PM",
    imgUrl: require("@/assets/images/cloud.png"),
    temperature: 11,
  },
  {
    id: 10,
    time: "6 PM",
    imgUrl: require("@/assets/images/cloud.png"),
    temperature: 10,
  },
];

export const RainPredictionData = [
  {
    id: 1,
    time: 6,
    value: 27,
  },
  {
    id: 2,
    time: 7,
    value: 44,
  },
  {
    id: 3,
    time: 8,
    value: 56,
  },
  {
    id: 4,
    time: 9,
    value: 88,
  },
];

export const SunriseAndSunsetData = [
  {
    id: 5,
    icon: Sunrise,
    text: "Sunrise",
    currentUpdate: "4:30 AM",
    lastUpdate: "4h ago",
  },
  {
    id: 6,
    icon: Sunset,
    text: "Sunset",
    currentUpdate: "6:50 PM",
    lastUpdate: "in 9h",
  },
];
