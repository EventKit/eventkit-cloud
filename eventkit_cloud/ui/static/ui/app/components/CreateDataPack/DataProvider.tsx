import * as React from 'react';
import { withTheme, Theme, createStyles, withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import CircularProgress from '@material-ui/core/CircularProgress';
import Checkbox from '@material-ui/core/Checkbox';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ProviderStatusIcon from './ProviderStatusIcon';
import BaseDialog from '../Dialog/BaseDialog';
import {Typography} from "@material-ui/core";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    container: {
        display: 'flex',
        width: '100%',
    },
    listItem: {
        fontWeight: 'normal',
        fontSize: '16px',
        padding: '16px 10px',
    },
    listItemText: {
        fontSize: 'inherit',
    },
    sublistItem: {
        fontWeight: 'normal',
        fontSize: '13px',
        padding: '14px 20px 14px 49px',
        borderTop: theme.eventkit.colors.secondary,
    },
    checkbox: {
        width: '24px',
        height: '24px',
        marginRight: '15px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
        '&$checked': {
            color: theme.eventkit.colors.success,
        },
    },
    checked: {},
    name: {
        marginRight: '10px',
        display: 'flex',
        flex: '1 1 auto',
        flexWrap: 'wrap',
    },
    expand: {
        display: 'flex',
        flex: '0 0 auto',
    },
    license: {
        cursor: 'pointer',
        color: theme.eventkit.colors.primary,
    },
    prewrap: {
        whiteSpace: 'pre-wrap',
    },
});

export interface ProviderData extends Eventkit.Provider {
    availability?: {
        slug: string;
        status: string;
        type: string;
        message: string;
    };
    estimate?: {
        size: number;
        unit: string;
        slug: string;
    };
}

interface Props {
    provider: ProviderData;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    alt: boolean;
    theme: Eventkit.Theme & Theme;
    renderEstimate: boolean;
    classes: {
        container: string;
        listItem: string;
        listItemText: string;
        sublistItem: string;
        checkbox: string;
        checked: string;
        name: string;
        expand: string;
        license: string;
        prewrap: string;
    };
}

interface State {
    open: boolean;
    licenseDialogOpen: boolean;
}

export class DataProvider extends React.Component<Props, State> {

    static defaultProps;

    constructor(props: Props) {
        super(props);
        this.handleLicenseOpen = this.handleLicenseOpen.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.handleExpand = this.handleExpand.bind(this);
        this.state = {
            open: false,
            licenseDialogOpen: false,
        };
    }

    private handleLicenseOpen() {
        this.setState({ licenseDialogOpen: true });
    }

    private handleLicenseClose() {
        this.setState({ licenseDialogOpen: false });
    }

    private handleExpand() {
        this.setState(state => ({ open: !state.open }));
    }

    private formatSize(providerEstimate){
        if (!providerEstimate){
            return (<CircularProgress size={10}/>)
        }
        if (!providerEstimate.size){
            return "unknown"
        }
        let estimateSize = 0.000;
        estimateSize = Number(estimateSize) + Number(providerEstimate.size);
        return Number(estimateSize).toFixed(3) + ' MB';
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { classes, provider } = this.props;

        // Show license if one exists.
        const nestedItems = [];
        if (provider.license) {
            nestedItems.push((
                <ListItem
                    key={nestedItems.length}
                    dense
                    disableGutters
                    className={`qa-DataProvider-ListItem-license ${classes.sublistItem}`}
                >
                    <div className={classes.prewrap}>
                        <i>
                            Use of this data is governed by&nbsp;
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={this.handleLicenseOpen}
                                onKeyPress={this.handleLicenseOpen}
                                className={classes.license}
                            >
                                {provider.license.name}
                            </span>
                        </i>
                        <BaseDialog
                            show={this.state.licenseDialogOpen}
                            title={provider.license.name}
                            onClose={this.handleLicenseClose}
                        >
                            <div className={classes.prewrap}>{provider.license.text}</div>
                        </BaseDialog>
                    </div>
                </ListItem>
            ));
        }

        nestedItems.push((
            <ListItem
                className={`qa-DataProvider-ListItem-provServDesc ${classes.sublistItem}`}
                key={nestedItems.length}
                dense
                disableGutters
            >
                <div className={classes.prewrap}>{provider.service_description || 'No provider description available.'}</div>
            </ListItem>
        ));

        nestedItems.push((
            <ListItem
                className={`qa-DataProvider-ListItem-provMaxAoi ${classes.sublistItem}`}
                key={nestedItems.length}
                dense
                disableGutters
            >
                <div className={classes.prewrap}>
                    <strong>Maximum selection area: </strong>
                    {((provider.max_selection == null ||
                        provider.max_selection === '' ||
                        parseFloat(provider.max_selection) <= 0) ?
                        'unlimited' : `${provider.max_selection} km²`
                    )}
                </div>
            </ListItem>
        ));

        // Only set this if we want to display the estimate
        let secondary = undefined;
        if(this.props.renderEstimate)
        {
            secondary = <Typography style={{fontSize: "0.7em"}}>{this.formatSize(provider.estimate)}</Typography>
        }

        const backgroundColor = (this.props.alt) ? colors.secondary : colors.white;

        return (
            <React.Fragment>
                <ListItem
                    className={`qa-DataProvider-ListItem ${classes.listItem}`}
                    key={provider.uid}
                    style={{ backgroundColor }}
                    dense
                    disableGutters
                >
                    <div className={classes.container}>
                        <Checkbox
                            className="qa-DataProvider-CheckBox-provider"
                            classes={{ root: classes.checkbox, checked: classes.checked }}
                            name={provider.name}
                            checked={this.props.checked}
                            onChange={this.props.onChange}
                        />
                        <ListItemText
                            disableTypography
                            classes={{ root: classes.listItemText}}
                            primary={<Typography style={{fontSize: "1.0em"}}>{provider.name}</Typography>}
                            secondary={secondary}
                        />
                        <ProviderStatusIcon
                            id="ProviderStatus"
                            baseStyle={{ marginRight: '40px' }}
                            availability={provider.availability}
                        />
                        {this.state.open ?
                            <ExpandLess className={classes.expand} onClick={this.handleExpand} color="primary" />
                            :
                            <ExpandMore className={classes.expand} onClick={this.handleExpand} color="primary" />
                        }
                    </div>
                </ListItem>
                <Collapse in={this.state.open} key={`${provider.uid}-expanded`}>
                    <List style={{ backgroundColor }}>
                        {nestedItems}
                    </List>
                </Collapse>
            </React.Fragment>
        );
    }
}

DataProvider.defaultProps = {
    renderEstimate: false
};

export default withTheme()(withStyles<any, any>(jss)(DataProvider));
