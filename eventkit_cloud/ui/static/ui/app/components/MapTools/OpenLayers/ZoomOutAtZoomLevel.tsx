import React, { useEffect } from 'react';
import {useOlMapContainer, useOlZoom} from '../context/OpenLayersContext';
import { ReceivesVectorLayer } from './OlFeatureLayer';

interface Props extends ReceivesVectorLayer {
    zoomLevel?: number; // If specified, zoom to this level after fitting extent.
}

function ZoomOutAtZoomLevel(props: Props) {
    const { vectorLayer, zoomLevel } = props;

    const olMapContext = useOlMapContainer();
    const { mapContainer } = olMapContext;
    const zoomContext = useOlZoom();

    useEffect(() => {
        const olMap = mapContainer.getMap();
        // olMap.getView().fit(vectorLayer.getSource().getExtent(), olMap.getSize());
        if ((!!zoomLevel || zoomLevel === 0) && zoomContext.zoomLevel > zoomLevel) {
            olMap.getView().setZoom(2);
        }
    }, [zoomContext.zoomLevel]);

    return null;
}

export default ZoomOutAtZoomLevel;
