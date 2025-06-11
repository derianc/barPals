declare module 'react-native-vector-icons/Feather';

declare module 'react-native-modal-dropdown' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle, StyleProp } from 'react-native';

  interface ModalDropdownProps {
    defaultValue?: string;
    options: string[] | { label: string; value: any }[];
    onSelect?: (index: string | number, value: any) => void;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    dropdownStyle?: StyleProp<ViewStyle>;
    dropdownTextStyle?: StyleProp<TextStyle>;
    dropdownTextHighlightStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    animated?: boolean;
    showsVerticalScrollIndicator?: boolean;
    renderSeparator?: () => React.ReactNode;
    renderRow?: (option: any, index: string, isSelected: boolean) => React.ReactNode;
  }

  export default class ModalDropdown extends Component<ModalDropdownProps> {}
}
