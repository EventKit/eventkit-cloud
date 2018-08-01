import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DatePicker from 'material-ui/DatePicker';

export class DateFilter extends Component {
    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
                lineHeight: '36px',
            },
            textField: {
                fontSize: '14px',
                height: '36px',
                width: '100%',
            },
        };

        return (
            <div
                className="qa-DateFilter-div"
                style={styles.drawerSection}
            >
                <p
                    className="qa-DateFilter-p"
                    style={{ width: '100%', margin: '0px' }}
                >
                    <strong>Date Added</strong>
                </p>
                <DatePicker
                    className="qa-DateFilter-DatePicker-from"
                    autoOk
                    hintText="From"
                    textFieldStyle={styles.textField}
                    onChange={this.props.onMinChange}
                    value={this.props.minDate}
                />
                <DatePicker
                    className="qa-DateFilter-DatePicker-to"
                    autoOk
                    hintText="To"
                    textFieldStyle={styles.textField}
                    onChange={this.props.onMaxChange}
                    value={this.props.maxDate}
                />
            </div>
        );
    }
}

DateFilter.defaultProps = {
    minDate: null,
    maxDate: null,
};

DateFilter.propTypes = {
    onMinChange: PropTypes.func.isRequired,
    onMaxChange: PropTypes.func.isRequired,
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
};

export default DateFilter;
