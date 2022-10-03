import * as React from "react";
import { withTheme, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import Paper from '@material-ui/core/Paper';
import ErrorMessage from "./ErrorMessage";

interface Props {
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    router: any;
}

export const LoginErrorPage = (props: Props) => {
    const { colors, images } = props.theme.eventkit;
    const mobile = isWidthDown('sm', props.width);
    const styles = {
        wholeDiv: {
            width: '100%',
            height: 'calc(100vh - 95px)',
            backgroundColor: colors.background,
        },
        paper: {
            display: 'inline-block',
            backgroundImage: `url(${images.topo_light})`,
            backgroundRepeat: 'repeat repeat',
            padding: '30px',
            height: '390px',
            width: '100%',
        },
        container: {
            position: 'relative' as 'relative',
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap' as 'wrap',
            minHeight: '100%',
        },
        paperContainer: {
            flex: '1 1 50%',
            maxWidth: '600px',
            padding: '15px',
            alignSelf: 'center',
        },
        footerText: {
            color: colors.grey,
            padding: '5px 10px 5px',
            opacity: 0.5,
            fontSize: '9px',
            textAlign: 'right' as 'right',
        },
        desktopFooter: {
            position: 'absolute' as 'absolute',
            bottom: '0px',
            right: '0px',
        },
        mobileFooter: {
            flex: '1 1 100%',
            alignSelf: 'flex-end',
        },
    };

    return (
        <div style={styles.wholeDiv}>
            <div style={styles.container} className="qa-LoginPage-container">
                <div style={styles.paperContainer}>
                    <Paper className="qa-LoginErrorPage-Paper" style={styles.paper}>
                        <ErrorMessage {...props}/>
                    </Paper>
                </div>
                <div style={mobile ? styles.mobileFooter : styles.desktopFooter}>
                    <div style={styles.footerText} className="qa-LoginErrorPage-browser-text">
                        Supported Browsers: Chrome, Firefox, Opera, and Edge
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withWidth()(withTheme(LoginErrorPage));
