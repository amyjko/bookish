import type ThemeColors from './ThemeColors';

type Theme = {
    // A list of URLs to CSS files (for including @font-face declarations other other custom style).
    imports?: string[];
    // Background colors
    light?: ThemeColors;
    dark?: ThemeColors;
    // Fonts
    fonts?: {
        paragraphFontFamily?: string;
        headerFontFamily?: string;
        codeFontFamily?: string;
        bulletFontFamily?: string;
    };
    // Fonts
    sizes?: {
        paragraphFontSize?: string;
        blockFontSize?: string;
        smallFontSize?: string;
        titleFontSize?: string;
        header1FontSize?: string;
        header2FontSize?: string;
        header3FontSize?: string;
        codeFontSize?: string;
    };
    weights?: {
        headerFontWeight?: string;
        paragraphFontWeight?: string;
        boldFontWeight?: string;
        linkFontWeight?: string;
        codeFontWeight?: string;
        bulletFontWeight?: string;
    };
    // Spacing
    spacing?: {
        paragraphLineHeight?: string;
        paragraphLineHeightTight?: string;
        headerLineHeight?: string;
        paragraphSpacing?: string;
        headerSpacing?: string;
        indent?: string;
        inlinePadding?: string;
        blockPadding?: string;
        roundedness?: string;
    };
};

export default Theme;

export const BookishTheme = {
    imports: [
        'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@300;700&display=swap',
    ],
    // Background colors
    light: {
        // Background colors;
        backgroundColor: '#FFFFFF',
        blockBackgroundColor: '#FCFAFA',
        errorBackgroundColor: '#F8D7DA',

        // Border colors
        borderColorLight: '#E0E0E0',
        borderColorBold: '#000000',

        // Foreground colors
        paragraphColor: '#000000',
        mutedColor: '#9AA1A7',
        highlightColor: '#E8AF22',
        commentColor: '#257F31',
        errorColor: '#721C24',
        linkColor: '#1B499C',
        bulletColor: '#EB2C27',
    },
    dark: {
        // Background colors;
        backgroundColor: '#1C1C1C',
        blockBackgroundColor: '#333333',
        errorBackgroundColor: '#721C24',

        // Border colors
        borderColorLight: '#444444',
        borderColorBold: '#DADADA',

        // Foreground colors
        paragraphColor: '#DADADA',
        mutedColor: '#666666',
        highlightColor: '#c5a248',
        commentColor: '#1c4722',
        errorColor: '#F8D7DA',
        linkColor: '#73a3fa',
        bulletColor: '#721C24',
    },

    // Fonts
    fonts: {
        paragraphFontFamily: '"Noto Serif", serif',
        headerFontFamily: '"Outfit", serif',
        codeFontFamily: '"Courier New", monospace',
        bulletFontFamily: '"Outfit", serif',
    },

    // Font sizes
    sizes: {
        paragraphFontSize: '14pt',
        blockFontSize: '11pt',
        smallFontSize: '9pt',
        titleFontSize: '30pt',
        header1FontSize: '24pt',
        header2FontSize: '20pt',
        header3FontSize: '14pt',
        codeFontSize: '12pt',
    },

    // Font weights
    weights: {
        headerFontWeight: '700',
        paragraphFontWeight: '400',
        boldFontWeight: '700',
        linkFontWeight: '400',
        codeFontWeight: '400',
        bulletFontWeight: '500',
    },

    // Spacing
    spacing: {
        paragraphLineHeight: '1.8em',
        paragraphLineHeightTight: '1.4em',
        headerLineHeight: '1.4em',
        paragraphSpacing: '1.8rem',
        headerSpacing: '2rem',
        indent: '10%',
        inlinePadding: '0.25rem',
        blockPadding: '1rem',
        roundedness: '5px',
    },
};

