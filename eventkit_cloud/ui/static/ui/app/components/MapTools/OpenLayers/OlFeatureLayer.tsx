import React, {useEffect, useState} from 'react';
import VectorLayer from "ol/layer/vector";
import {useOlMapContainer} from "../context/OpenLayersContext";

interface Props {
    geojson: any;
    zIndex?: number;
    epsgCode?: number;
}

function OlFeatureLayer(props: React.PropsWithChildren<Props>) {
    const olMapContext = useOlMapContainer();
    const mapContainer = olMapContext.mapContainer;

    const { geojson, zIndex, epsgCode } = props;
    const [featureLayer, setLayer ] = useState(null);

    useEffect(() => {
        setLayer(mapContainer.addFeatureLayer(geojson, zIndex, epsgCode));
        return function cleanup() {
            if (!!featureLayer) {
                mapContainer.getMap().removeLayer(featureLayer);
            }
        }
    }, [geojson, zIndex, epsgCode]);

    const childrenWithProps = React.Children.map(props.children, (child : any) =>
        React.cloneElement(child, { vectorLayer: featureLayer})
    );

    return (
        <>{!!featureLayer &&
            childrenWithProps
        }</>
    );
}

export interface ReceivesVectorLayer {
    vectorLayer?: VectorLayer;
}

export default OlFeatureLayer;
