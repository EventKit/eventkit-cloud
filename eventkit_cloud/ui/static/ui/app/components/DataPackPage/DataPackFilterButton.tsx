import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Button from '@material-ui/core/Button';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

export interface Props {
    handleToggle: () => void;
    active: boolean;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}
export class DataPackFilterButton extends React.Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            button: {
                float: 'right' as 'right',
                height: '30px',
                lineHeight: '15px',
                minWidth: 'none',
                width: isWidthUp('sm', this.props.width) ? '90px' : '40px',
                color: colors.primary,
                fontSize: isWidthUp('sm', this.props.width) ? '12px' : '10px',
                padding: '0px',
            },
        };

        return (
            <Button
                className="qa-DataPackFilterButton-FlatButton"
                style={styles.button}
                onClick={this.props.handleToggle}
            >
                {this.props.active ? 'HIDE FILTERS' : 'SHOW FILTERS'}
            </Button>
        );
    }
}

export default withWidth()(withTheme()(DataPackFilterButton));
