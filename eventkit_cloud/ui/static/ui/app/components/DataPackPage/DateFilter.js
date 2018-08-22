import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DatePicker from '../common/DatePicker';

export class DateFilter extends Component {
    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
            },
            label: {
                fontSize: '10px',
                color: '#707274',
                paddingLeft: '5px',
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
                    style={{ width: '100%', margin: '0px', lineHeight: '36px' }}
                >
                    <strong>Date Added</strong>
                </p>
                <span style={styles.label}>From</span>
                <DatePicker
                    className="qa-DateFilter-DatePicker-from"
                    onChange={this.props.onMinChange}
                    value={this.props.minDate}
                    fullWidth
                />
                <span style={styles.label}>To</span>
                <DatePicker
                    className="qa-DateFilter-DatePicker-to"
                    onChange={this.props.onMaxChange}
                    value={this.props.maxDate}
                    fullWidth
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
