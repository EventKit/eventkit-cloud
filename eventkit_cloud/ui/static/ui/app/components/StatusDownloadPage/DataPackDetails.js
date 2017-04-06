import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import styles from '../../styles/StatusDownload.css'
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle'
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import Paper from 'material-ui/Paper'
import Checkbox from 'material-ui/Checkbox'

class DataPackDetails extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            providerTasks: [],
            file: false,
        }
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    expandedChange(expanded) {

    }
    componentWillReceiveProps(nextProps) {
        if(nextProps.datacartDetails.fetched != this.props.datacartDetails.fetched) {
            if (nextProps.datacartDetails.fetched == true) {
                let providerTasks = nextProps.datacartDetails.data.provider_tasks;
                this.setState({providerTasks: providerTasks});

            }
        }
    }

    componentDidMount(){

    }
    componentDidUpdate(prevProps, prevState) {

    }
    toggleCheckbox(event, checked) {

        this.setState({file: checked})
    }
    render() {

        return (
            <div className={styles.downloadDiv}>
                <div className={styles.subHeading}>
                   Download Options
                </div>
                <table><tbody>
                {this.props.providerTasks.map((provider) => (
                <tr>
                    <td className={styles.tdData} style={{width:'5%'}}>
                    <div className={styles.checkboxLabel}>
                        <Checkbox
                            name="file"
                            onCheck={this.toggleCheckbox.bind(this)}
                            className={styles.checkboxColor}
                            checkedIcon={<ActionCheckCircle />}
                            uncheckedIcon={<UncheckedCircle />}
                        />
                    </div></td>

                    <td className={styles.tdData} style={{width:'35%'}}>{provider.name}</td>
                    <td className={styles.tdData} style={{width:'20%'}}>3/3</td>
                    <td className={styles.tdData} style={{width:'20%'}}>00:00:20</td>
                    <td className={styles.tdData} style={{width:'20%'}}><CloudDownload/></td>
                </tr>
                ))}
                </tbody>
                </table>
            </div>

        )
    }
}

DataPackDetails.propTypes = {
    providerTasks: PropTypes.array.isRequired,
}
DataPackDetails.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(

)(DataPackDetails);

