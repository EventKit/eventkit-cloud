import * as React from "react";
import {createStyles, Theme, withStyles} from "@material-ui/core";
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    card: {
        minWidth: 275,
        // change this
        color: theme.eventkit.colors.primary,
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
});

// error handling?

export interface Props {
    lat: number;
    long: number;
    layerId: number;
    layerName: string;
    displayFieldName: string;
    value: string;
    closeCard: boolean;
    handleClose: (event: any) => void;
    classes: {
        card: string;
        title: string;
        pos: string;
    };
}

export class DisplayDataBox extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const { lat, long, layerId, layerName, displayFieldName, value, closeCard, handleClose, classes } = this.props;

        return (
            <div style={{ backgroundColor: "white" }}>
                { !closeCard ?
                    <Card className={classes.card}>
                        <CardContent>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                {value}
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Date: 10/24/2019
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Lat, Long: {lat} {long}
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Source: {layerName}
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Type: {displayFieldName}
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                className="closeButton"
                                size="small"
                                type='button'
                                onClick={(e) => {
                                    handleClose(e);
                                }}
                            >
                                x
                            </Button>
                        </CardActions>
                    </Card>
                    :
                    null
                }
            </div>
        );
    }
}
export default withStyles<any, any>(jss)(DisplayDataBox);
