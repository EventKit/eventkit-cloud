import React, {useState} from "react";
import {createStyles, TextField, Theme, withStyles} from "@material-ui/core";
import {BaseTextFieldProps, OutlinedTextFieldProps} from "@material-ui/core/TextField";


interface Props extends OutlinedTextFieldProps {
    className?: string;
    value?: string;
    defaultValue?: string;
    showRemaining: boolean,
    maxLength: number;
    charsRemainingStyle: any;
    inputProps: any;
    InputProps: any;
    classes: { [className: string]: string };
}

CustomTextField.defaultProps = {
    className: '',
    defaultValue: '',
    showRemaining: true,
    maxLength: 100,
    charsRemainingStyle: {},
    onChange: undefined,
    onFocus: undefined,
    onBlur: undefined,
    inputProps: {},
    InputProps: {},
} as Props;

export function CustomTextField(props: Props) {
    const {
        charsRemainingStyle,
        showRemaining,
        inputProps,
        InputProps,
        maxLength,
        classes,
        ...passThroughProps
    } = props;

    const [charsRemaining, setCharsRemaining] = useState(props.maxLength - getTextLength());
    const [focused, setFocused] = useState(undefined);

    function onChange(e) {
        if (props.onChange) {
            props.onChange(e);
        }
        setCharsRemaining(props.maxLength - e.target.value.length);
    }

    function onFocus(e) {
        if (props.onFocus) {
            props.onFocus(e);
        }
        setFocused(true);
    }

    function onBlur(e) {
        if (props.onBlur) {
            props.onBlur(e);
        }
        setFocused(false);
    }

    function getTextLength() {
        // If we list value or defaultValue as a prop we need to include a default value for them.
        // Setting the default values as undefined somehow messes up the MUI component ¯\_(ツ)_/¯
        // For that reason we just wont list it, so turning of the eslint warning in this case only.
        //
        // eslint-disable-next-line react/prop-types
        const { value } = props;
        // eslint-disable-next-line react/prop-types
        const { defaultValue } = props;

        if (value) {
            // eslint-disable-next-line react/prop-types
            return value.length;
        }
        if (defaultValue) {
            // eslint-disable-next-line react/prop-types
            return defaultValue.length;
        }
        return 0;
    }

    const inputStyle = {
        paddingRight: maxLength && showRemaining ? '55px' : 'unset',
        ...InputProps.style,
    };

    const customStyle = { ...charsRemainingStyle } as any;
    // Remaining chars color is controlled by this component. We don't want it overriding the styles.
    // Look into allowing specification of OK and WARNING color.
    delete customStyle.color;

    return (
        <div style={{ position: 'relative' }} className={props.className}>
            <TextField
                className="qa-CustomTextField-TextField"
                id="custom-text-field"
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                inputProps={{ maxLength, ...inputProps }}
                // eslint-disable-next-line react/jsx-no-duplicate-props
                InputProps={{ ...InputProps, style: inputStyle }}
                type="text"
                {...passThroughProps as OutlinedTextFieldProps}
            />
            {(maxLength && showRemaining && focused)
                ? (
                    <div
                        className={`qa-CustomTextField ${classes.charsRemainingText} ${(charsRemaining <= 10) ? classes.limitWarning : ''}`}
                        style={{ ...props.charsRemainingStyle }}
                    >
                        {charsRemaining}
                    </div>
                )
                : null
            }
        </div>
    );
}

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    charsRemainingText: {
        position: 'absolute',
        bottom: '0px',
        right: '16px',
        transform: 'translateY(-50%)',
        fontWeight: 'bold',
        color: theme.eventkit.colors.text_primary,
    },
    limitWarning: {
        color: theme.eventkit.colors.warning,
    }
});

export default withStyles(jss)(CustomTextField);
