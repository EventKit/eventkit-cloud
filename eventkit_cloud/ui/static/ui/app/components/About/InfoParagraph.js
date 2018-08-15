import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class InfoParagraph extends Component {
    render() {
        const styles = {
            title: {
                textAlign: 'center',
                ...this.props.titleStyle,
            },
            body: {
                marginBottom: '30px',
                ...this.props.bodyStyle,
            },
        };

        if (!this.props.title || !this.props.body) {
            return null;
        }

        return (
            <div className="qa-InfoParagraph-title">
                <h3 style={styles.title}><strong>{this.props.title}</strong></h3>
                <div id={this.props.title} style={styles.body} className="qa-InfoParagraph-body">
                    {this.props.body}
                </div>
            </div>
        );
    }
}

InfoParagraph.defaultProps = {
    titleStyle: {},
    bodyStyle: {},
};

InfoParagraph.propTypes = {
    title: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    body: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    titleStyle: PropTypes.object,
    bodyStyle: PropTypes.object,
};

export default InfoParagraph;
