import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';

export class DataPackDrawer extends Component {
    render() {
        const styles = {
            drawerHeader: {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingBottom: '5px',
            },
        };
        return (
            <div className="qa-FilterHeader-div" style={styles.drawerHeader}>
                <Button
                    className="qa-FilterHeader-Button-apply"
                    style={{ minWidth: 'none', borderRadius: '0px', textTransform: 'none' }}
                    color="primary"
                    variant="contained"
                    onClick={this.props.onApply}
                >
                    Apply
                </Button>
                <Button
                    className="qa-FilterHeader-Button-clear"
                    style={{ minWidth: 'none', textTransform: 'none' }}
                    color="primary"
                    variant="flat"
                    onClick={this.props.onClear}
                >
                    Clear All
                </Button>
            </div>
        );
    }
}

DataPackDrawer.propTypes = {
    onApply: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
};

export default DataPackDrawer;
