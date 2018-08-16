import PropTypes from 'prop-types';
import React from 'react';
import FlatButton from 'material-ui/FlatButton';

export class DataPackFilterButton extends React.Component {
    render() {
        const styles = {
            button: {
                float: 'right',
                height: '30px',
                lineHeight: '15px',
                minWidth: 'none',
                width: window.innerWidth > 575 ? '90px' : '40px',
            },
            label: {
                color: '#4498c0',
                textTransform: 'none',
                padding: '0px',
                fontSize: window.innerWidth > 575 ? '12px' : '10px',
            },
            icon: {
                fill: '#4498c0',
                marginLeft: '0px',
            },
        };

        return (
            <FlatButton
                className="qa-DataPackFilterButton-FlatButton"
                style={styles.button}
                label={this.props.active ? 'HIDE FILTERS' : 'SHOW FILTERS'}
                labelPosition="after"
                labelStyle={styles.label}
                hoverColor="#253447"
                disableTouchRipple
                onClick={this.props.handleToggle}
            />
        );
    }
}


DataPackFilterButton.propTypes = {
    handleToggle: PropTypes.func.isRequired,
    active: PropTypes.bool.isRequired,
};


export default DataPackFilterButton;
