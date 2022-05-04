import { Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import IconButton from '@mui/material/IconButton';
import ActionViewModule from '@mui/icons-material/ViewModule';
import ActionViewStream from '@mui/icons-material/ViewStream';
import MapsMap from '@mui/icons-material/Map';

export interface Props {
    handleViewChange: (view: string) => void;
    view: string;
    theme: Eventkit.Theme & Theme;
}

export class DataPackViewButtons extends Component<Props, {}> {
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
                    size="large">
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
                    size="large">
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
                    size="large">
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

export default withTheme(DataPackViewButtons);
