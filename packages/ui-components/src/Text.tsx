import { ReactNode } from "react";
import { Text as RNText, StyleProp, StyleSheet, TextStyle } from "react-native";

type Props = {
	children: ReactNode;
	style?: StyleProp<TextStyle>;
}

export function Text({children, style, ...props}: Props) {
	return <RNText {...props} style={[styles.text, style]}>{children}</RNText>;
}

const styles = StyleSheet.create({
	text: {
		color: "red",
		fontSize: 16,
	},
});