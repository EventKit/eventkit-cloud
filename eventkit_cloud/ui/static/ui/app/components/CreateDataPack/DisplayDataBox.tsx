import * as React from "react";
import {createStyles, Grid, Theme, withStyles} from "@material-ui/core";
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    cardDetails: {
        minWidth: 275,
        color: theme.eventkit.colors.white,
        paddingTop: "0px",
    },
    cardDetailsBody: {

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
        cardDetails: string;
        cardDetailsBody: string;
    };
}

export class DisplayDataBox extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const { lat, long, layerId, layerName, displayFieldName, value, closeCard, handleClose, classes } = this.props;

        return (
            <div className={classes.cardDetails} >
                { !closeCard ?
                    <Card>
                        <CardContent className={classes.cardDetailsBody}>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                {"South Dakota"}
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Lat, Long: {1337} {7331}
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Image Date: 10/24/2019
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Source: {"Layer Name"}
                            </Typography>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                Type: {"Display Field Name"}
                            </Typography>
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
