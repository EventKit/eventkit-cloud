import * as React from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import Slider from "@material-ui/lab/Slider";
import {Grid} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Table from "@material-ui/core/Table";
import TextField from "@material-ui/core/TextField";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        width: '100%'
    },
    slider: {
        width: 'calc(100%)',
        maxWidth: '500px',
        padding: '0'
    },
    zoomHeader: {
        fontSize: '16px',
    },
    levelLabel: {
        border: 'none',
        padding: '0'
    },
    textField: {
        fontSize: '16px',
        width: '40px'
    },
});

interface Props {
    updateZoom: (min: number, max: number) => void;
    providerZoom: number;
    provider: Eventkit.Provider;
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
        this.props.updateZoom(null, value);
    };

    render() {
        const {classes} = this.props;

        return (
            <div className={classes.container}>
                <span style={{ fontSize: '16px',}}>0 to </span>
                <TextField
                    className={classes.textField}
                    type="number"
                    name="buffer-value"
                    value={this.props.providerZoom}
                    onChange={e => this.handleChange(e, e.target.value)}
                    InputProps={{ style: { fontSize: '14px'} }}
                    // MUI uses the case of the i to distinguish between Input component and input html element
                    // eslint-disable-next-line react/jsx-no-duplicate-props
                    inputProps={{ style: { textAlign: 'center' } }}
                />
                <span style={{ fontSize: '16px',}}>Selected Zoom</span>
                <br/>
                <strong style={{ fontSize: '16px', paddingTop: '15px', paddingBottom: '5px'}}>Zoom</strong>
                <Slider
                    className={classes.slider}
                    style={{paddingTop: '8px'}}
                    value={this.props.providerZoom}
                    aria-labelledby="label"
                    onChange={this.handleChange}
                    max={this.props.provider.level_to}
                    step={1}
                />
                <Table style={{tableLayout: 'fixed'}}>
                    <TableBody>
                        <TableRow className={classes.slider}>
                            <TableCell className={classes.levelLabel}>
                                0
                            </TableCell>
                            <TableCell className={classes.levelLabel}/>
                            <TableCell className={classes.levelLabel}
                                       style={{textAlign: 'center'}}>
                                {this.props.provider.level_to}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }
}

export default withTheme()(withStyles<any, any>(jss)(ZoomLevelSlider));
