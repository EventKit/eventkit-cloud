import { useEffect, useRef } from 'react';
import * as React from 'react';
import VectorLayer from 'ol/layer/Vector';
import { useOlMapContainer } from '../context/OpenLayersContext';
import VectorSource from "ol/source/Vector";
import Geometry from "ol/geom/Geometry";

interface Props {
    geojson: any;
    zIndex?: number;
    epsgCode?: number;
}

function OlFeatureLayer(props: React.PropsWithChildren<Props>) {
    const olMapContext = useOlMapContainer();
    const { mapContainer } = olMapContext;

    const { geojson, zIndex, epsgCode } = props;
    const layerRef = useRef(null);

    useEffect(() => {
        layerRef.current = mapContainer.addFeatureLayer(geojson, zIndex, epsgCode);
        return () => mapContainer.removeLayer(layerRef.current);
    }, [geojson, zIndex, epsgCode]);

    // Mechanism by which to pass a reference to the added ol VectorLayer down to any children.
    const childrenWithProps = React.Children.map(
        props.children, (child : any) => React.cloneElement(child, { vectorLayer: layerRef.current }),
    );

    return (
        <>{!!layerRef.current
            && childrenWithProps}
        </>
    );
}

export interface ReceivesVectorLayer {
    vectorLayer?: VectorLayer<VectorSource<Geometry>>;
}

export default OlFeatureLayer;
