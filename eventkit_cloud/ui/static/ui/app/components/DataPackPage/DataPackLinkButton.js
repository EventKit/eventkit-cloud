import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

export class DataPackLinkButton extends React.Component {
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
            <Button
                className="qa-DataPackLinkButton-Button"
                color="primary"
                variant="contained"
                href="/create"
                style={styles.button}
            >
                Create DataPack
            </Button>
        );
    }
}

DataPackLinkButton.propTypes = {
    theme: PropTypes.object.isRequired,
};

export default withTheme()(DataPackLinkButton);
