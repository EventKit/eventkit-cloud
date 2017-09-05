import React, {PropTypes, Component} from 'react'
import Drawer from 'material-ui/Drawer';
import DatePicker from 'material-ui/DatePicker';

export class DateFilter extends Component {
    constructor(props) {
        super(props);
    }

    render () {
        const styles = {
            drawerSection: {
                width: '100%', 
                paddingLeft: '10px', 
                paddingRight: '10px', 
                lineHeight: '36px'
            },
            textField: {
                fontSize: '14px', 
                height: '36px', 
                width: '180px'
            }
        }
        return (
                <div style={styles.drawerSection}>
                    <p style={{width: '100%', margin: '0px'}}><strong>Date Added</strong></p>
                    <DatePicker
                        autoOk={true}
                        hintText={"From"}
                        textFieldStyle={styles.textField}
                        onChange={this.props.onMinChange}
                        value={this.props.minDate}
                    />
                    <DatePicker
                        autoOk={true}
                        hintText={"To"}
                        textFieldStyle={styles.textField}
                        onChange={this.props.onMaxChange}
                        value={this.props.maxDate}
                    />
                </div>
        )
    }
}

DateFilter.propTypes = {
    onMinChange: React.PropTypes.func.isRequired,
    onMaxChange: React.PropTypes.func.isRequired,
    minDate: React.PropTypes.object,
    maxDate: React.PropTypes.object,
}

export default DateFilter;
