import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import {Button} from "@material-ui/core";

export interface Props {
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    router: any;
}

export class ErrorMessage extends React.Component<Props, {}> {

    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    onClick(event) {
        event.preventDefault();
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
            heading: {
                width: '100%',
                fontSize: '18px',
                color: colors.white,
                marginTop: '80px'
            },
        };

        return (
            <div style={{ verticalAlign: 'middle', textAlign: 'center', marginTop: '30px' }}>

                    {/*<div style={styles.heading}>Server Error</div>*/}
                    <div style={styles.heading}>
                        An authentication error was caught. Please try again or contact an administrator.
                    </div>
                    <Button
                        style={{ margin: '30px auto', width: '150px' }}
                        onClick={this.onClick}
                        name="submit"
                        color="primary"
                        variant="contained"
                    >
                        Logout
                    </Button>
            </div>
        );
    }
}

export default withTheme()(ErrorMessage);
