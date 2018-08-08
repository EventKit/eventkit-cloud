import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class PageHeader extends Component {
    render() {
        const styles = {
            header: {
                backgroundColor: '#161e2e',
                height: '35px',
                lineHeight: '35px',
                color: 'white',
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
};

export default PageHeader;
