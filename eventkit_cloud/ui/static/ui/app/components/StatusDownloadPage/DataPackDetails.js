import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import styles from '../../styles/StatusDownload.css'

class DataPackDetails extends React.Component {
    constructor(props) {
        super(props)
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    expandedChange(expanded) {

    }
    componentWillReceiveProps(nextProps) {
    }

    componentDidMount(){

    }
    componentDidUpdate(prevProps, prevState) {

    }
    render() {

        return (
            <div>
                <table><tbody>
                <tr>
                    <td className={styles.tdHeading}>Download Options</td>
                    <td className={styles.tdData}></td>
                </tr>

                </tbody>
                </table>
            </div>

        )
    }
}

DataPackDetails.propTypes = {
    packDetails: PropTypes.object.isRequired,
}
DataPackDetails.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(
DataPackDetails);

