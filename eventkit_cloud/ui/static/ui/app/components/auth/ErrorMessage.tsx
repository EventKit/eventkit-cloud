import * as React from "react";
import {
    withTheme, Theme,
} from '@material-ui/core/styles';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import { Button } from '@material-ui/core';
import { useAppContext } from "../ApplicationContext";

export interface Props {
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    router: any;
}

const ErrorMessage = (props: Props) => {
    const { CONTACT_URL } = useAppContext();
    const { colors } = props.theme.eventkit;

    const styles = {
        form: {
            verticalAlign: 'middle',
            margin: '0 auto',
            maxWidth: 300,
        },
        message: {
            width: '100%',
            fontSize: '18px',
            color: colors.white,
            marginTop: '30px',
        },
    };

    const getErrorMessage = () => {
        let errorMessage;
        if (CONTACT_URL) {
            errorMessage = (
                <a
                    data-testid={'errorLink'}
                    className="qa-Error-contact"
                    href={CONTACT_URL}
                >contact us.
                </a>
            );
        } else {
            errorMessage = 'contact an administrator.';
        }
        return errorMessage;
    }

    const onClick = (event) => {
        event.preventDefault();
        // Redirect to the logout page (logout container).
        // This is done as an attempt to reset the user to a blank slate.
        window.location.assign('/logout');
    }

    return (
        <div style={{ verticalAlign: 'middle', textAlign: 'center' }}>
            <div style={{
                ...styles.message,
                fontSize: '20px',
                marginTop: '0px',
                marginBottom: '90px',
            }}
            >
                <strong>SERVER ERROR</strong>
                <p style={styles.message} data-testid={'errorMessage'}>
                    An error occurred during the authentication process. Please try again or {getErrorMessage()}
                </p>
            </div>
            <Button
                onClick={onClick}
                name="submit"
                color="primary"
                variant="contained"
            >
                Return to Login
            </Button>
        </div>
    );
};

export default withTheme(ErrorMessage);
