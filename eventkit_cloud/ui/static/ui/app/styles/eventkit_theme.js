import topo_light from '../../images/topoBackground.png';
import topo_dark from '../../images/ek_topo_pattern.png';
import logo from '../../images/eventkit-logo.1.png';

export const breakpoints = {
    values: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
    },
};

// define the main eventkit colors
export const colors = {
    primary: '#4598bf',
    primary_light: '#63a8c9',
    primary_dark: '#3982a4',
    secondary: '#f5f5f5',
    secondary_light: '#fafafa',
    secondary_dark: '#d6d6d6',
    text_primary: '#707274',
    warning: '#ce4427',
    success: '#55ba63',
    running: '#f4d225',
    over: '#faa619',
    selected_primary: '#d5e6f1',
    selected_primary_dark: '#c2dbeb',
    selected_secondary: 'rgba(0, 0, 0, 0.8)',
    black: '#000',
    white: '#fff',
    grey: '#808080',
    background: '#161e2e',
    background_light: '#253447',
    backdrop: 'rgba(0,0,0,0.2)',
};

export const images = {
    topo_dark,
    topo_light,
    logo,
};

// define a global theme for the application
export const theme = {
    // add in all the eventkit specific styles so they are accessible to all JSS styled components
    // or components using withTheme() https://material-ui.com/customization/themes/#withtheme-component-component
    eventkit: {
        colors: { ...colors },
        images: { ...images },
    },
    // adjust the MUI color palette to EK style
    palette: {
        primary: {
            light: colors.primary_light,
            main: colors.primary,
            dark: colors.primary_dark,
        },
        secondary: {
            light: colors.secondary_light,
            main: colors.secondary,
            dark: colors.secondary_dark,
        },
    },
    // override the media query breakpoints
    breakpoints: {
        ...breakpoints,
    },
    // override specific MUI styles for all instances of a component
    overrides: {
        MuiCheckbox: {
            colorPrimary: {
                color: colors.primary,
                '&$checked': { color: colors.primary },
                '&$disabled': { color: colors.grey },
            },
        },
        MuiInput: {
            underline: {
                '&:before': {
                    borderBottomColor: colors.primary,
                },
                '&:hover:not($disabled):not($error):not($focused):before': {
                    borderBottomColor: colors.primary,
                },
                '&:after': {
                    borderBottomColor: colors.primary,
                },
            },
        },
        MuiList: {
            padding: {
                paddingTop: '0px',
                paddingBottom: '0px',
            },
        },
        MuiTableCell: {
            head: {
                fontSize: '12px',
            },
            body: {
                fontSize: '12px',
            },
            footer: {
                fontSize: '12px',
            },
        },
        MuiButton: {
            root: {
                fontSize: '14px',
                minHeight: '30px',
                padding: '0px 16px',
                height: '36px',
                lineHeight: '36px',
                borderRadius: '0px',
            },
            containedSecondary: {
                color: colors.primary,
                '&$disabled': {
                    backgroundColor: colors.secondary_dark,
                    color: colors.grey,
                },
            },
        },
        MuiIconButton: {
            root: {
                padding: '0px',
            },
        },
        MuiMenuItem: {
            root: {
                backgroundColor: 'transparent',
                '&$selected': {
                    backgroundColor: colors.selected_primary,
                },
                color: colors.grey,
            },
            selected: {
                color: colors.primary,
                backgroundColor: colors.selected_primary,
            },
        },
        MuiSvgIcon: {
            colorSecondary: {
                color: colors.white,
            },
        },
        MuiTypography: {
            root: {
                width: '100%',
            },
        },
    },
};

export default theme;
