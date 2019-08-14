import * as React from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import Slider from "@material-ui/lab/Slider";
import TextField from '@material-ui/core/TextField';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        width: '100%'
    },
    slider: {
        width: '100%',
        bottom: 0,
        padding: '10px 0px',
    },
    levelLabel: {
        border: 'none',
        padding: '0',
        width: '100%'
    },
    textField: {
        fontSize: '16px',
        width: '40px'
    },
    tableData: {
        width: '50%',
    },
    zoomHeader: {
        display: 'inline-flex',
        fontSize: '16px',
        paddingTop: '10px',
        paddingBottom: '5px',
    }
});

interface Props {
    updateZoom: (min: number, max: number) => void;
    maxZoom: number;
    minZoom: number;
    zoom: number;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export class ZoomLevelSlider extends React.Component<Props, {}> {

    static defaultProps;

    constructor(props: Props) {
        super(props);
        this.state = {

        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange = (event, value) => {
        value = Number(value);
        if(value >= this.props.minZoom && value <= this.props.maxZoom) {
            this.props.updateZoom(null, value);
        }
        else {
            // Send null for min and max zoom to force the prop to reupdate with the last valid value
            this.props.updateZoom(null, null);
        }
    };

    render() {
        const { classes, zoom } = this.props;

        return (
            <div className={classes.container}>
                <span style={{ fontSize: '16px',}}>0 to </span>
                <TextField
                    className={classes.textField}
                    type="text"
                    name="zoom-value"
                    value={zoom}
                    onChange={e => this.handleChange(e, e.target.value)}
                    InputProps={{ style: { bottom: '5px' } }}
                    // MUI uses the case of the i to distinguish between Input component and input html element
                    // eslint-disable-next-line react/jsx-no-duplicate-props
                    inputProps={{ style: { textAlign: 'center', fontWeight: 'bold', fontSize: '16px'} }}
                />
                <span style={{ fontSize: '16px',}}>Selected Zoom</span>
                <br/>
                <strong className={classes.zoomHeader}>Zoom</strong>
                <div style={{ textAlign: 'center' }}>
                    <table style={{ width: '100%', position: 'relative' }}>
                        <tbody>
                        <tr style={{ borderLeft: '1px solid #ccc', width: '100%' }}>
                            <td style={{width: '100%', borderRight: '1px solid #ccc'}}>
                                <Slider
                                    className={classes.slider}
                                    value={zoom}
                                    aria-labelledby="label"
                                    onChange={this.handleChange}
                                    max={this.props.maxZoom}
                                    step={1}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className={classes.tableData}>
                                <span style={{ float: 'left' }}>{this.props.minZoom}</span>
                            </td>
                            <td className={classes.tableData}>
                                <span style={{ float: 'right'}}>{this.props.maxZoom}</span>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default withTheme()(withStyles<any, any>(jss)(ZoomLevelSlider));
