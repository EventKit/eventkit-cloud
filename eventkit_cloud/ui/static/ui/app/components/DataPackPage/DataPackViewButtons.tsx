import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import ActionViewModule from '@material-ui/icons/ViewModule';
import ActionViewStream from '@material-ui/icons/ViewStream';
import MapsMap from '@material-ui/icons/Map';

export interface Props {
    handleViewChange: (view: string) => void;
    view: string;
    theme: Eventkit.Theme & Theme;
}

export class DataPackViewButtons extends React.Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            button: {
                height: '35px',
                width: '22px',
                padding: '0px',
                float: 'right' as 'right',
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

export default withTheme()(DataPackViewButtons);
