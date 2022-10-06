import { useEffect, useState } from 'react';
import { useOlMapContainer } from '../context/OpenLayersContext';
import { ReceivesVectorLayer } from './OlFeatureLayer';

interface Props extends ReceivesVectorLayer {
    zoomLevel?: number; // If specified, zoom to this level after fitting extent.
}

function ZoomToAoi(props: Props) {
    const { vectorLayer, zoomLevel } = props;

    const olMapContext = useOlMapContainer();
    const { mapContainer } = olMapContext;

    const [ hasRunOnce, setHasRunOnce ] = useState(false);

    useEffect(() => {
        if (hasRunOnce) {
            return;
        }
        const olMap = mapContainer.getMap();
        olMap.getView().fit(vectorLayer.getSource().getExtent(), { size: olMap.getSize() });
        if (!!zoomLevel || zoomLevel === 0) {
            olMap.getView().setZoom(zoomLevel);
            setHasRunOnce(true);
        }
    }, [zoomLevel]);

    return null;
}

export default ZoomToAoi;
