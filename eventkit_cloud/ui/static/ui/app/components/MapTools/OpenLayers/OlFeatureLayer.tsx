import React from 'react';
import {useEffectOnMount} from "../../../utils/hooks";
import {useOlMapContainer} from "../context/OpenLayersContext";

interface Props {
    geojson: any;
    zIndex?: number;
    epsgCode?: number;
}

function OlFeatureLayer(props: Props) {
    const olMapContext = useOlMapContainer();
    const mapContainer = olMapContext.mapContainer;

    const { geojson, zIndex, epsgCode } = props;

    useEffectOnMount(() => {
        mapContainer.addFeatureLayer(geojson, zIndex, epsgCode);
    });

    return null;
}

export default OlFeatureLayer;