import React from "react";
import { View, Text, Image } from "react-native";
import { format, parseISO } from "date-fns";
import { Clock, CalendarCheck } from "lucide-react-native";

type Offer = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
};

const OfferCard = ({ offer }: { offer: Offer }) => {
  return (
    <View className="bg-blue-50 rounded-2xl shadow-sm p-4 mb-4">
      {/* Image (optional) */}
      {offer.image_url && (
        <Image
          source={{ uri: offer.image_url }}
          className="w-full h-40 rounded-xl mb-3"
          resizeMode="cover"
        />
      )}

      {/* Title */}
      <Text className="text-lg font-semibold text-blue-900 mb-1">
        {offer.title}
      </Text>

      {/* Description */}
      <Text className="text-sm text-blue-800 mb-3">{offer.description}</Text>

      {/* Validity info */}
      <View className="flex-row items-center mb-1">
        <CalendarCheck size={16} color="#1e3a8a" className="mr-1" />
        <Text className="text-xs text-blue-700">
          {format(parseISO(offer.valid_from), "MMM d")} →{" "}
          {format(parseISO(offer.valid_until), "MMM d")}
        </Text>
      </View>

      {/* Created at */}
      <View className="flex-row items-center">
        <Clock size={14} color="#1e40af" className="mr-1" />
        <Text className="text-[11px] text-blue-600">
          Created {format(parseISO(offer.created_at), "MMM d, yyyy")}
        </Text>
      </View>
    </View>
  );
};

export default OfferCard;
