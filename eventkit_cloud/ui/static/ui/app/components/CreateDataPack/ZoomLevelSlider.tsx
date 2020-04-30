import * as React from 'react';
import {
    createStyles, Theme, withStyles, withTheme,
} from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import TextField from '@material-ui/core/TextField';
import {useEffect, useState} from "react";


const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        width: '100%',
    },
    slider: {
        position: 'absolute',
        width: '100%',
        padding: '10px 0px',
        borderRight: '1px solid #ccc',
        borderLeft: '1px solid #ccc',
        height: '22px',
    },
    levelLabel: {
        border: 'none',
        padding: '0',
        width: '100%',
    },
    textField: {
        fontSize: '16px',
        width: '40px',
    },
    zoomHeader: {
        display: 'inline-flex',
        fontSize: '16px',
        paddingTop: '10px',
        paddingBottom: '5px',
    },
});

interface Props {
    updateZoom: (min: number, max: number) => void;
    selectedMaxZoom: number;
    selectedMinZoom: number;
    maxZoom: number;
    minZoom: number;
    handleCheckClick: () => void;
    checked: boolean;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export function ZoomLevelSlider(props: Props) {
    const [minZoom, setMinZoom] = useState(props.selectedMinZoom);
    const [maxZoom, setMaxZoom] = useState(props.selectedMaxZoom);

    useEffect(() => {
        setMinZoom(props.selectedMinZoom);
    }, [props.selectedMinZoom]);

    useEffect(() => {
        setMaxZoom(props.selectedMaxZoom);
    }, [props.selectedMaxZoom]);


    const updateMax = (event, value) => {
        const zoomValue = Number(value);
        if (zoomValue >= props.minZoom && zoomValue <= props.maxZoom) {
            if (zoomValue < props.selectedMinZoom) {
                props.updateZoom(zoomValue, props.minZoom);
            } else {
                props.updateZoom(null, zoomValue);
            }
        } else {
            // Send null for min and max zoom to force the prop to reupdate with the last valid value
            props.updateZoom(null, null);
        }
    };

    const updateMin = (event, value) => {
        const zoomValue = Number(value);
        if (zoomValue >= props.minZoom && zoomValue <= props.maxZoom) {
            if (zoomValue > props.selectedMaxZoom) {
                props.updateZoom(props.selectedMaxZoom, zoomValue);
            } else {
                props.updateZoom(zoomValue, null);
            }
        } else {
            // Send null for min and max zoom to force the prop to reupdate with the last valid value
            props.updateZoom(null, null);
        }
    };

    const { classes } = props;

    return (
        <div className={classes.container}>
            <>
                <span>
                    <TextField
                        className={classes.textField}
                        type="number"
                        name="zoom-value"
                        value={minZoom}
                        disabled
                        onChange={e => updateMin(e, e.target.value)}
                        // MUI uses the case of the i to distinguish between Input component and input html element
                        InputProps={{ style: { bottom: '5px' } }}
                        // eslint-disable-next-line react/jsx-no-duplicate-props
                        inputProps={{ style: { textAlign: 'center', fontWeight: 'bold', fontSize: '16px' } }}
                    />
                    <span style={{ fontSize: '16px' }}> to </span>
                    <TextField
                        className={classes.textField}
                        type="number"
                        name="zoom-value"
                        value={maxZoom}
                        onChange={e => updateMax(e, e.target.value)}
                        // MUI uses the case of the i to distinguish between Input component and input html element
                        InputProps={{ style: { bottom: '5px' } }}
                        // eslint-disable-next-line react/jsx-no-duplicate-props
                        inputProps={{ style: { textAlign: 'center', fontWeight: 'bold', fontSize: '16px' } }}
                    />
                    <span style={{ fontSize: '16px' }}>Selected Zoom</span>
                </span>
                <br/>
            </>
            <strong className={classes.zoomHeader}>Zoom</strong>
            <div style={{ display: 'block' }}>
                <div style={{ display: 'flex', position: 'relative', margin: '0 30px' }}>
                    <Slider
                        className={classes.slider}
                        value={maxZoom}
                        aria-labelledby="label"
                        onChange={(e, v) => setMaxZoom(Number(v))}
                        onDragEnd={() => updateMax(null, maxZoom)}
                        min={props.minZoom}
                        max={props.maxZoom}
                        step={1}
                    />
                </div>
                <div id="labels" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textAlign: 'left' }}>
                        {props.minZoom}
                    </span>
                    <span style={{ textAlign: 'right' }}>
                        {props.maxZoom}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default withTheme()(withStyles<any, any>(jss)(ZoomLevelSlider));