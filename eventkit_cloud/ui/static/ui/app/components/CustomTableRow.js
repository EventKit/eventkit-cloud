import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';

export class CustomTableRow extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            container: {
                display: 'flex',
                flex: '0 1 auto',
                padding: '5px 0px',
                width: '100%',
                ...this.props.containerStyle,
            },
            data: {
                alignItems: 'center',
                backgroundColor: colors.secondary,
                color: colors.text_primary,
                display: 'flex',
                flex: '1 1 auto',
                flexWrap: 'wrap',
                padding: '10px',
                width: '100%',
                wordBreak: 'break-word',
                ...this.props.dataStyle,
            },
            title: {
                backgroundColor: colors.secondary,
                display: 'flex',
                flex: '0 0 auto',
                marginRight: '5px',
                padding: '10px',
                width: '140px',
                ...this.props.titleStyle,
            },
        };

        return (
            <div
                className={this.props.className}
                style={styles.container}
            >
                <div style={styles.title}>
                    <strong>{this.props.title}</strong>
                </div>
                <div style={styles.data}>
                    {this.props.data}
                </div>
            </div>
        );
    }
}

CustomTableRow.defaultProps = {
    className: 'qa-CustomTableRow',
    containerStyle: {},
    dataStyle: {},
    titleStyle: {},
};

CustomTableRow.propTypes = {
    className: PropTypes.string,
    containerStyle: PropTypes.object,
    data: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    dataStyle: PropTypes.object,
    theme: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    titleStyle: PropTypes.object,
};

export default withTheme()(CustomTableRow);
