import React from "react";
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Link, LinkText } from "@/components/ui/link";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Box className="px-4 pt-8 pb-4 md:pt-10 md:pb-8 md:rounded-sm md:px-[140px] bg-background-0 flex-1 items-center">
          <Image
            source={require("assets/images/404.png")}
            alt="404 page"
            className="h-96 w-[422px] md:mt-16"
          />
          <Heading className="mt-10 text-2xl text-center text-typography-800 ">
            Oops! Page not found
          </Heading>
          <Text className="text-sm mt-2 mb-8 text-center max-w-72 md:max-w-[372px]">
            The page you are looking for might have been removed, had it’s name
            changed, or is temporary unavailable
          </Text>
          <Link href="/" className="mt-4 py-4">
            <LinkText className="text-sm text-primary-700 group-hover/link:text-primary-800 group-active/link:text-primary-900">
              Go to home screen!
            </LinkText>
          </Link>
        </Box>
      </ScrollView>
    </>
  );
}
