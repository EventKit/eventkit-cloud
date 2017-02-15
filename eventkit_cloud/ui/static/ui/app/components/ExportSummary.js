import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../components/tap_events'
import styles from '../styles/ExportSummary.css'

class ExportSummary extends React.Component {
    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    componentDidMount() {

    }
    render() {

        return (
            <div>

            </div>


        )
    }
}


ExportSummary.propTypes = {

}
ExportSummary.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default (ExportSummary)

