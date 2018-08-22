import PropTypes from 'prop-types';
import React from 'react';
import Button from '@material-ui/core/Button';

export class DataPackFilterButton extends React.Component {
    render() {
        const styles = {
            button: {
                float: 'right',
                height: '30px',
                lineHeight: '15px',
                minWidth: 'none',
                width: window.innerWidth > 575 ? '90px' : '40px',
                color: '#4498c0',
                fontSize: window.innerWidth > 575 ? '12px' : '10px',
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
};


export default DataPackFilterButton;
