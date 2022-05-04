import { Component } from 'react';
import { Theme, Breakpoint } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

export interface Props {
    handleToggle: () => void;
    active: boolean;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}
export class DataPackFilterButton extends Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            button: {
                float: 'right' as 'right',
                height: '30px',
                lineHeight: '15px',
                minWidth: 'none',
                width: useMediaQuery(this.props.theme.breakpoints.up('sm')) ? '90px' : '40px',
                color: colors.primary,
                fontSize: useMediaQuery(this.props.theme.breakpoints.up('sm')) ? '12px' : '10px',
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

export default withWidth()(withTheme(DataPackFilterButton));
