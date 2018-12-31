import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

export interface Props {
    value: string;
    defaultValue: string;
    showRemaining: boolean;
    maxLength: number;
    charsRemainingStyle: object;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    inputProps: any;
    InputProps: any;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    charsRemaining: number;
    focused: boolean;
}

export class CustomTextField extends React.Component<Props, State> {
    static defaultProps = {
        showRemaining: true,
        maxLength: 100,
        charsRemainingStyle: {},
        onChange: undefined,
        onFocus: undefined,
        onBlur: undefined,
        inputProps: {},
        InputProps: {},
    };

    private styles;
    constructor(props: Props) {
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

    private onChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.props.onChange) {
            this.props.onChange(e);
        }

        this.setState({ charsRemaining: this.props.maxLength - e.target.value.length });
    }

    private onFocus(e: React.FocusEvent<HTMLInputElement>) {
        if (this.props.onFocus) {
            this.props.onFocus(e);
        }

        this.setState({ focused: true });
    }

    private onBlur(e: React.FocusEvent<HTMLInputElement>) {
        if (this.props.onBlur) {
            this.props.onBlur(e);
        }

        this.setState({ focused: false });
    }

    private getTextLength() {
        // If we list value or defaultValue as a prop we need to include a default value for them.
        // Setting the default values as undefined somehow messes up the MUI component ¯\_(ツ)_/¯
        // For that reason we just wont list it, so turning of the eslint warning in this case only.
        //
        // eslint-disable-next-line react/prop-types
        const { value } = this.props;
        // eslint-disable-next-line react/prop-types
        const { defaultValue } = this.props;

        if (value) {
            return value.length;
        } else if (defaultValue) {
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
                    InputProps={{ ...InputProps, style: inputStyle }}
                    type="text"
                    {...rest}
                />
                {(maxLength && showRemaining && this.state.focused) ?
                    <div
                        className="qa-CustomTextField-div-charsRemaining"
                        style={{ ...this.styles.charsRemaining, color: charsRemainingColor }}
                    >
                        {this.state.charsRemaining}
                    </div>
                    :
                    null
                }
            </div>
        );
    }
}

export default withTheme()(CustomTextField);
