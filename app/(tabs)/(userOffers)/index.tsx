import React from "react";
import { VStack } from "@/components/ui/vstack";
import UserOfferHeader from "@/components/shared/custom-header/userOfferHeader";


const UserOffers = () => {
  
  return (
    <VStack space="md" className="flex-1 bg-background-0">
      <UserOfferHeader />

    </VStack>
  );
};


export default UserOffers;
