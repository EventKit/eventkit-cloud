import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import CheckCircle from '@mui/icons-material/CheckCircle';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    drawerSection: {
        width: '100%',
        paddingLeft: '10px',
        paddingRight: '10px',
        marginBottom: '10px',
    },
    title: {
        width: '100%',
        margin: '0px',
        lineHeight: '36px'
    },
    radioGrp: {
        width: '100%',
        flexWrap: 'nowrap' as 'nowrap'
    },
    label: {
        margin: '0px 0px 5px 0px'
    },
    labelDisplay: {
        display: 'flex',
        flex: '1 1 auto',
        lineHeight: '24px'
    },
    labelText: {
        flex: '1 1 auto',
        fontSize: '14px',
        color: theme.eventkit.colors.text_primary
    },
    radio: {
        width: 24,
        height: 24,
        marginRight: '5px'
    }
});

export interface Props {
    classes: { [className: string]: string };
}

export function SourcePermissionFilter(props: Props) {
    const {classes} = props;
    const checkIcon = (<CheckCircle color="primary"/>);

    return (
        <>
            <div className={classes.drawerSection}>
                <p
                    className={classes.title}
                >
                    <strong>Source Permission</strong>
                </p>
                <RadioGroup
                    className={classes.radioGrp}
                    name="permissions"
                    // onChange={this.handleSelection}
                    // value={permissions.value}
                >
                    <FormControlLabel
                        className={classes.label}
                        value="All Sources"
                        label={
                            <div className={classes.labelDisplay}>
                                <div className={classes.labelText}>
                                    All Sources
                                </div>
                            </div>
                        }
                        control={<Radio className={classes.radio} checkedIcon={checkIcon}/>}
                    />
                    <FormControlLabel
                        className={classes.label}
                        value="Some Sources"
                        label={
                            <div className={classes.labelDisplay}>
                                <div className={classes.labelText}>
                                    Some Sources
                                </div>
                            </div>
                        }
                        control={<Radio className={classes.radio} checkedIcon={checkIcon}/>}
                    />
                    <FormControlLabel
                        className={classes.label}
                        value="No Sources"
                        label={
                            <div className={classes.labelDisplay}>
                                <div className={classes.labelText}>
                                    No Sources
                                </div>
                            </div>
                        }
                        control={<Radio className={classes.radio} checkedIcon={checkIcon}/>}
                    />
                </RadioGroup>
            </div>
        </>
    );
}

export default withStyles(jss)(SourcePermissionFilter);
