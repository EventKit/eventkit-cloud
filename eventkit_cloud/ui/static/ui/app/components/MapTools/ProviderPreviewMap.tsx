import React from 'react';
import ZoomUpdater from "../CreateDataPack/ZoomUpdater";
import OlRasterTileLayer from "./OpenLayers/OlRasterTileLayer";
import OlFeatureLayer from "./OpenLayers/OlFeatureLayer";
import ZoomToAoi from "./OpenLayers/ZoomToAoi";
import OlMouseWheelZoom from "./OpenLayers/MouseWheelZoom";
import {MapLayer} from "../CreateDataPack/CreateExport";
import MapComponent from "./OpenLayers/MapComponent";
import {useAppContext} from "../ApplicationContext";

interface Props {
    provider: Eventkit.Provider;
    zoomLevel?: number;
    geojson?: any;
    visible?: boolean;
}

ProviderPreviewMap.defaultProps = {
    geojson: {},
    visible: true,
} as Props;

function ProviderPreviewMap(props: React.PropsWithChildren<Props>) {
    const { provider, zoomLevel, geojson } = props;
    const appContext = useAppContext();

    const selectedBasemap = {
        mapUrl: (provider.preview_url || appContext.BASEMAP_URL),
        slug: (!!provider.preview_url) ? provider.slug : undefined,
    } as MapLayer;

    return (
        <MapComponent
            style={{ height: '50%', width: '100%' }}
            divId={provider.id + "-map"}
            zoomLevel={zoomLevel}
            minZoom={provider.level_from}
            maxZoom={provider.level_to}
            visible={props.visible}
        >
            {Object.keys(props.geojson).length !== 0 && (
                <OlFeatureLayer geojson={geojson} zIndex={99}>
                    <ZoomToAoi zoomLevel={zoomLevel}/>
                </OlFeatureLayer>
            )}
            <OlRasterTileLayer mapLayer={selectedBasemap} copyright={provider.service_copyright} zIndex={0}/>
            {props.children}
        </MapComponent>
    );
}

export default ProviderPreviewMap;
