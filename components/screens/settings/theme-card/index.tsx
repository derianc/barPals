import React from "react";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";

interface IThemeCard {
  title: string;
  icon: any;
  onPress: () => void;
  active: boolean;
}

const ThemeCard = ({ title, icon, onPress, active }: IThemeCard) => {
  return (
    <Pressable
      className={`py-3 px-6 h-14 items-center bg-background-100 rounded-[18px] gap-5 flex-1 flex-row ${
        active ? "bg-background-200 border border-primary-100" : ""
      }`}
      onPress={onPress}
    >
      <Icon as={icon} size="sm" className="text-primary-600" />
      <Text className="font-dm-sans-medium text-typography-900">{title}</Text>
    </Pressable>
  );
};

export default ThemeCard;
