import React, { useEffect } from 'react';
import { useOlMapContainer } from '../context/OpenLayersContext';
import { ReceivesVectorLayer } from './OlFeatureLayer';

interface Props extends ReceivesVectorLayer {
    zoomLevel?: number; // If specified, zoom to this level after fitting extent.
}

function ZoomToAoi(props: Props) {
    const { vectorLayer, zoomLevel } = props;

    const olMapContext = useOlMapContainer();
    const { mapContainer } = olMapContext;

    useEffect(() => {
        const olMap = mapContainer.getMap();
        olMap.getView().fit(vectorLayer.getSource().getExtent(), olMap.getSize());
        if (!!zoomLevel || zoomLevel === 0) {
            olMap.getView().setZoom(zoomLevel);
        }
    }, [zoomLevel]);

    return null;
}

export default ZoomToAoi;
