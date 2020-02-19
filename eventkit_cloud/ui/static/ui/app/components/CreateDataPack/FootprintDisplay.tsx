import React from "react";
import {createStyles, withStyles, FormControlLabel, Switch} from "@material-ui/core";
import * as PropTypes from "prop-types";
import Card from "@material-ui/core/Card";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import theme from "../../styles/eventkit_theme";
import {MapLayer} from "./CreateExport";

const jss = () => createStyles({
    footprintBox: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        marginLeft: '33px',
        maxWidth: '550px',
        minWidth: '175px',
        outline: '2px solid #4598bf',
        paddingLeft: '10px',
        paddingTop: '5px',
    },
    noPadding: {
        padding: '0',
    },
    listItemText: {
        paddingLeft: '10px',
    },
    formControlLabel: {
        paddingLeft: '10px',
        fontSize: '12px',
        paddingRight: '3px',
    },
    switchBase: {
        color: theme.eventkit.colors.white,
        '&$checked': {
            color: theme.eventkit.colors.primary,
        },
    },
    checked: {},
});

export interface Props {
    addFootprintsLayer: (mapLayer: MapLayer) => void;
    removeFootprintsLayer: (mapLayer: MapLayer) => void;
    footprintsLayer: MapLayer;
    classes: { [className: string]: string };
}

export interface State {
    checked: boolean;
}

export class FootprintDisplay extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
        this.handleCheckClick = this.handleCheckClick.bind(this);

        this.state = {
            checked: false,
        };
    }

    handleCheckClick = () => {
        if (this.state.checked) {
            this.setState({ checked: false });
            this.props.removeFootprintsLayer(this.props.footprintsLayer);
        } else {
            this.setState({ checked: true });
            this.props.addFootprintsLayer(this.props.footprintsLayer);
        }
    };

    render() {
        const {classes} = this.props;

        return (
            <Card
                className={classes.footprintBox}
            >
                {/* using ListItem for future functionality that will add to this list */}
                <ListItemText
                    className={classes.listItemText}
                    primary={(
                        <Typography style={{fontSize: '12px'}}>
                            <strong>Layers:</strong>
                        </Typography>
                    )}
                />
                <FormControlLabel
                    className={classes.formControlLabel}
                    control={(
                        <Switch
                            value="switch"
                            checked={this.state.checked}
                            onChange={this.handleCheckClick}
                            classes={{ switchBase: classes.switchBase, checked: classes.checked }}
                        />
                    )}
                    label={<Typography className={classes.formControlLabel}>Show footprints</Typography>}
                />
            </Card>
        );
    }
}
export default (withStyles<any, any>(jss)(FootprintDisplay))