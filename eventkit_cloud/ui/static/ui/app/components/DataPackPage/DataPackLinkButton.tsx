import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { Button } from '@material-ui/core';

export interface Props {
    theme: Eventkit.Theme & Theme;
}

export class DataPackLinkButton extends React.Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            button: {
                margin: '0px',
                minWidth: '50px',
                height: '35px',
                borderRadius: '0px',
                width: '150px',
                fontSize: '12px',
                paddingLeft: '0px',
                paddingRight: '0px',
                lineHeight: '35px',
                color: colors.white,
            },
        };

        return (
            <Link
                to="/create"
                href="/create"
            >
                <Button
                    className={`qa-Drawer-Link-create`}
                    // activeClassName={classes.activeLink}
                    style={styles.button}
                    variant="contained"
                    color="primary"
                >
                    {/*<ContentAddBox className={classes.icon} />*/}
                    Create DataPack
                </Button>
            </Link>
        );
    }
}

export default withTheme()(DataPackLinkButton);
