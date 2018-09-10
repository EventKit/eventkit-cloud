import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import ActionViewModule from '@material-ui/icons/ViewModule';
import ActionViewStream from '@material-ui/icons/ViewStream';
import MapsMap from '@material-ui/icons/Map';

export class DataPackViewButtons extends React.Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            button: {
                height: '35px',
                width: '22px',
                padding: '0px',
                float: 'right',
            },
            icon: {
                height: '22px',
                width: '22px',
            },
            selectedIcon: {
                color: colors.background_light,
                backgroundColor: colors.primary,
                height: '22px',
                width: '22px',
            },
        };
        return (
            <div className="qa-DataPackViewButtons-Icons" style={{ paddingRight: '10px', display: 'inline-block', float: 'right' }}>
                <IconButton
                    className="qa-DataPackViewButtons-IconButton-map"
                    onClick={() => this.props.handleViewChange('map')}
                    style={styles.button}
                >
                    <MapsMap
                        className="qa-DataPackViewButtons-MapsMap"
                        color="primary"
                        style={this.props.view === 'map' ? styles.selectedIcon : styles.icon}
                    />
                </IconButton>
                <IconButton
                    className="qa-DataPackViewButtons-IconButton-grid"
                    onClick={() => this.props.handleViewChange('grid')}
                    style={styles.button}
                >
                    <ActionViewModule
                        className="qa-DataPackViewButtons-ActionViewModule"
                        color="primary"
                        style={this.props.view === 'grid' ? styles.selectedIcon : styles.icon}
                    />
                </IconButton>
                <IconButton
                    className="qa-DataPackViewButtons-IconButton-list"
                    onClick={() => this.props.handleViewChange('list')}
                    style={styles.button}
                >
                    <ActionViewStream
                        className="qa-DataPackViewButtons-ActionViewStream"
                        color="primary"
                        style={this.props.view === 'list' ? styles.selectedIcon : styles.icon}
                    />
                </IconButton>
            </div>
        );
    }
}


DataPackViewButtons.propTypes = {
    handleViewChange: PropTypes.func.isRequired,
    view: PropTypes.string.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(DataPackViewButtons);
