import type ThemeColors from "./ThemeColors";

type Theme = {
    // Background colors
    light: ThemeColors,
    dark: ThemeColors,
    // Fonts
    fonts: {
        paragraphFontFamily: string;
        headerFontFamily: string;
        codeFontFamily: string;
        bulletFontFamily: string;
    }
    // Fonts
    sizes: {
        paragraphFontSize: string;
        blockFontSize: string;
        smallFontSize: string;
        titleFontSize: string;
        header1FontSize: string;
        header2FontSize: string;
        header3FontSize: string;
        codeFontSize: string;
    }
    weights: {
        headerFontWeight: string;
        paragraphFontWeight: string;
        boldFontWeight: string;
        linkFontWeight: string;
        codeFontWeight: string;
        bulletFontWeight: string;
    }
    // Spacing
    spacing: {
        paragraphLineHeight: string;
        paragraphLineHeightTight: string;
        headerLineHeight: string;
        paragraphSpacing: string;
        headerSpacing: string;
        indent: string;
        inlinePadding: string;
        blockPadding: string;
        roundedness: string;
    }
}

export const defaultTheme = {
    // Background colors
    light: {
		// Background colors;
		backgroundColor: "#FFFFFF",
		blockBackgroundColor: "#FCFAFA",
		errorBackgroundColor: "#F8D7DA",
	
		// Border colors
		borderColorLight: "#E0E0E0",
		borderColorBold: "#000000",
	
		// Foreground colors
		paragraphColor: "#000000",
		mutedColor: "#9AA1A7",
		highlightColor: "#E8AF22",
		commentColor: "#257F31",
		errorColor: "#721C24",
		linkColor: "#1B499C",
		bulletColor: "#EB2C27"
    },
    dark: {
		// Background colors;
		backgroundColor: "#1C1C1C",
		blockBackgroundColor: "#333333",
		errorBackgroundColor: "#721C24",
	
		// Border colors
		borderColorLight: "#444444",
		borderColorBold: "#DADADA",
	
		// Foreground colors
		paragraphColor: "#DADADA",
		mutedColor: "#666666",
		highlightColor: "#c5a248",
		commentColor: "#1c4722",
		errorColor: "#F8D7DA",
		linkColor: "#73a3fa",
		bulletColor: "#721C24"
	},
    
    // Fonts
    fonts: {
        paragraphFontFamily: '"Georgia", serif',
        headerFontFamily: '"Verdana", serif',
        codeFontFamily: '"Courier New", monospace',
        bulletFontFamily: '"Verdana"'
    },

    // Font sizes
    sizes: {
        paragraphFontSize: "14pt",
        blockFontSize: "11pt",
        smallFontSize: "9pt",
        titleFontSize: "2.4rem",
        header1FontSize: "2rem",
        header2FontSize: "1.5rem",
        header3FontSize: "1rem",
        codeFontSize: "11pt"
    },

    // Font weights
    weights: {
        headerFontWeight: "700",
        paragraphFontWeight: "400",
        boldFontWeight: "700",
        linkFontWeight: "400",
        codeFontWeight: "400",
        bulletFontWeight: "500"
    },

    // Spacing
    spacing: {
        paragraphLineHeight: "1.8em",
        paragraphLineHeightTight: "1.4em",
        headerLineHeight: "1.4em",
        paragraphSpacing: "1.8rem",
        headerSpacing: "2rem",
        indent: "10%",
        inlinePadding: "0.25rem",
        blockPadding: "1rem",
        roundedness: "5px"
    }

}
export default Theme;