import * as React from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import Help from '@material-ui/icons/Help';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import {Route} from 'react-router';
import MapDrawer from "./MapDrawer";
import EstimateContainer from "./EstimateContainer";

export interface Props {
    children: any;
    history: any;
    routes: Route[];
    theme: Eventkit.Theme & Theme;
    geojson: GeoJSON.FeatureCollection;
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    updateExportInfo: (args: any) => void;
}

export interface MapLayer {
    mapUrl: string;
    metadata?: {
        type: string;
        url: string;
    };
    slug: string;
    copyright?: string;
}

export interface State {
    walkthroughClicked: boolean;
    selectedBaseMap: MapLayer;
    mapLayers: MapLayer[];
}

export class CreateExport extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleWalkthroughReset = this.handleWalkthroughReset.bind(this);
        this.handleWalkthroughClick = this.handleWalkthroughClick.bind(this);
        this.updateBaseMap = this.updateBaseMap.bind(this);
        this.addFootprintsLayer = this.addFootprintsLayer.bind(this);
        this.removeFootprintsLayer = this.removeFootprintsLayer.bind(this);
        this.state = {
            walkthroughClicked: false,
            selectedBaseMap: {mapUrl: ''} as MapLayer,
            mapLayers: [] as MapLayer[],
        };
    }

    private handleWalkthroughReset() {
        this.setState({walkthroughClicked: false});
    }

    private handleWalkthroughClick() {
        this.setState({walkthroughClicked: true});
    }

    private updateBaseMap(mapLayer: MapLayer) {
        this.setState({selectedBaseMap: mapLayer});
    }

    private addFootprintsLayer(mapLayer: MapLayer) {
        const mapLayers = [...this.state.mapLayers];
        const index = mapLayers.map(x => x.slug).indexOf(mapLayer.slug);
        if (index !== -1) {
            return;
        }
        mapLayers.push(mapLayer);
        this.setState({mapLayers});
    }

    private removeFootprintsLayer(mapLayer: MapLayer) {
        const mapLayers = [...this.state.mapLayers];
        const index = mapLayers.map(x => x.slug).indexOf(mapLayer.slug);
        if (index === -1) {
            return;
        }
        mapLayers.splice(index, 1);
        this.setState({mapLayers});
    }

    render() {
        const {colors} = this.props.theme.eventkit;

        const styles = {
            tourButton: {
                color: colors.primary,
                cursor: 'pointer',
                display: 'inline-block',
            },
            tourIcon: {
                cursor: 'pointer',
                height: '18px',
                width: '18px',
                verticalAlign: 'middle',
                marginRight: '5px',
            },
        };

        const iconElementRight = (
            <ButtonBase
                onClick={this.handleWalkthroughClick}
                style={styles.tourButton}
            >
                <Help
                    style={styles.tourIcon}
                />
                Page Tour
            </ButtonBase>
        );

        return (
            <div>
                <PageHeader
                    title="Create DataPack"
                >
                    {iconElementRight}
                </PageHeader>
                <EstimateContainer
                    breadcrumbStepperProps={{
                        history: this.props.history,
                        routes: this.props.routes,
                        walkthroughClicked: this.state.walkthroughClicked,
                        onWalkthroughReset: this.handleWalkthroughReset,
                        selectedBaseMap: this.state.selectedBaseMap,
                        mapLayers: this.state.mapLayers,
                        geojson: this.props.geojson,
                    }}
                />
                <MapDrawer
                    updateBaseMap={this.updateBaseMap}
                    addFootprintsLayer={this.addFootprintsLayer}
                    removeFootprintsLayer={this.removeFootprintsLayer}
                />
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default withTheme()(CreateExport);