export const SeriousTheme: Theme = {
    imports: [
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:ital,wght@0,300;0,500;1,300&display=swap',
    ],
    // Background colors
    light: {
        // Background colors;
        backgroundColor: '#FFFFFF',
        blockBackgroundColor: '#FCFAFA',
        errorBackgroundColor: '#F8D7DA',

        // Border colors
        borderColorLight: '#E0E0E0',
        borderColorBold: '#000000',

        // Foreground colors
        paragraphColor: '#000000',
        mutedColor: '#9AA1A7',
        highlightColor: '#bb4242',
        commentColor: '#257F31',
        errorColor: '#721C24',
        linkColor: '#bb4242',
        bulletColor: '#bb4242',
    },
    dark: {
        // Background colors;
        backgroundColor: '#010101',
        blockBackgroundColor: '#333333',
        errorBackgroundColor: '#721C24',

        // Border colors
        borderColorLight: '#444444',
        borderColorBold: '#DADADA',

        // Foreground colors
        paragraphColor: '#DADADA',
        mutedColor: '#666666',
        highlightColor: '#b36363',
        commentColor: '#1c4722',
        errorColor: '#F8D7DA',
        linkColor: '#b36363',
        bulletColor: '#b36363',
    },

    // Fonts
    fonts: {
        paragraphFontFamily: '"Roboto", serif',
        headerFontFamily: '"Bebas Neue", serif',
        codeFontFamily: '"Courier New", monospace',
        bulletFontFamily: '"Roboto"',
    },

    // Font sizes
    sizes: {
        paragraphFontSize: '14pt',
        blockFontSize: '11pt',
        smallFontSize: '9pt',
        titleFontSize: '30pt',
        header1FontSize: '24pt',
        header2FontSize: '20pt',
        header3FontSize: '14pt',
        codeFontSize: '12pt',
    },

    // Font weights
    weights: {
        headerFontWeight: '700',
        paragraphFontWeight: '300',
        boldFontWeight: '500',
        linkFontWeight: '300',
        codeFontWeight: '400',
        bulletFontWeight: '500',
    },

    // Spacing
    spacing: {
        paragraphLineHeight: '2rem',
        paragraphLineHeightTight: '1.4em',
        headerLineHeight: '1.3em',
        paragraphSpacing: '1.8rem',
        headerSpacing: '2rem',
        indent: '10%',
        inlinePadding: '0.25rem',
        blockPadding: '1rem',
        roundedness: '5px',
    },
};

export const TechTheme: Theme = {
    imports: [
        'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,500;1,300&family=Russo+One&display=swap',
    ],
    // Background colors
    light: {
        // Background colors;
        backgroundColor: '#FFFFFF',
        blockBackgroundColor: '#FCFAFA',
        errorBackgroundColor: '#F8D7DA',

        // Border colors
        borderColorLight: '#E0E0E0',
        borderColorBold: '#000000',

        // Foreground colors
        paragraphColor: '#000000',
        mutedColor: '#9AA1A7',
        highlightColor: '#6480ff',
        commentColor: '#257F31',
        errorColor: '#721C24',
        linkColor: '#6480ff',
        bulletColor: '#6480ff',
    },
    dark: {
        // Background colors;
        backgroundColor: '#000000',
        blockBackgroundColor: '#333333',
        errorBackgroundColor: '#721C24',

        // Border colors
        borderColorLight: '#444444',
        borderColorBold: '#DADADA',

        // Foreground colors
        paragraphColor: '#DADADA',
        mutedColor: '#959595',
        highlightColor: '#7589e6',
        commentColor: '#2bb33e',
        errorColor: '#F8D7DA',
        linkColor: '#7589e6',
        bulletColor: '#7589e6',
    },

    // Fonts
    fonts: {
        paragraphFontFamily: '"Roboto", serif',
        headerFontFamily: '"Russo One", serif',
        bulletFontFamily: '"Roboto"',
        codeFontFamily: '"Courier New", monospace',
    },

    // Font sizes
    sizes: {
        paragraphFontSize: '14pt',
        blockFontSize: '11pt',
        smallFontSize: '9pt',
        titleFontSize: '30pt',
        header1FontSize: '24pt',
        header2FontSize: '20pt',
        header3FontSize: '14pt',
        codeFontSize: '12pt',
    },

    // Font weights
    weights: {
        headerFontWeight: '300',
        paragraphFontWeight: '300',
        boldFontWeight: '500',
        linkFontWeight: '400',
        codeFontWeight: '400',
        bulletFontWeight: '500',
    },

    // Spacing
    spacing: {
        paragraphLineHeight: '2rem',
        paragraphLineHeightTight: '1.4em',
        headerLineHeight: '3em',
        paragraphSpacing: '1.8rem',
        headerSpacing: '1.4rem',
        indent: '10%',
        inlinePadding: '0.25rem',
        blockPadding: '1rem',
        roundedness: '5px',
    },
};

