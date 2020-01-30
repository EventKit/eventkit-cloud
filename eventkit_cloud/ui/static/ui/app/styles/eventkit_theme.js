import topo_light from '../../images/topoBackground.png';
import topo_dark from '../../images/ek_topo_pattern.png';
import logo from '../../images/eventkit-logo.1.png';
import basemap from '../../images/icn_basemap.svg';
import favicon from '../../images/favicon.png';
import reddotfavicon from '../../images/reddotfavicon.png';

export const breakpoints = {
    values: {
        lg: 992,
        md: 768,
        sm: 576,
        xl: 1200,
        xs: 0,
    },
};

// define the main eventkit colors
export const colors = {
    backdrop: 'rgba(0,0,0,0.2)',
    background: '#161e2e',
    background_light: '#253447',
    black: '#000',
    grey: '#808080',
    over: '#faa619',
    primary: '#4598bf',
    primary_dark: '#3982a4',
    primary_light: '#63a8c9',
    running: '#f4d225',
    secondary: '#f5f5f5',
    secondary_dark: '#d6d6d6',
    secondary_light: '#fafafa',
    selected_primary: '#d5e6f1',
    selected_primary_dark: '#c2dbeb',
    selected_secondary: 'rgba(0, 0, 0, 0.8)',
    success: '#55ba63',
    text_primary: '#707274',
    warning: '#ce4427',
    white: '#fff',
};

export const images = {
    basemap,
    favicon,
    logo,
    reddotfavicon,
    topo_dark,
    topo_light
};

// define a global theme for the application
export const theme = {
    // add in all the eventkit specific styles so they are accessible to all JSS styled components
    // override the media query breakpoints
    breakpoints: {
        ...breakpoints,
    },
    // or components using withTheme() https://material-ui.com/customization/themes/#withtheme-component-component
    eventkit: {
        colors: { ...colors },
        images: { ...images },
    },
    // override specific MUI styles for all instances of a component
    overrides: {
        MuiButton: {
            containedSecondary: {
                '&$disabled': {
                    backgroundColor: colors.secondary_dark,
                    color: colors.grey,
                },
                color: colors.primary,
            },
            root: {
                borderRadius: '0px',
                fontSize: '14px',
                height: '36px',
                lineHeight: '36px',
                minHeight: '30px',
                padding: '0px 16px',
            },
        },
        MuiCheckbox: {
            colorPrimary: {
                '&$checked': { color: colors.primary },
                '&$disabled': { color: colors.grey },
                color: colors.primary,
            },
        },
        MuiIconButton: {
            root: {
                padding: '0px',
            },
        },
        MuiInput: {
            underline: {
                '&:after': {
                    borderBottomColor: colors.primary,
                },
                '&:before': {
                    borderBottomColor: colors.primary,
                },
                '&:hover:not($disabled):not($error):not($focused):before': {
                    borderBottomColor: colors.primary,
                },
            },
        },
        MuiList: {
            padding: {
                paddingBottom: '0px',
                paddingTop: '0px',
            },
        },
        MuiMenuItem: {
            root: {
                '&$selected': {
                    backgroundColor: colors.selected_primary,
                },
                backgroundColor: 'transparent',
                color: colors.grey,
            },
            selected: {
                backgroundColor: colors.selected_primary,
                color: colors.primary,
            },
        },
        MuiSvgIcon: {
            colorSecondary: {
                color: colors.white,
            },
        },
        MuiTableCell: {
            body: {
                fontSize: '12px',
            },
            footer: {
                fontSize: '12px',
            },
            head: {
                fontSize: '12px',
            },
        },
        MuiTypography: {
            root: {
                width: '100%',
            },
        },
    },
    // adjust the MUI color palette to EK style
    palette: {
        primary: {
            dark: colors.primary_dark,
            light: colors.primary_light,
            main: colors.primary,
        },
        secondary: {
            dark: colors.secondary_dark,
            light: colors.secondary_light,
            main: colors.secondary,
        },
    },
};

export default theme;
