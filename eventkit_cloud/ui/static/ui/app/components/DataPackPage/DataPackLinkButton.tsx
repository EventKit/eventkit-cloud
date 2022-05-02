import { Component } from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import {Link} from 'react-router-dom';
import {Button} from '@material-ui/core';
import {MatomoClickTracker} from "../MatomoHandler";

export interface Props {
    theme: Eventkit.Theme & Theme;
}

export class DataPackLinkButton extends Component<Props, {}> {
    render() {
        const {colors} = this.props.theme.eventkit;

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
                className="datapack-link-create"
                style={
                    {
                        display: 'grid',
                        textDecoration: 'none',
                    }
                }
                to="/create"
            >
                <MatomoClickTracker
                    eventAction="Click Link"
                    eventName="Click Create DataPack button"
                    eventCategory="DataPack Library"
                >
                    <Button
                        className="qa-DataPackLinkButton-Button datapack-button-create"
                        style={styles.button}
                        variant="contained"
                        color="primary"
                    >
                        {/* <ContentAddBox className={classes.icon} /> */}
                        Create DataPack
                    </Button>
                </MatomoClickTracker>
            </Link>
        );
    }
}

export default withTheme(DataPackLinkButton);
