import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {useOlMapContainer} from "../context/OpenLayersContext";
import Overlay from 'ol/overlay';
import {useEffectOnMount} from "../../../utils/hooks";
import {TileCoordinate} from "../../../utils/mapUtils";
import {
    createStyles,
    Theme, withStyles,
} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import IconButton from "@material-ui/core/IconButton";

interface Props {
    coordinate?: TileCoordinate;
    closePoi?: (...args: any) => void;
    classes: { [className: string]: string };
}

function OlPoiOverlay(props: React.PropsWithChildren<Props>) {
    const olMapContext = useOlMapContainer();
    const mapContainer = olMapContext.mapContainer;

    const divRef = useRef(null);
    const closerRef = useRef(null);
    const overlayRef = useRef(null);

    const { coordinate, classes } = props;

    useEffectOnMount(() => {
        return () => {
            if (overlayRef.current) {
                const olMap = mapContainer.getMap();
                olMap.removeOverlay(overlayRef.current);
            }
            overlayRef.current = null;
        }
    });

    let lat, long;
    if (coordinate) {
        lat = coordinate.lat;
        long = coordinate.long;
    }
    useEffect(() => {
        if (overlayRef.current === null) {
            if (divRef.current !== null) {
                overlayRef.current = new Overlay({
                    element: divRef.current,
                });
                overlayRef.current.setPosition(undefined);
                mapContainer.getMap().addOverlay(overlayRef.current);
            }
        }
        if (coordinate) {
            if (divRef.current !== null) {
                const overlay = overlayRef.current;
                overlay.setOffset([0, 0]);
                overlay.setPositioning('bottom-right'); // restore default
                overlay.setPosition([long, lat]);
                const delta = getOffset(overlay);
                if (delta[1] > 0) {
                    overlay.setPositioning('bottom-center');
                }
                overlay.setOffset(delta);
            }
        }
    }, [lat, long]);

    function getOffset(overlay) {
        const olMap = mapContainer.getMap();
        const divBoundingRect = overlay.getElement().getBoundingClientRect();
        const mapBoundingRect = olMap.getTargetElement().getBoundingClientRect();

        const margin = 5;
        const offsetLeft = divBoundingRect.left - mapBoundingRect.left;
        const offsetRight = mapBoundingRect.right - divBoundingRect.right;
        const offsetTop = divBoundingRect.top - mapBoundingRect.top;
        const offsetBottom = mapBoundingRect.bottom - divBoundingRect.bottom;

        const delta = [0, 0];
        if (offsetLeft < 0) {
            delta[0] = margin - offsetLeft;
        } else if (offsetRight < 0) {
            delta[0] = -(Math.abs(offsetRight) + margin);
        }
        if (offsetTop < 0) {
            delta[1] = margin - offsetTop;
        } else if (offsetBottom < 0) {
            delta[1] = -(Math.abs(offsetBottom) + margin);
        }
        return delta;
    }

    function convertToClick(e) {
        // This is needed to prevent openlayers from hiding all clicks on buttons in the overlay.
        // Converts mouse up events to click events on the target.
        const evt = new MouseEvent('click', { bubbles: true })
        evt.stopPropagation = () => {
        };
        e.target.dispatchEvent(evt)
    }

    return (
        <div ref={el => divRef.current = el} onMouseUp={convertToClick} className={classes.container}>
            {props.children}
            <div>
            <IconButton
                className={classes.closeButton}
                buttonRef={closerRef}
                type='button'
                onClick={(e) => {
                    props.closePoi ? props.closePoi(e) : () => {};
                    overlayRef.current.setPosition(undefined);
                }}
            >
                <CloseIcon className={classes.closeIcon}/>
            </IconButton>
            </div>
        </div>
    );
}

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        display: 'flex',
        background: theme.eventkit.colors.secondary_dark,
    },
    closeButton: {
        zIndex: 10,
        marginTop: '5px',
        float: 'right',
    },
    closeIcon: {
        fontSize: 'medium',
    },
});

export default withStyles<any, any>(jss)(OlPoiOverlay);
