import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

export class DataPackSearchbar extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            const text = event.target.value || '';
            this.props.onSearchSubmit(text);
        }
    }

    handleChange(event) {
        const text = event.target.value || '';
        this.props.onSearchChange(text);
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const styles = {
            container: {
                height: '36px',
                width: '100%',
                backgroundColor: colors.background,
                lineHeight: '36px',
            },
            input: {
                color: colors.white,
                height: '36px',
                width: '100%',
                lineHeight: '36px',
                padding: '0px 10px',
                fontSize: '16px',
            },
        };

        return (
            <TextField
                className="qa-DataPackSearchBar-TextField"
                style={styles.container}
                inputProps={{ style: styles.input }}
                placeholder="Search DataPacks"
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                defaultValue={this.props.defaultValue}
            />
        );
    }
}

DataPackSearchbar.defaultProps = {
    defaultValue: '',
};

DataPackSearchbar.propTypes = {
    onSearchChange: PropTypes.func.isRequired,
    onSearchSubmit: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(DataPackSearchbar);
