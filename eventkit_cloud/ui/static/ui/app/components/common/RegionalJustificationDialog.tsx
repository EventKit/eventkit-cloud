import * as React from 'react';
import {withTheme, withStyles, createStyles, Theme} from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import BaseDialog from '../Dialog/BaseDialog';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import {useAsyncRequest} from "../../utils/hooks/api";
import {getCookie} from "../../utils/generic";
import {Button} from "@material-ui/core";

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    insetColumn: {
        width: '44px',
        padding: '0px',
    },
    sizeColumnn: {
        width: '80px',
        paddingRight: '0px',
        paddingLeft: '0px',
        textAlign: 'center',
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
            width: '120px',
        },
    },
    taskStatusColumn: {
        width: '80px',
        paddingRight: '10px',
        paddingLeft: '10px',
        textAlign: 'center',
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
            width: '120px',
        },
        fontWeight: 'bold',
    },
    taskLinkColumn: {
        paddingRight: '12px',
        paddingLeft: '0px',
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
        },
    },
    zoomLevelColumn: {
        paddingRight: '12px',
        paddingLeft: '0px',
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
        },
    },
    providerColumn: {
        paddingRight: '12px',
        paddingLeft: '12px',
        whiteSpace: 'normal' as 'normal',
        color: theme.eventkit.colors.black,
        fontWeight: 'bold',
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
        },
    },
    fileSizeColumn: {
        width: '80px',
        paddingRight: '0px',
        paddingLeft: '0px',
        textAlign: 'center',
        color: theme.eventkit.colors.black,
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
            width: '120px',
        },
    },
    estimatedFinishColumn: {
        whiteSpace: 'pre',
        width: '80px',
        paddingRight: '0px',
        paddingLeft: '0px',
        textAlign: 'center',
        color: theme.eventkit.colors.black,
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
            width: '120px',
        },
    },
    providerStatusColumn: {
        width: '80px',
        paddingRight: '0px',
        paddingLeft: '0px',
        textAlign: 'center',
        color: theme.eventkit.colors.black,
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
            width: '120px',
        },
    },
    menuColumn: {
        width: '36px',
        paddingRight: '0px',
        paddingLeft: '0px',
        textAlign: 'right',
    },
    arrowColumn: {
        width: '50px',
        paddingRight: '0px',
        paddingLeft: '0px',
        textAlign: 'left',
    },
});

interface Props {
    isOpen: boolean;
    onSubmit: () => void;
    onClose: () => void;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
}

// Remove this once the real renderIf gets added
function renderIf(callback, bool) { return callback()}

export function ProviderRow(props: Props) {

    const {isOpen, onCancel, onSubmit, classes} = props;

    const [{status, response}, requestCall] = useAsyncRequest();
    const makeRequest = () => {
        requestCall({
            url: `/api/call`,
            method: 'get',
            data: {
                data: 'this is data',
            },
            headers: {'X-CSRFToken': getCookie('csrftoken')},
        }).then(() => undefined);
    };

    function renderTitle() {
        return 'Domestic Imagery Policy';
    }

    function renderHeader() {

    }

    return renderIf(() => (
        <BaseDialog
            className="qa-ProviderError-BaseDialog"
            show={isOpen}
            title={renderTitle()}
            onClose={onCancel}
            actionsStyle={{
                justifyContent: 'end',
            }}
            actions={
                [
                    (
                        <Button
                            key="cancelAndExit"
                            variant="contained"
                            color="primary"
                            onClick={onCancel}
                        >
                            CANCEL AND EXIT DOMESTIC TERRITORY
                        </Button>
                    ),
                ]
            }
        >
        </BaseDialog>
    ), isOpen)
}

export default withWidth()(withTheme((withStyles(jss)(ProviderRow))));
