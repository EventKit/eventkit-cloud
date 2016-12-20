import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {ClassificationBanner} from './ClassificationBanner'
import {TitleBar} from './TitleBar'
import {Navigation} from './Navigation'
import styles from './Application.css'
import injectTapEventPlugin from 'react-tap-event-plugin'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

injectTapEventPlugin();

class Application extends Component {

    render() {
        return (
            <MuiThemeProvider>
                <div className={styles.root}>
                    <ClassificationBanner />
                    <TitleBar />
                    <Navigation />
                    {this.props.children}
                </div>
            </MuiThemeProvider>
        )
    }
}
Application.propTypes = {
    children: PropTypes.object.isRequired,
    bbox:     React.PropTypes.arrayOf(React.PropTypes.number),
};

export default Application
