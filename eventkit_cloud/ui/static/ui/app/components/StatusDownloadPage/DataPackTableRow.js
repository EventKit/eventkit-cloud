import React, { Component, PropTypes } from 'react';

export class DataPackTableRow extends Component {
    render() {
        const styles = {
            container: {
                display: 'flex',
                width: '100%',
                padding: '5px',
                ...this.props.containerStyle,
            },
            title: {
                display: 'flex',
                alignItems: 'center',
                flex: '0 0 auto',
                width: '140px',
                backgroundColor: '#f8f8f8',
                padding: '10px',
                marginRight: '5px',
                ...this.props.titleStyle,
            },
            data: {
                display: 'flex',
                alignItems: 'center',
                flex: '1 1 auto',
                backgroundColor: '#f8f8f8',
                color: '#8b9396',
                padding: '10px',
                ...this.props.dataStyle,
            },
        };

        return (
            <div
                className="qa-DataPackTableRow"
                style={styles.container}
            >
                <div
                    style={styles.title}
                >
                    <strong>{this.props.title}</strong>
                </div>
                <div
                    style={styles.data}
                >
                    {this.props.data}
                </div>
            </div>
        );
    }
}

DataPackTableRow.defaultProps = {
    containerStyle: {},
    titleStyle: {},
    dataStyle: {},
};

DataPackTableRow.propTypes = {
    title: PropTypes.string.isRequired,
    data: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    containerStyle: PropTypes.object,
    titleStyle: PropTypes.object,
    dataStyle: PropTypes.object,
};

export default DataPackTableRow;
