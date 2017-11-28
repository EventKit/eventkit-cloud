import React, { Component, PropTypes } from 'react';

export class BufferButton extends Component {
    render() {
        const styles = {
            button: {
                zIndex: 1,
                position: 'absolute',
                top: 300,
                right: 10,
                height: '30px',
                width: '50px',
                borderTop: '1px solid #e6e6e6',
                borderRight: 'none',
                borderLeft: 'none',
                borderBottom: 'none',
                margin: 0,
                padding: 0,
                backgroundColor: '#fff',
                outline: 'none',
                fontSize: '.7em',
                color: '#4498c0',
            },
        };

        if (!this.props.show) {
            return null;
        }

        return (
            <button
                style={styles.button}
                onClick={this.props.onClick}
                className="qa-BufferButton-button"
            >
                BUFFER
            </button>
        );
    }
}

BufferButton.propTypes = {
    show: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default BufferButton;
