import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

type SuccessSheetProps = {
  headerText: string;
  bodyText: string;
  messageSuccess: boolean;
};

const SuccessSheet = ({ headerText, bodyText, messageSuccess }: SuccessSheetProps) => {
  const { colors } = useTheme();

  // Fallback values if COLORS is not defined
  const backgroundColor = messageSuccess ? '#4BB543' : '#FF3B30';
  const iconName = messageSuccess ? 'check' : 'x';

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <View style={[styles.outerCircle, { backgroundColor: backgroundColor, opacity: 0.2 }]} />
        <View style={[styles.innerCircle, { backgroundColor }]}>
          <Feather name={iconName} size={32} color="#fff" />
        </View>
      </View>
      <Text style={[styles.headerText, { color: colors.text }]}>{headerText}</Text>
      <Text style={[styles.bodyText, { color: colors.text }]}>{bodyText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingVertical: 20,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  outerCircle: {
    height: 80,
    width: 80,
    borderRadius: 40,
  },
  innerCircle: {
    height: 65,
    width: 65,
    borderRadius: 32.5,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SuccessSheet;
