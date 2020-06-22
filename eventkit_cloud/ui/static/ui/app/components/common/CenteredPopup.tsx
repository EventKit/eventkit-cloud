import * as React from "react";
import {Theme, withStyles} from "@material-ui/core/styles";
import withWidth from "@material-ui/core/withWidth";
import {useRef} from "react";
import { IconButton} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Popover from "@material-ui/core/Popover";


const jss = (theme: Eventkit.Theme & Theme) => ({
    button: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        color: theme.eventkit.colors.primary,
        fontWeight: 'bold' as 'bold',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.selected_primary_dark,
            color: theme.eventkit.colors.primary,
        },
        '&:disabled': {
            backgroundColor: theme.eventkit.colors.white,
            color: theme.eventkit.colors.primary,
            justifyContent: 'start',
            fontSize: '16px',
        }
    },
    buttonDisabled: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        color: theme.eventkit.colors.primary,
        fontWeight: 'bold' as 'bold',
        textTransform: 'none' as 'none',
        fontSize: '24px',
        '&:disabled': {
            backgroundColor: theme.eventkit.colors.white,
            color: theme.eventkit.colors.primary,
            justifyContent: 'start',
        }
    },
    popoverBlock: {
        display: 'flex',
        height: '35px',
        color: 'primary',
        position: 'sticky' as 'sticky',
        bottom: 0,
    },
    fakeButton: {
        cursor: 'pointer',
        position: 'absolute' as 'absolute',
        width: '100%', height: '100%',
        pointerEvents: 'auto' as 'auto',
    },
    disabledText: {
        textTransform: 'none' as 'none',
        fontWeight: 'normal' as 'normal',
        fontSize: '20px',
    },
    preview: {
        height: '1000px',
        width: '1000px',
    },
    dialog: {
        margin: '10px',
    },
    iconButton: {
        float: 'right' as 'right',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
});

interface Props {
    open: boolean;
    onClose: () => void;
    classes: { [className: string]: string; }
}


function CenteredPopup(props: React.PropsWithChildren<Props>) {
    const {open, onClose, classes} = props;

    const fullScreenDivRef = useRef(null);
    return (
        <div className={classes.popoverBlock}>
            <div
                style={{
                    width: 'calc(100vw)', height: 'calc(100vh)',
                    position: 'fixed', top: '0', left: '0',
                }}
                ref={fullScreenDivRef}
            >
                {open &&
                    <Popover
                        PaperProps={{
                            style: {padding: '16px', width: '30%'}
                        }}
                        open={open}
                        anchorEl={fullScreenDivRef.current}
                        onClose={onClose}
                        anchorOrigin={{
                            vertical: 'center',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'center',
                            horizontal: 'center',
                        }}
                    >
                        <div style={{display: 'contents' as 'contents'}}>
                            <div style={{marginTop: '5px'}}>
                                {props.children}
                            </div>
                        </div>
                    </Popover>
                }
            </div>
        </div>
    )
}


export default withWidth()(withStyles(jss)(CenteredPopup));