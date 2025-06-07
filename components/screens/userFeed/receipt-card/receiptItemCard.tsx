// import React from "react";
// import { VStack } from "@/components/ui/vstack";
// import { HStack } from "@/components/ui/hstack";
// import { Text } from "@/components/ui/text";
// import { Divider } from "@/components/ui/divider";
// import { TransactionItem } from "@/data/models/transactionModel";

// interface ReceiptItemCardProps {
//   items: TransactionItem[];
// }

// const ReceiptItemCard: React.FC<ReceiptItemCardProps> = ({ items }) => {
//   try {
//     return (
//       <VStack className="bg-background-100 rounded-2xl p-4 gap-3 mt-[-12px]">
//         <Text className="text-typography-600" style={{ fontFamily: "dm-sans-regular" }}>
//           Items
//         </Text>
//         <Divider className="bg-outline-200" />
//         {items.map((item, index) => (
//           <HStack key={index} className="justify-between items-center">
//             <VStack className="flex-1">
//               <Text className="text-typography-600" style={{ fontFamily: "dm-sans-regular" }}>
//                 {item.item_name ?? "Unnamed item"}
//               </Text>
//             </VStack>
//             <Text className="text-typography-500">x{item.quantity ?? 1}</Text>
//             <Text className="text-typography-700">
//               ${item.price?.toFixed(2) ?? "0.00"}
//             </Text>
//           </HStack>
//         ))}
//       </VStack>
//     );
//   } catch (error) {
//     console.error("❌ Failed to render ReceiptItemCard:", error);
//     return (
//       <VStack className="bg-red-100 rounded-xl p-4">
//         <Text className="text-red-700 font-semibold">
//           Failed to render item details.
//         </Text>
//       </VStack>
//     );
//   }
// };

// export default ReceiptItemCard;


import React from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { TransactionItem } from "@/data/models/transactionModel";

interface ReceiptItemCardProps {
  items: TransactionItem[];
  isSelected?: boolean;
}

const ReceiptItemCard: React.FC<ReceiptItemCardProps> = ({ items, isSelected = false }) => {
  try {
    return (
      <VStack
        className={`w-[90%] self-center mt-[-1px] rounded-b-2xl pb-4 px-4 gap-3 ${
          isSelected ? "bg-primary-100" : "bg-background-50"
        }`}
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        {/* <Text className="text-typography-600 font-semibold" style={{ fontFamily: "dm-sans-regular" }}>
          Items
        </Text>
        <Divider className="bg-outline-200" /> */}
        {items.map((item, index) => (
          <HStack key={index} className="justify-between items-center">
            <VStack className="flex-1">
              <Text className="text-typography-600" style={{ fontFamily: "dm-sans-regular" }}>
                {item.item_name ?? "Unnamed item"}
              </Text>
            </VStack>
            <Text className="text-typography-500">x{item.quantity ?? 1}</Text>
            <Text className="text-typography-700">
              ${item.price?.toFixed(2) ?? "0.00"}
            </Text>
          </HStack>
        ))}
      </VStack>
    );
  } catch (error) {
    console.error("❌ Failed to render ReceiptItemCard:", error);
    return (
      <VStack className="bg-red-100 rounded-xl p-4 w-4/5 self-center mt-[-12px]">
        <Text className="text-red-700 font-semibold">
          Failed to render item details.
        </Text>
      </VStack>
    );
  }
};

export default ReceiptItemCard;
