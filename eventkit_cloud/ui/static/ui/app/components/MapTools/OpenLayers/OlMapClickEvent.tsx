import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import {useOlMapContainer} from "../context/OpenLayersContext";
import {generateDrawLayer, TileCoordinate, wrapX} from "../../../utils/mapUtils";
import {getTopLeft, getTopRight} from "ol/extent";
import {useEffectOnMount} from "../../../utils/hooks/hooks";
import Style from 'ol/style/Style';
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

interface Props {
    onClick?: (coordinate: TileCoordinate) => any;
    mapPinStyle?: any;
    showPin?: boolean;
}

OlMapClickEvent.defaultProps = {
    showPin: true,
} as Props;

function OlMapClickEvent(props: React.PropsWithChildren<Props>) {
    const olMapContext = useOlMapContainer();
    const mapContainer = olMapContext.mapContainer;

    function getTileCoordinate(event) {
        const grid = mapContainer.getTileGrid();
        const olMap = mapContainer.getMap();
        const zoom = Math.floor(olMap.getView().getZoom());

        // Coord is returned as z, x, y
        // Y is returned as a negative because of openlayers origin, needs to be flipped and offset
        const tileCoord = wrapX(grid, grid.getTileCoordForCoordAndZ(event.coordinate, zoom));
        const tileExtent = grid.getTileCoordExtent(tileCoord);
        tileCoord[2] = tileCoord[2] * -1 - 1;

        const upperLeftPixel = olMap.getPixelFromCoordinate(getTopLeft(tileExtent));
        const upperRightPixel = olMap.getPixelFromCoordinate(getTopRight(tileExtent));

        // Calculate the actual number of pixels each tile is taking up.
        const pixelWidth = upperRightPixel[0] - upperLeftPixel[0];
        let tileSize = grid.getTileSize(zoom);
        if (Array.isArray(tileSize)) {
            tileSize = tileSize[0];
        }
        const ratio = tileSize / pixelWidth;

        const tilePixel = [Math.floor((event.pixel[0] - upperLeftPixel[0]) * ratio),
            Math.floor((event.pixel[1] - upperLeftPixel[1]) * ratio)];

        return {
            lat: event.coordinate[1],
            long: event.coordinate[0],
            z: tileCoord[0],
            y: tileCoord[2],
            x: tileCoord[1],
            i: tilePixel[0],
            j: tilePixel[1],
        };
    }

    const { onClick, mapPinStyle } = props;
    const [eventKey, setEventKey] = useState(null);
    const pinLayerRef = useRef(null);
    useEffectOnMount(() => {
        if (!!mapPinStyle) {
            const pinLayer = generateDrawLayer();
            pinLayer.setStyle(new Style({
                ...mapPinStyle
            }));
            mapContainer.addLayer(pinLayer, 100);
            pinLayerRef.current = pinLayer;
        }


        setEventKey(mapContainer.addListener('singleclick', (event) => {
            const pinLayer = pinLayerRef.current;
            if (pinLayer) {
                pinLayer.getSource().clear();
                if (onClick(getTileCoordinate(event))) {
                    pinLayer.getSource().addFeature(new Feature({
                        geometry: new Point(event.coordinate),
                    }));
                }
            } else {
                onClick(getTileCoordinate(event));
            }
        }));
    });

    useEffect(() => {
        if (pinLayerRef.current && !props.showPin) {
            pinLayerRef.current.getSource().clear();
        }
    }, [props.showPin]);

    return null;
}

export default OlMapClickEvent;
