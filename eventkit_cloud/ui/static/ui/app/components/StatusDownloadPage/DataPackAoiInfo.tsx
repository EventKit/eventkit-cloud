import * as PropTypes from 'prop-types';
import * as React from 'react';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import Attribution from 'ol/control/attribution';
import ScaleLine from 'ol/control/scaleline';
import Zoom from 'ol/control/zoom';
import CustomTableRow from '../CustomTableRow';
import { getSqKmString } from '../../utils/generic';
import ol3mapCss from '../../styles/ol3map.css';

export interface Props {
    extent: object;
}

export class DataPackAoiInfo extends React.Component<Props, {}> {
    static contextTypes = {
        config: PropTypes.object,
    };

    private map;
    constructor(props: Props) {
        super(props);
        this.initializeOpenLayers = this.initializeOpenLayers.bind(this);
    }

    componentDidMount() {
        this.initializeOpenLayers();
    }

    private initializeOpenLayers() {
        const base = new Tile({
            source: new XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: true,
                attributions: this.context.config.BASEMAP_COPYRIGHT,
            }),
        });

        this.map = new Map({
            interactions: interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: false,
            }),
            layers: [base],
            target: 'summaryMap',
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            }),
            controls: [
                new ScaleLine({
                    className: ol3mapCss.olScaleLine,
                }),
                new Attribution({
                    className: ['ol-attribution', ol3mapCss['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new Zoom({
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' '),
                }),
            ],
        });
        const source = new VectorSource({ wrapX: true });
        const geojson = new GeoJSON();
        const features = geojson.readFeatures(this.props.extent, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeatures(features);
        const layer = new VectorLayer({
            source,
        });

        this.map.addLayer(layer);
        this.map.getView().fit(source.getExtent(), this.map.getSize());
    }

    render() {
        return (
            <div>
                <CustomTableRow
                    className="qa-DataPackAoiInfo-area"
                    title="Area"
                    data={getSqKmString(this.props.extent)}
                    dataStyle={{ wordBreak: 'break-all' }}
                />
                <div className="qa-DataPackAoiInfo-div-map" id="summaryMap" style={{ maxHeight: '400px', marginTop: '10px' }} />
            </div>
        );
    }
}

export default DataPackAoiInfo;
