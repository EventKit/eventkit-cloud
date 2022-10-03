import * as React from "react";
import { withTheme, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import Paper from '@material-ui/core/Paper';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../common/CustomScrollbar';
import { useAppContext } from "../ApplicationContext";

interface Props {
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

export const LoginPage = (props: Props) => {
    const { LOGIN_DISCLAIMER } = useAppContext();
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
        disclaimerHeading: {
            color: colors.white,
            fontSize: '16px',
            marginBottom: '5px',
            textAlign: 'center' as 'center',
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
            <CustomScrollbar style={{ height: 'calc(100vh - 95px)' }}>
                <div style={styles.container} className="qa-LoginPage-container">
                    <div style={styles.paperContainer} data-testid={'loginPaper'}>
                        <Paper className="qa-LoginPage-Paper" style={styles.paper}>
                            <LoginForm {...props} />
                        </Paper>
                    </div>

                    {LOGIN_DISCLAIMER ?
                        <div style={styles.paperContainer}>
                            <Paper style={{ ...styles.paper, backgroundColor: '#1D2B3C', backgroundImage: '' }}>
                                <CustomScrollbar style={{ height: 330 }}>
                                    <div style={styles.disclaimerHeading}>
                                        <strong>ATTENTION</strong>
                                    </div>
                                    <div
                                        className="qa-LoginPage-disclaimer"
                                        style={{ color: colors.white, paddingRight: '10px' }}
                                        // eslint-disable-next-line react/no-danger
                                        dangerouslySetInnerHTML={
                                            { __html: LOGIN_DISCLAIMER }
                                        }
                                    />
                                </CustomScrollbar>
                            </Paper>
                        </div>
                        : null
                    }
                    <div style={mobile && LOGIN_DISCLAIMER ? styles.mobileFooter : styles.desktopFooter}>
                        <div style={styles.footerText} className="qa-LoginPage-browser-text">
                            Supported Browsers: Chrome, Firefox, Opera, and Edge
                        </div>
                    </div>
                </div>
            </CustomScrollbar>
        </div>
    );
};

export default withWidth()(withTheme(LoginPage));
