import * as React from 'react';
import {
    createStyles, Theme, withStyles, withTheme,
} from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import TextField from '@material-ui/core/TextField';


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
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

interface State {
    maxZoom: number;
    minZoom: number;
}

export class ZoomLevelSlider extends React.Component<Props, State> {
    static defaultProps;

    constructor(props: Props) {
        super(props);

        this.state = {
            minZoom: props.selectedMinZoom,
            maxZoom: props.selectedMaxZoom,
        };

        this.updateMax = this.updateMax.bind(this);
        this.updateMin = this.updateMin.bind(this);
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        const {minZoom, maxZoom} = this.props;
        const prevMinZoom = prevProps.selectedMinZoom;
        const prevMaxZoom = prevProps.selectedMaxZoom;
        if (minZoom !== prevMinZoom) {
            // Deprecated rule
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({minZoom});
        }
        if (maxZoom !== prevMaxZoom) {
            // Deprecated rule
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({maxZoom});
        }
    }

    updateMax = (event, value) => {
        const zoomValue = Number(value);
        if (zoomValue >= this.props.minZoom && zoomValue <= this.props.maxZoom) {
            if (zoomValue < this.props.selectedMinZoom) {
                this.props.updateZoom(zoomValue, this.props.minZoom);
            } else {
                this.props.updateZoom(null, zoomValue);
            }
        } else {
            // Send null for min and max zoom to force the prop to reupdate with the last valid value
            this.props.updateZoom(null, null);
        }
    };

    updateMin = (event, value) => {
        const zoomValue = Number(value);
        if (zoomValue >= this.props.minZoom && zoomValue <= this.props.maxZoom) {
            if (zoomValue > this.props.selectedMaxZoom) {
                this.props.updateZoom(this.props.selectedMaxZoom, zoomValue);
            } else {
                this.props.updateZoom(zoomValue, null);
            }
        } else {
            // Send null for min and max zoom to force the prop to reupdate with the last valid value
            this.props.updateZoom(null, null);
        }
    };

    render() {
        const {classes} = this.props;
        const {minZoom, maxZoom} = this.state;

        return (
            <div className={classes.container}>
                <TextField
                    className={classes.textField}
                    type="number"
                    name="zoom-value"
                    value={minZoom}
                    disabled
                    onChange={e => this.updateMin(e, e.target.value)}
                    // MUI uses the case of the i to distinguish between Input component and input html element
                    InputProps={{style: {bottom: '5px'}}}
                    // eslint-disable-next-line react/jsx-no-duplicate-props
                    inputProps={{style: {textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}}
                />
                <span style={{fontSize: '16px'}}> to </span>
                <TextField
                    className={classes.textField}
                    type="number"
                    name="zoom-value"
                    value={maxZoom}
                    onChange={e => this.updateMax(e, e.target.value)}
                    // MUI uses the case of the i to distinguish between Input component and input html element
                    InputProps={{style: {bottom: '5px'}}}
                    // eslint-disable-next-line react/jsx-no-duplicate-props
                    inputProps={{style: {textAlign: 'center', fontWeight: 'bold', fontSize: '16px'}}}
                />
                <span style={{fontSize: '16px'}}>Selected Zoom</span>
                <br/>
                <strong className={classes.zoomHeader}>Zoom</strong>
                <div style={{display: 'block'}}>
                    <div style={{display: 'flex', position: 'relative', margin: '0 30px'}}>
                        <Slider
                            className={classes.slider}
                            value={maxZoom}
                            aria-labelledby="label"
                            onChange={(e, v) => this.setState({maxZoom: Number(v)})}
                            onDragEnd={() => this.updateMax(null, maxZoom)}
                            min={this.props.minZoom}
                            max={this.props.maxZoom}
                            step={1}
                        />
                    </div>
                    <div id="labels" style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{textAlign: 'left'}}>
                            {this.props.minZoom}
                        </span>
                        <span style={{textAlign: 'right'}}>
                            {this.props.maxZoom}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}

export default withTheme()(withStyles<any, any>(jss)(ZoomLevelSlider));
