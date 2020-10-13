import React from 'react';
import OlRasterTileLayer from "./OpenLayers/OlRasterTileLayer";
import OlFeatureLayer from "./OpenLayers/OlFeatureLayer";
import ZoomToAoi from "./OpenLayers/ZoomToAoi";
import {MapLayer} from "../CreateDataPack/CreateExport";
import OlMapComponent from "./OpenLayers/OlMapComponent";
import {useAppContext} from "../ApplicationContext";
import {MapComponentProps} from "./OpenLayers/OlMapComponent";
import {useEffectOnMount} from "../../utils/hooks/hooks";
import {useOlMapContainer, useOlZoom} from "./context/OpenLayersContext";
import {MapJustification} from "./MapJustification";

interface Props extends MapComponentProps {
    provider: Eventkit.Provider;
    displayFootprints?: boolean
    geojson?: any;
}

ProviderPreviewMap.defaultProps = {
    geojson: {},
    displayFootprints: false,
} as Props;

function ProviderPreviewMap(props: React.PropsWithChildren<Props>) {
    const {provider, zoomLevel, geojson} = props;
    const appContext = useAppContext();

    const selectedBasemap = {
        mapUrl: (provider.preview_url || appContext.BASEMAP_URL),
        slug: (!!provider.preview_url) ? provider.slug : undefined,
    } as MapLayer;

    const footprintMapLayer = (!!provider.footprint_url && props.displayFootprints) ? {
        mapUrl: provider.footprint_url,
        slug: `${provider.slug}-footprints`,
    } as MapLayer : undefined;

    return (
        <OlMapComponent
            {...props}
            divId={provider.id + "-map"}
            minZoom={provider.level_from}
            maxZoom={provider.level_to}
        >
            {Object.keys(props.geojson).length !== 0 && (
                <OlFeatureLayer geojson={geojson} zIndex={99}>
                    <ZoomToAoi zoomLevel={zoomLevel}/>
                </OlFeatureLayer>
            )}
            {!!footprintMapLayer &&
            <OlRasterTileLayer mapLayer={footprintMapLayer} copyright={provider.service_copyright} zIndex={1}/>
            }
            <OlRasterTileLayer mapLayer={selectedBasemap} copyright={provider.service_copyright} zIndex={0}/>
            {props.children}
            <JustificationWrap>
                <MapJustification providers={[provider]} extent={props.geojson}/>
            </JustificationWrap>
        </OlMapComponent>
    );
}

function JustificationWrap(props: React.PropsWithChildren<any>) {
    const zoomContext = useOlZoom();

    if (zoomContext.zoomLevel > 14) {
        return props.children;
    }
    return null;
}

export default ProviderPreviewMap;
