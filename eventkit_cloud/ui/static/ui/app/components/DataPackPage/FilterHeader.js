import PropTypes from 'prop-types';
import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';

export class DataPackDrawer extends Component {
    render() {
        const styles = {
            drawerHeader: {
                width: '100%',
                paddingTop: '10px',
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingBottom: '5px',
                lineHeight: '36px',
            },
        };
        return (
            <div className="qa-FilterHeader-div" style={styles.drawerHeader}>
                <RaisedButton
                    className="qa-FilterHeader-RaisedButton-apply"
                    style={{ minWidth: 'none', borderRadius: '0px' }}
                    buttonStyle={{ borderRadius: '0px' }}
                    backgroundColor="#4598bf"
                    label="Apply"
                    labelStyle={{ color: '#fff', textTransform: 'none' }}
                    onClick={this.props.onApply}
                />
                <FlatButton
                    className="qa-FilterHeader-FlatButton-clear"
                    style={{ float: 'right', minWidth: 'none' }}
                    hoverColor="none"
                    label="Clear All"
                    labelStyle={{ color: '#4598bf', textTransform: 'none', paddingRight: '0px' }}
                    onClick={this.props.onClear}
                    disableTouchRipple
                />
            </div>
        );
    }
}

DataPackDrawer.propTypes = {
    onApply: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
};

export default DataPackDrawer;
