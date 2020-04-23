import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Clear from '@material-ui/icons/Clear';
import CustomScrollbar from '../common/CustomScrollbar';
import {CompatibilityInfo} from "../CreateDataPack/ExportInfo";


const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    title: {
        padding: '24px 24px 20px',
        fontWeight: 700,
        fontSize: '18px',
        lineHeight: '32px',
    },
    body: {
        padding: '0px 24px',
        fontSize: '16px',
        color: theme.eventkit.colors.text_primary,
    },
    actions: {
        margin: '20px 24px 24px',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    clear: {
        float: 'right',
        cursor: 'pointer',
    },
    button: {
        color: theme.eventkit.colors.secondary,
        fontWeight: 'bold',
    },
});

interface Props {
    show: boolean;
    onClose?: (...args: any) => void;
    title?: any,
    actions?: React.ReactNode[];
    buttonText?: string;
    dialogStyle?: any;
    dialogProps?: any;
    titleStyle?: any;
    bodyStyle?: any;
    bodyProps?: any;
    actionsStyle?: any;
    buttonStyle?: any;
    overlayStyle?: any;
    className?: string;
    innerMaxHeight?: number;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

BaseDialog.defaultProps = {
    onClose: undefined,
    title: undefined,
    actions: undefined,
    buttonText: undefined,
    children: undefined,
    dialogStyle: {},
    dialogProps: {},
    titleStyle: {},
    bodyStyle: {},
    bodyProps: {},
    actionsStyle: {},
    buttonStyle: {},
    overlayStyle: {},
    className: 'qa-BaseDialog-Dialog',
    innerMaxHeight: 400,
} as unknown as Props;


export function BaseDialog(props: React.PropsWithChildren<Props>) {
    const { classes } = props;
    // the default is just a close button
    const defaultActions = [
        <Button
            key="close"
            className={`qa-BaseDialog-Button ${classes.button}`}
            style={props.buttonStyle}
            variant="contained"
            color="primary"
            onClick={props.onClose}
        >
            {props.buttonText || 'Close'}
        </Button>,
    ];

    // if actions have been passed in, use those instead of the default
    const actions = props.actions ? props.actions : defaultActions;

    // display passed in title and a clear button which calls props.onClose
    const title = (
        <div className="qa-BaseDialog-div" style={{ display: 'flex' }}>
            <strong style={{ width: '100%' }}>{props.title ? props.title : ''}</strong>
            <Clear className={classes.clear} color="primary" onClick={props.onClose}/>
        </div>
    );

    return (
        <Dialog
            className={`${classes.overlay} ${props.className}`}
            open={props.show}
            onClose={props.onClose}
            maxWidth="md"
            PaperProps={{
                ...props.dialogProps,
                style: {
                    width: '70%',
                    minWidth: '300px',
                    maxWidth: '610px',
                    maxHeight: '90%',
                    ...props.dialogStyle,
                },
            }}
            style={props.overlayStyle}
        >
            <DialogTitle className={classes.title} style={props.titleStyle} disableTypography>{title}</DialogTitle>
            <DialogContent
                style={props.bodyStyle}
                {...props.bodyProps}
                className={`${classes.body} ${props.bodyProps.className || ''}`} >
                <CustomScrollbar
                    autoHeight
                    autoHeightMax={props.innerMaxHeight}
                >
                    {props.children}
                </CustomScrollbar>
            </DialogContent>
            <DialogActions className={classes.actions} style={props.actionsStyle}>{actions}</DialogActions>
        </Dialog>
    );
}

export default withStyles<any, any>(jss)(withTheme()(BaseDialog));
