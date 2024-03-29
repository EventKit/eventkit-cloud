import { Component } from 'react';
import {MapLayer} from "../CreateDataPack/CreateExport";
import OlMapComponent from "../MapTools/OpenLayers/OlMapComponent";
import OlFeatureLayer from "../MapTools/OpenLayers/OlFeatureLayer";
import ZoomToAoi from "../MapTools/OpenLayers/ZoomToAoi";
import OlRasterTileLayer from "../MapTools/OpenLayers/OlRasterTileLayer";
import OlMouseWheelZoom from "../MapTools/OpenLayers/MouseWheelZoom";

export interface Props {
    geojson: object;
    selectedBaseMap: MapLayer | string;
    zoom?: number;
    copyright?: string;
    setZoom?: (from: number, to: number) => void;
    minZoom?: number;
    maxZoom?: number;
    id?: string;
    moveable?: boolean;
    style?: any;
}

export class MapView extends Component<Props> {

    private mapDiv: string;
    private minZoom: number;
    private maxZoom: number;
    private style: any;
    selectedBaseMap: MapLayer;

    constructor(props: Props) {
        super(props);
        this.minZoom = this.props.minZoom || 0;
        this.maxZoom = this.props.maxZoom || 20;
        this.mapDiv = this.props.id || "ProviderMap";
        this.style = this.props.style
    }

    render() {
        this.selectedBaseMap = (typeof this.props.selectedBaseMap === 'string' || this.props.selectedBaseMap instanceof String) ?
            {mapUrl: this.props.selectedBaseMap} as MapLayer : this.props.selectedBaseMap;
        const layer = (this.selectedBaseMap) ? <OlRasterTileLayer mapLayer={this.selectedBaseMap} copyright={this.props.copyright}
                                       zIndex={0}/> : <div/>
        return (
            <OlMapComponent
                style={{...this.style, height: '100%', width: '100%'}}
                divId={this.mapDiv}
                minZoom={this.props.minZoom}
                maxZoom={this.props.maxZoom}
                zoomLevel={this.props.zoom}
            >
                {Object.keys(this.props.geojson).length !== 0 && (
                    <OlFeatureLayer geojson={this.props.geojson} zIndex={99}>
                        <ZoomToAoi zoomLevel={this.props.zoom}/>
                    </OlFeatureLayer>
                )}
                <OlMouseWheelZoom enabled={false}/>
                { layer }
            </OlMapComponent>
        );
    }

}
