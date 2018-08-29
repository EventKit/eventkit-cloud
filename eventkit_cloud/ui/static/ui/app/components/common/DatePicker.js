import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

export class DatePicker extends Component {
    render() {
        const { classes } = this.props;
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
                    classes: { ...classes },
                    style: { fontSize: '14px', padding: '0px 5px' },
                    ...this.props.InputProps,
                }}
                // eslint-disable-next-line react/jsx-no-duplicate-props
                inputProps={{
                    min: this.props.min,
                    max: this.props.max,
                }}
                style={{ fontSize: '14px' }}
            />
        );
    }
}

const jss = {
    underline: {
        '&:before': {
            borderBottomColor: '#5a5a5a',
        },
        '&:after': {
            borderBottomColor: '#4598bf',
        },
        '&:hover:before': {
            borderBottomColor: '#5a5a5a !important',
        },
    },
};

DatePicker.defaultProps = {
    label: undefined,
    disabled: false,
    defaultValue: undefined,
    fullWidth: false,
    helperText: undefined,
    placeholder: undefined,
    value: undefined,
    InputProps: {},
    min: undefined,
    max: undefined,
    classes: {},
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
    min: PropTypes.string,
    max: PropTypes.string,
    classes: PropTypes.object,
};

export default withStyles(jss)(DatePicker);
