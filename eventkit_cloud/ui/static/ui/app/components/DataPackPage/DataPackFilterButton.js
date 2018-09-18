import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Button from '@material-ui/core/Button';

export class DataPackFilterButton extends React.Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            button: {
                float: 'right',
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


DataPackFilterButton.propTypes = {
    handleToggle: PropTypes.func.isRequired,
    active: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};


export default
@withWidth()
@withTheme()
class Default extends DataPackFilterButton {}