export const HumanTheme: Theme = {
    imports: [
        'https://fonts.googleapis.com/css2?family=Caveat&family=Piazzolla:ital,wght@0,300;0,700;1,300&display=swap',
    ],
    // Background colors
    light: {
        // Background colors;
        backgroundColor: '#FFFFFF',
        blockBackgroundColor: '#FCFAFA',
        errorBackgroundColor: '#F8D7DA',

        // Border colors
        borderColorLight: '#E0E0E0',
        borderColorBold: '#000000',

        // Foreground colors
        paragraphColor: '#000000',
        mutedColor: '#9AA1A7',
        highlightColor: '#3b92e4',
        commentColor: '#257F31',
        errorColor: '#721C24',
        linkColor: '#3b92e4',
        bulletColor: '#3b92e4',
    },
    dark: {
        // Background colors;
        backgroundColor: '#141421',
        blockBackgroundColor: '#333333',
        errorBackgroundColor: '#721C24',

        // Border colors
        borderColorLight: '#444444',
        borderColorBold: '#DADADA',

        // Foreground colors
        paragraphColor: '#DADADA',
        mutedColor: '#666666',
        highlightColor: '#2b8ae3',
        commentColor: '#1c4722',
        errorColor: '#F8D7DA',
        linkColor: '#2b8ae3',
        bulletColor: '#2b8ae3',
    },

    // Fonts
    fonts: {
        paragraphFontFamily: '"Piazzolla", serif',
        headerFontFamily: '"Caveat", serif',
        codeFontFamily: '"Courier New", monospace',
        bulletFontFamily: '"Caveat", serif',
    },

    // Font sizes
    sizes: {
        paragraphFontSize: '14pt',
        blockFontSize: '11pt',
        smallFontSize: '10pt',
        titleFontSize: '36pt',
        header1FontSize: '30pt',
        header2FontSize: '24pt',
        header3FontSize: '20pt',
        codeFontSize: '11pt',
    },

    // Font weights
    weights: {
        headerFontWeight: '700',
        paragraphFontWeight: '300',
        boldFontWeight: '700',
        linkFontWeight: '700',
        codeFontWeight: '400',
        bulletFontWeight: '300',
    },

    // Spacing
    spacing: {
        paragraphLineHeight: '2.2rem',
        paragraphLineHeightTight: '1.8em',
        headerLineHeight: '1.4em',
        paragraphSpacing: '1.8rem',
        headerSpacing: '2rem',
        indent: '10%',
        inlinePadding: '0.25rem',
        blockPadding: '1rem',
        roundedness: '5px',
    },
};

