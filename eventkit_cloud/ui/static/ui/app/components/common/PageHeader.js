import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';

export class PageHeader extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            header: {
                backgroundColor: colors.background,
                height: '35px',
                lineHeight: '35px',
                color: colors.white,
                padding: '0px 24px',
                display: 'flex',
                justifyContent: 'space-between',
            },
            title: {
                fontSize: '18px',
                display: 'flex',
                overflow: 'hidden',
                height: '35px',
                flex: '1 0 auto',
                paddingRight: '5px',
            },
            content: {
                display: 'flex',
                overflow: 'hidden',
                height: '35px',
                justifyContent: 'flex-end',
                textAlign: 'right',
            },
        };

        return (
            <div
                className="qa-PageHeader"
                style={styles.header}
            >
                <div style={styles.title} className="qa-PageHeader-title">
                    {this.props.title}
                </div>
                <div style={styles.content} className="qa-PageHeader-content">
                    {this.props.children}
                </div>
            </div>
        );
    }
}

PageHeader.defaultProps = {
    title: '',
    children: null,
};

PageHeader.propTypes = {
    title: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    theme: PropTypes.object.isRequired,
};

export default withTheme()(PageHeader);
