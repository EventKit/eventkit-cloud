import PropTypes from 'prop-types';
import React from 'react';
import ActionViewModule from '@material-ui/icons/ViewModule';
import ActionViewStream from '@material-ui/icons/ViewStream';
import MapsMap from '@material-ui/icons/Map';
import IconButton from 'material-ui/IconButton';

export class DataPackViewButtons extends React.Component {
    render() {
        const styles = {
            button: {
                height: '35px',
                width: '22px',
                padding: '0px',
                float: 'right',
            },
            icon: {
                color: '#4498c0',
                height: '22px',
                width: '22px',
            },
            selectedIcon: {
                color: '#253447',
                height: '22px',
                width: '22px',
                backgroundColor: '#4498c0',
            },
        };
        return (
            <div className="qa-DataPackViewButtons-Icons" style={{ paddingRight: '10px', display: 'inline-block', float: 'right' }}>
                <IconButton
                    className="qa-DataPackViewButtons-IconButton-map"
                    onClick={() => this.props.handleViewChange('map')}
                    style={styles.button}
                    iconStyle={this.props.view === 'map' ? styles.selectedIcon : styles.icon}
                >
                    <MapsMap className="qa-DataPackViewButtons-MapsMap" />
                </IconButton>
                <IconButton
                    className="qa-DataPackViewButtons-IconButton-grid"
                    onClick={() => this.props.handleViewChange('grid')}
                    style={styles.button}
                    iconStyle={this.props.view === 'grid' ? styles.selectedIcon : styles.icon}
                >
                    <ActionViewModule className="qa-DataPackViewButtons-ActionViewModule" />
                </IconButton>
                <IconButton
                    className="qa-DataPackViewButtons-IconButton-list"
                    onClick={() => this.props.handleViewChange('list')}
                    style={styles.button}
                    iconStyle={this.props.view === 'list' ? styles.selectedIcon : styles.icon}
                >
                    <ActionViewStream className="qa-DataPackViewButtons-ActionViewStream" />
                </IconButton>
            </div>
        );
    }
}


DataPackViewButtons.propTypes = {
    handleViewChange: PropTypes.func.isRequired,
    view: PropTypes.string.isRequired,
};

export default DataPackViewButtons;
