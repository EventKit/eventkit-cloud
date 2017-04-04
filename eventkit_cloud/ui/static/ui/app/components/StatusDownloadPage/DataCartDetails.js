import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import DataPackDetails from './DataPackDetails'
import styles from '../../styles/StatusDownload.css'

class DataCartDetails extends React.Component {
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
            <div>
                <table><tbody>
                <tr>
                    <td className={styles.tdHeading}>Name</td>
                    <td className={styles.tdData}>{this.props.cartDetails.job.name}</td>
                </tr>
                <tr>
                    <td className={styles.tdHeading}>Status</td>
                    <td className={styles.tdData}>{this.props.cartDetails.status}</td>
                </tr>
                </tbody>
                </table>
            </div>

            <div>
            <table><tbody>
                <tr>
                <td className={styles.tdHeading}>Name</td>
                <td className={styles.tdData}>sdf</td>
                </tr>
                <tr>
                <td className={styles.tdHeading}>Status</td>
                <td className={styles.tdData}>hjk</td>
                </tr>
            </tbody>
            </table>
            </div>

        </div>

        )
    }
}

DataCartDetails.propTypes = {
    cartDetails: PropTypes.object.isRequired,
}
DataCartDetails.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(

)(DataCartDetails);