export const SketchyTheme: Theme = {
    imports: [
        'https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,300;0,500;1,300&family=Cabin+Sketch&display=swap',
    ],
    // Background colors
    light: {
        // Background colors;
        backgroundColor: '#FFFFFF',
        blockBackgroundColor: '#FCFAFA',
        errorBackgroundColor: '#F8D7DA',

        // Border colors
        borderColorLight: '#E0E0E0',
        borderColorBold: '#000000',

        // Foreground colors
        paragraphColor: '#000000',
        mutedColor: '#9AA1A7',
        highlightColor: '#dbb13e',
        commentColor: '#257F31',
        errorColor: '#721C24',
        linkColor: '#dbb13e',
        bulletColor: '#dbb13e',
    },
    dark: {
        // Background colors;
        backgroundColor: '#1C1C1C',
        blockBackgroundColor: '#333333',
        errorBackgroundColor: '#721C24',

        // Border colors
        borderColorLight: '#444444',
        borderColorBold: '#DADADA',

        // Foreground colors
        paragraphColor: '#DADADA',
        mutedColor: '#666666',
        highlightColor: '#9c7e2c',
        commentColor: '#1c4722',
        errorColor: '#F8D7DA',
        linkColor: '#9c7e2c',
        bulletColor: '#9c7e2c',
    },

    // Fonts
    fonts: {
        paragraphFontFamily: '"Bitter", serif',
        headerFontFamily: '"Cabin Sketch", serif',
        codeFontFamily: '"Courier New", monospace',
        bulletFontFamily: '"Verdana"',
    },

    // Font sizes
    sizes: {
        paragraphFontSize: '14pt',
        blockFontSize: '11pt',
        smallFontSize: '9pt',
        titleFontSize: '32pt',
        header1FontSize: '26pt',
        header2FontSize: '22pt',
        header3FontSize: '16pt',
        codeFontSize: '12pt',
    },

    // Font weights
    weights: {
        headerFontWeight: '500',
        paragraphFontWeight: '300',
        boldFontWeight: '500',
        linkFontWeight: '400',
        codeFontWeight: '400',
        bulletFontWeight: '500',
    },

    // Spacing
    spacing: {
        paragraphLineHeight: '2.4em',
        paragraphLineHeightTight: '1.8em',
        headerLineHeight: '1.3em',
        paragraphSpacing: '1.8rem',
        headerSpacing: '2rem',
        indent: '10%',
        inlinePadding: '0.25rem',
        blockPadding: '1rem',
        roundedness: '5px',
    },
};

export const CriticalTheme: Theme = {
    imports: [
        'https://fonts.googleapis.com/css2?family=Arvo:ital,wght@0,400;0,700;1,400;1,700&display=block',
        'https://fonts.googleapis.com/css2?family=DM+Mono&display=block',
        'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500&display=block',
        'https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    ],

    // Background colors
    light: {
        // Background colors;
        backgroundColor: '#FFFFFF',
        blockBackgroundColor: '#FCFAFA',
        errorBackgroundColor: '#F8D7DA',

        // Border colors
        borderColorLight: '#E0E0E0',
        borderColorBold: '#000000',

        // Foreground colors
        paragraphColor: '#000000',
        mutedColor: '#9AA1A7',
        highlightColor: '#E8AF22',
        commentColor: '#257F31',
        errorColor: '#721C24',
        linkColor: '#1B499C',
        bulletColor: '#EB2C27',
    },
    dark: {
        // Background colors;
        backgroundColor: '#1C1C1C',
        blockBackgroundColor: '#333333',
        errorBackgroundColor: '#721C24',

        // Border colors
        borderColorLight: '#444444',
        borderColorBold: '#DADADA',

        // Foreground colors
        paragraphColor: '#DADADA',
        mutedColor: '#CCCCCC',
        highlightColor: '#5c4d28',
        commentColor: '#1c4722',
        errorColor: '#F8D7DA',
        linkColor: '#73a3fa',
        bulletColor: '#721C24',
    },

    // Fonts
    fonts: {
        paragraphFontFamily: '"Bitter", serif',
        headerFontFamily: '"Arvo", serif',
        codeFontFamily: '"DM Mono", monospace',
        bulletFontFamily: '"M Plus Rounded 1c", serif',
    },

    // Font sizes
    sizes: {
        paragraphFontSize: '14pt',
        blockFontSize: '11pt',
        smallFontSize: '9pt',
        titleFontSize: '30pt',
        header1FontSize: '24pt',
        header2FontSize: '20pt',
        header3FontSize: '14pt',
        codeFontSize: '12pt',
    },

    // Font weights
    weights: {
        headerFontWeight: '700',
        paragraphFontWeight: '400',
        boldFontWeight: '700',
        linkFontWeight: '400',
        codeFontWeight: '400',
        bulletFontWeight: '400',
    },

    // Spacing
    spacing: {
        paragraphLineHeight: '2.2em',
        paragraphLineHeightTight: '1.5em',
        headerLineHeight: '1.4em',
        paragraphSpacing: '1.8rem',
        headerSpacing: '2rem',
        indent: '10%',
        inlinePadding: '0.25rem',
        blockPadding: '0.75em',
        roundedness: '5px',
    },
};
