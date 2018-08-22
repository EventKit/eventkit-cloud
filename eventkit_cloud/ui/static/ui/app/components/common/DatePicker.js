import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';

export class DatePicker extends Component {
    render() {
        return (
            <TextField
                id="date-picker"
                label={this.props.label}
                type="date"
                disabled={this.props.disabled}
                defaultValue={this.props.defaultValue}
                fullWidth={this.props.fullWidth}
                helperText={this.props.helperText}
                onChange={this.props.onChange}
                placeholder={this.props.placeholder}
                value={this.props.value}
                InputProps={{
                    style: { fontSize: '14px', padding: '0px 5px' },
                    ...this.props.InputProps,
                }}
                style={{ fontSize: '14px' }}
            />
        );
    }
}

DatePicker.defaultProps = {
    label: undefined,
    disabled: false,
    defaultValue: undefined,
    fullWidth: false,
    helperText: undefined,
    placeholder: undefined,
    value: undefined,
    InputProps: {},
};

DatePicker.propTypes = {
    label: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    disabled: PropTypes.bool,
    defaultValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    fullWidth: PropTypes.bool,
    helperText: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.array,
    ]),
    onChange: PropTypes.func.isRequired,
    InputProps: PropTypes.object,
};

export default DatePicker;
