import React, { PropTypes } from 'react';
import Paper from 'material-ui/Paper';
import BrowserWarning from './BrowserWarning';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../CustomScrollbar';
import { isBrowserValid } from '../../utils/generic';

const backgroundImage = require('../../../images/topoBackground.jpg');

export class LoginPage extends React.Component {
    render() {
        const isValid = isBrowserValid();
        const mobile = window.innerWidth < 768;
        const styles = {
            wholeDiv: {
                width: '100%',
                height: window.innerHeight - 95,
                backgroundColor: '#111823',
            },
            paper: {
                display: 'inline-block',
                backgroundImage: `url(${backgroundImage})`,
                backgroundRepeat: 'repeat repeat',
                padding: '30px',
                height: '390px',
                width: '100%',
            },
            container: {
                margin: mobile && this.context.config.LOGIN_DISCLAIMER ? '0px auto' : `${(window.innerHeight - 95 - 420) / 2}px auto`,
                maxWidth: 1200,
            },
            paperContainer: {
                width: '50%',
                margin: '0px auto',
                maxWidth: '600px',
                verticalAlign: 'middle',
                display: mobile || !this.context.config.LOGIN_DISCLAIMER ? 'block' : 'inline-block',
                padding: '15px',
                minWidth: '360px',
            },
            disclaimerHeading: {
                color: '#fff',
                fontSize: '16px',
                marginBottom: '5px',
                textAlign: 'center',
            },
            browserText: {
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                display: 'inline-block',
                color: 'grey',
                padding: '5px',
                opacity: 0.5,
                fontSize: '9px',
            },
        };

        if (!isValid) {
            return (
                <BrowserWarning />
            );
        }

        return (
            <div style={styles.wholeDiv}>
                <CustomScrollbar style={{ height: window.innerHeight - 95 }}>
                    <div style={styles.container} className="qa-LoginPage-container">
                        <div style={styles.paperContainer}>
                            <Paper className="qa-LoginPage-Paper" style={styles.paper} zDepth={2}>
                                <LoginForm {...this.props} />
                            </Paper>
                        </div>

                        {this.context.config.LOGIN_DISCLAIMER ?
                            <div style={styles.paperContainer}>
                                <Paper style={{ ...styles.paper, backgroundColor: '#1D2B3C', backgroundImage: '' }} zDepth={2}>
                                    <CustomScrollbar style={{ height: 330 }}>
                                        <div style={styles.disclaimerHeading}>
                                            <strong>ATTENTION</strong>
                                        </div>
                                        <div
                                            style={{ color: '#fff', paddingRight: '10px' }}
                                            dangerouslySetInnerHTML={
                                                { __html: this.context.config.LOGIN_DISCLAIMER }
                                            }
                                        />
                                    </CustomScrollbar>
                                </Paper>
                            </div>
                            : null}
                    </div>
                </CustomScrollbar>
                <div style={styles.browserText} className="qa-LoginPage-browser-text">
                    Supported Browsers: Chrome, Firefox, Opera, Edge, and IE versions 10 or newer
                </div>
            </div>
        );
    }
}

LoginPage.contextTypes = {
    config: PropTypes.object,
};

export default LoginPage;
