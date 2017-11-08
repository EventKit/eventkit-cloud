import React, {Component} from 'react';
import {TextField} from 'material-ui';
import clone from 'lodash/clone';
import uniqueId from 'lodash/uniqueId';
import * as ReactDOM from 'react-dom';

export class CustomTextField extends Component {
    constructor(props) {
        super(props);

        this.textFieldProps = clone(this.props);
        delete this.textFieldProps.showRemaining;
        delete this.textFieldProps.onChange;

        this.state = {
            charsRemaining: this.props.maxLength,
            focused: false,
        }

        this.styles = {
            charsRemaining: {
                position: 'absolute',
                bottom: '4px',
                right: '16px',
                transform: 'translateY(-50%)',
                fontWeight: 'bold'
            }
        }
    }

    onChange = (e) => {
        if (this.props.onChange) {
            this.props.onChange(e);
        }

        this.setState({charsRemaining: this.props.maxLength - e.target.value.length});
    }

    onFocus = (e) => {
        if (this.props.onFocus) {
            this.props.onFocus(e);
        }

        this.setState({focused: true});
    }

    onBlur = (e) => {
        if (this.props.onBlur) {
            this.props.onBlur(e);
        }

        this.setState({focused: false});
    }

    render() {
        const charsRemainingColor = (this.state.charsRemaining > 10) ? '#B4B7B8' : '#CE4427';

        return (
            <div style={{position: 'relative'}}>
                <TextField
                    className={'qa-CustomTextField-TextField'}
                    id={uniqueId()}
                    ref={(textField) => {
                        if (!textField) {
                            return;
                        }

                        if (this.props.maxLength && this.props.showRemaining) {
                            ReactDOM.findDOMNode(textField).style.paddingRight = '55px';
                        }
                    }}
                    onChange={this.onChange}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    {...this.textFieldProps}
                />
                {(this.props.maxLength && this.props.showRemaining && this.state.focused) ?
                <div
                    className={'qa-CustomTextField-div-charsRemaining'}
                    style={{...this.styles.charsRemaining, color: charsRemainingColor}}>
                    {this.state.charsRemaining}
                </div>
                : null}
            </div>
        )
    }
}

CustomTextField.propTypes = {
    showRemaining: React.PropTypes.bool,
};

CustomTextField.defaultProps = {
    showRemaining: true
}

export default CustomTextField