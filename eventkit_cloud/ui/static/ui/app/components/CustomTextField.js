import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

export class CustomTextField extends Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.getTextLength = this.getTextLength.bind(this);
        this.state = {
            charsRemaining: this.props.maxLength - this.getTextLength(),
            focused: false,
        };

        this.styles = {
            charsRemaining: {
                position: 'absolute',
                bottom: '0px',
                right: '16px',
                transform: 'translateY(-50%)',
                fontWeight: 'bold',
                ...this.props.charsRemainingStyle,
            },
        };
    }

    onChange(e) {
        if (this.props.onChange) {
            this.props.onChange(e);
        }

        this.setState({ charsRemaining: this.props.maxLength - e.target.value.length });
    }

    onFocus(e) {
        if (this.props.onFocus) {
            this.props.onFocus(e);
        }

        this.setState({ focused: true });
    }

    onBlur(e) {
        if (this.props.onBlur) {
            this.props.onBlur(e);
        }

        this.setState({ focused: false });
    }

    getTextLength() {
        // If we list value or defaultValue as a prop we need to include a default value for them.
        // Setting the default values as undefined somehow messes up the MUI component ¯\_(ツ)_/¯
        // For that reason we just wont list it, so turning of the eslint warning in this case only.
        //
        // eslint-disable-next-line react/prop-types
        const { value } = this.props;
        // eslint-disable-next-line react/prop-types
        const { defaultValue } = this.props;

        if (value) {
            // eslint-disable-next-line react/prop-types
            return value.length;
        } if (defaultValue) {
            // eslint-disable-next-line react/prop-types
            return defaultValue.length;
        }
        return 0;
    }

    render() {
        const {
            charsRemainingStyle,
            showRemaining,
            onChange,
            onFocus,
            onBlur,
            inputProps,
            InputProps,
            maxLength,
            theme,
            ...rest
        } = this.props;

        const inputStyle = {
            paddingRight: maxLength && showRemaining ? '55px' : 'unset',
            ...InputProps.style,
        };

        const charsRemainingColor = (this.state.charsRemaining > 10) ? theme.eventkit.colors.text_primary : theme.eventkit.colors.warning;

        return (
            <div style={{ position: 'relative' }}>
                <TextField
                    className="qa-CustomTextField-TextField"
                    id="custom-text-field"
                    onChange={this.onChange}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    inputProps={{ maxLength, ...inputProps }}
                    // eslint-disable-next-line react/jsx-no-duplicate-props
                    InputProps={{ ...InputProps, style: inputStyle }}
                    type="text"
                    {...rest}
                />
                {(maxLength && showRemaining && this.state.focused)
                    ? (
                        <div
                            className="qa-CustomTextField-div-charsRemaining"
                            style={{ ...this.styles.charsRemaining, color: charsRemainingColor }}
                        >
                            {this.state.charsRemaining}
                        </div>
                    )
                    : null
                }
            </div>
        );
    }
}

CustomTextField.propTypes = {
    showRemaining: PropTypes.bool,
    maxLength: PropTypes.number,
    charsRemainingStyle: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    inputProps: PropTypes.object,
    InputProps: PropTypes.object,
    theme: PropTypes.object.isRequired,
};

CustomTextField.defaultProps = {
    showRemaining: true,
    maxLength: 100,
    charsRemainingStyle: {},
    onChange: undefined,
    onFocus: undefined,
    onBlur: undefined,
    inputProps: {},
    InputProps: {},
};

export default
@withTheme()
class Default extends CustomTextField {}
