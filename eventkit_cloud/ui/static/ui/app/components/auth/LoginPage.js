import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../CustomScrollbar';

export class LoginPage extends React.Component {
    render() {
        const { colors, images } = this.props.theme.eventkit;

        const mobile = window.innerWidth < 768;
        const styles = {
            wholeDiv: {
                width: '100%',
                height: window.innerHeight - 95,
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
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
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
                textAlign: 'center',
            },
            footerText: {
                color: colors.grey,
                padding: '5px 10px 5px',
                opacity: 0.5,
                fontSize: '9px',
                textAlign: 'right',
            },
            desktopFooter: {
                position: 'absolute',
                bottom: '0px',
                right: '0px',
            },
            mobileFooter: {
                flex: '1 1 100%',
                alignSelf: 'flex-end',
            },
        };

        const version = this.context.config && this.context.config.VERSION ? this.context.config.VERSION : '';

        return (
            <div style={styles.wholeDiv}>
                <CustomScrollbar style={{ height: window.innerHeight - 95 }}>
                    <div style={styles.container} className="qa-LoginPage-container">
                        <div style={styles.paperContainer}>
                            <Paper className="qa-LoginPage-Paper" style={styles.paper}>
                                <LoginForm {...this.props} />
                            </Paper>
                        </div>

                        {this.context.config.LOGIN_DISCLAIMER ?
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
                                                { __html: this.context.config.LOGIN_DISCLAIMER }
                                            }
                                        />
                                    </CustomScrollbar>
                                </Paper>
                            </div>
                            : null
                        }
                        <div style={mobile && this.context.config.LOGIN_DISCLAIMER ? styles.mobileFooter : styles.desktopFooter}>
                            { version ?
                                <div
                                    style={styles.footerText}
                                    className="qa-LoginPage-version"
                                >
                                    EventKit Version {version}
                                </div>
                                :
                                null
                            }
                            <div style={styles.footerText} className="qa-LoginPage-browser-text">
                                Supported Browsers: Chrome, Firefox, Opera, and Edge
                            </div>
                        </div>
                    </div>
                </CustomScrollbar>
            </div>
        );
    }
}

LoginPage.propTypes = {
    theme: PropTypes.object.isRequired,
};

LoginPage.contextTypes = {
    config: PropTypes.object,
};

export default withTheme()(LoginPage);
