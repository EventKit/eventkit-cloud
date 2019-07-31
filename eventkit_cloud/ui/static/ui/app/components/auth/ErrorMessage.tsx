import * as React from 'react';
import {withTheme, Theme, createStyles, withStyles} from '@material-ui/core/styles';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import {Button} from "@material-ui/core";
import * as PropTypes from "prop-types";

export interface Props {
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    router: any;
}

export class ErrorMessage extends React.Component<Props, {}> {

    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    onClick(event) {
        event.preventDefault();
        // Redirect to the logout page (logout container).
        // This is done as an attempt to reset the user to a blank slate.
        window.location.assign('/logout');
    }

    render() {
        const { colors } = this.props.theme.eventkit;

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
                marginTop: '30px'
            },
        };

        let errorMessage;
        if(this.context.config.CONTACT_URL) {
            errorMessage = (
                <a className={`qa-Error-contact`}
                href={this.context.config.CONTACT_URL}>contact us.</a>)
        }
        else {
            errorMessage = "contact and administrator.";
        }

        return (
            <div style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{
                        ...styles.message,
                        fontSize: '20px',
                        marginTop: '0px',
                        marginBottom: '90px'
                    }}>
                        <strong>SERVER ERROR</strong>
                        <p style={styles.message}>
                        An error occurred during the authentication process. Please try again or {errorMessage}
                        </p>
                    </div>
                    <Button
                        onClick={this.onClick}
                        name="submit"
                        color="primary"
                        variant="contained"
                    >
                        Return to Login
                    </Button>
            </div>
        );
    }
}

export default withTheme()(ErrorMessage);
