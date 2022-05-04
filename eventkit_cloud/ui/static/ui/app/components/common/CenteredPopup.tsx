import * as React from "react";
import { Theme } from "@mui/material/styles";
import withStyles from '@mui/styles/withStyles';
import {useRef} from "react";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";


// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;


const jss = (theme: Eventkit.Theme & Theme) => ({
    dialog: {
        margin: '10px',
    },
    popoverBlock: {
        display: 'flex',
        height: '35px',
        color: 'primary',
        position: 'sticky' as 'sticky',
        bottom: 0,
    },
    button: {
        color: theme.eventkit.colors.secondary,
        fontWeight: 'bold' as 'bold',
        float: 'right' as 'right',
    },
});

interface Props {
    open: boolean;
    onClose: () => void;
    classes: { [className: string]: string; }
}

export function CenteredPopup(props: React.PropsWithChildren<Props>) {
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
                        <div>
                            <div style={{marginTop: '5px'}}>
                                {props.children}
                            </div>
                            <Button
                                key="close"
                                name="qa-popoverButton"
                                className={`qa-BaseDialog-Button ${classes.button}`}
                                variant="contained"
                                color="primary"
                                onClick={props.onClose}
                            >
                                Close
                            </Button>
                        </div>
                    </Popover>
                }
            </div>
        </div>
    )
}


export default withWidth()(withStyles(jss)(CenteredPopup));