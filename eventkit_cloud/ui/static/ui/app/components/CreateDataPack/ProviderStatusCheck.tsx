import * as React from 'react';
import AlertWarning from '@material-ui/icons/Warning';
import AlertError from '@material-ui/icons/Error';
import ActionDone from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import BaseDialog from '../Dialog/BaseDialog';
import {useState} from "react";
import {useJobValidationContext} from "./context/JobValidation";
import {Button, createStyles, IconButton, Theme, withStyles} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

// const jss = (theme: Eventkit.Theme & Theme) => createStyles({
//     submissionPopover: {},
//     submissionPopoverText: {},
// });

interface Props extends React.HTMLAttributes<HTMLElement> {
    availability: {
        status: string;
        type: string;
        message: string;
        slug: string;
    };
    overSize: boolean;
    overArea: boolean;
    providerHasEstimates: boolean;
    areEstimatesLoading: boolean;
    supportsZoomLevels: boolean;
    baseStyle?: any;
    iconStyle?: any;
    classes: { [className: string]: string };
}

enum STATUS {
    SUCCESS='SUCCESS',
    FATAL='FATAL',
    ERR='ERR',
    WARN='WARN',
    PENDING='PENDING',
    ESTIMATES_PENDING=1,
    OVER_DATA_SIZE,
    OVER_AREA_SIZE,
}

ProviderStatusCheck.defaultProps = { availability: { status: '', type: '', message: '' } } as Props;

function ProviderStatusCheck(props: Props) {
    const { areEstimatesLoading, providerHasEstimates } = props;
    const [ anchorElement, setAnchor ] = React.useState(null);
    const [ open, setOpen ] = useState(false);
    const [ isSubmissionOpen, setSubmissionOpen ] = useState(false);
    const divRef = React.useRef();
    const { classes } = props;

    function handlePopoverOpen(e: React.MouseEvent<HTMLElement>) {
        setAnchor(e.currentTarget);
    }

    function handlePopoverClose() {
        // e.preventDefault();
        // e.stopPropagation();
        setAnchor(null);
        setOpen(false);
        console.log('HITTING FINAL CLOSE EVENT')
    }

    function handleClick(e: React.MouseEvent<HTMLElement>) {
        setAnchor(e.currentTarget);
        // setOpen(true)
      }

    function handleClose() {
        // e.preventDefault();
        // e.stopPropagation();
        setAnchor(null);
        console.log('HITTING FIRST CLICK EVENT')
        // setOpen(false);
    }

    function handleSubmissionOpen() {
        setSubmissionOpen(true);
    }

    function handleSubmissionClose() {
        setSubmissionOpen(false);
    }

    const style = {
        base: {
            ...props.baseStyle,
        },
        icon: {
            verticalAlign: 'top',
            ...props.iconStyle,
        },
    };

    const avail = props.availability.status ?
        props.availability :
        { status: 'PENDING', type: 'PENDING', message: "This data provider's availability is being checked." };


    let StatusIcon;
    let title;
    let message;
    const makeMessage = (prefix: string, useMessage=true) => prefix + ((useMessage) ? avail.message : '');
    let otherProps = {};
    let status = avail.status as STATUS;

    if (status === STATUS.FATAL && avail.type !== 'SELECTION_TOO_LARGE') {
        style.icon.color = 'rgba(128, 0, 0, 0.87)';
        StatusIcon = AlertError;
        message = makeMessage('');
        title = 'CANNOT SELECT';
    } else {
        if (areEstimatesLoading) {
            status = STATUS.ESTIMATES_PENDING;
        } else {
            if (providerHasEstimates) {
                if (props.overSize) {
                    status = STATUS.OVER_DATA_SIZE;
                } else if (status === STATUS.WARN && avail.type === 'SELECTION_TOO_LARGE') {
                    status = STATUS.SUCCESS;
                    message = makeMessage('No problems: Export should proceed without issues.', false);
                }
            } else {
                if (props.overArea) {
                    status = STATUS.OVER_AREA_SIZE;
                }
            }
        }
        switch (status) {
            case STATUS.SUCCESS:
                style.icon.color = 'rgba(0, 192, 0, 0.87)';
                StatusIcon = ActionDone;
                title = 'SUCCESS';
                if (!message) {
                    message = makeMessage('No problems: ');
                }
                break;
            case STATUS.ERR:
                style.icon.color = 'rgba(192, 0, 0, 0.87)';
                StatusIcon = AlertError;
                title = 'ALMOST CERTAIN FAILURE';
                message = makeMessage('Availability unlikely: ');
                break;
            case STATUS.WARN:
                style.icon.color = 'rgba(255, 162, 0, 0.87)';
                StatusIcon = AlertWarning;
                title = 'POSSIBLE FAILURE';
                message = makeMessage('Availability compromised: ');
                break;
            case STATUS.OVER_AREA_SIZE:
                style.icon.color = 'rgba(192, 0, 0, 0.87)';
                StatusIcon = AlertError;
                title = 'AOI TOO LARGE';
                message = makeMessage('The selected AOI larger than the maximum allowed size for this provider.', false);
                break;
            case STATUS.OVER_DATA_SIZE:
                style.icon.color = 'rgba(192, 0, 0, 0.87)';
                StatusIcon = AlertError;
                title = 'MAX DATA SIZE EXCEEDED';
                if (props.supportsZoomLevels) {
                    message = makeMessage('Estimated size too large. Please adjust zoom levels or your AOI to reduce.', false);
                } else {
                    message = makeMessage('Estimated size too large. Please adjust your AOI to reduce.', false);
                }
                break;
            case STATUS.ESTIMATES_PENDING:
            case STATUS.PENDING:
            default:
                StatusIcon = CircularProgress;
                title = 'CHECKING AVAILABILITY';
                message = makeMessage('');
                otherProps = { thickness: 2, size: 20, color: 'primary' };
                break;
        }
    }

    let submissionPopover;
    if (!!isSubmissionOpen) {
        submissionPopover = (
            <div className={classes.submissionPopover}>
                <BaseDialog
                    show={isSubmissionOpen}
                    // title={provider.license.name}
                    onClose={handleSubmissionClose}
                >
                    <div className={classes.submissionPopoverText}>Your AOI increase request has been submitted.</div>
                    <Button>OK</Button>
                </BaseDialog>
            </div>
        );
    }

    let popOverBlock;
    const openEl = Boolean(anchorElement);
    const id = open ? 'simple-popover' : undefined;
    if ((status !== STATUS.OVER_AREA_SIZE) && (avail.type !== 'AOI TOO LARGE')) {
        popOverBlock = (
            <div style={style.base} className="qa-ProviderStatusIcon">
                <StatusIcon
                    style={style.icon}
                    title={props.availability.message}
                    onMouseEnter={handlePopoverOpen}
                    onMouseLeave={handlePopoverClose}
                    {...otherProps}
                />
                <Popover
                    style={{pointerEvents: 'none'}}
                    PaperProps={{
                        style: {padding: '16px'},
                    }}
                    open={!!anchorElement}
                    anchorEl={anchorElement}
                    onClose={handlePopoverClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                >
                    <div style={{maxWidth: 400}}>
                        <Typography variant="h6" gutterBottom style={{fontWeight: 600}}>
                            {title}
                        </Typography>
                        <div>{message}</div>
                    </div>
                </Popover>
            </div>
        )
    } else {
        popOverBlock = (
            <div style={style.base} className="qa-ProviderStatusIcon">
                <StatusIcon
                    style={style.icon}
                    title={props.availability.message}
                    onClick={handleClick}
                    // onClick={handlePopoverOpen}
                    {...otherProps}
                />
                <Popover
                    id={id}
                    style={{pointerEvents: 'none'}}
                    PaperProps={{
                        style: {padding: '16px'},
                    }}
                    open={openEl}
                    anchorEl={anchorElement}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                >
                    <div style={{maxWidth: 400}}>
                        <Typography variant="h6" gutterBottom style={{fontWeight: 600}}>
                            {title}
                            <IconButton
                                className='qa-ProviderStatusIcon-icon-btn'
                                type='button'
                                onChange={handleClose}

                                // issue is anchor element is the status icon, not the icon btn
                                // onClick={()=> console.log("HITTING ICON BTN")}
                            >
                                <CloseIcon
                                    className='qa-ProviderStatusIcon-close-icon'
                                />
                            </IconButton>
                        </Typography>
                        <div>{message}</div>
                        <br/>
                        <span
                            className="qa-ProviderStatusIcon-submission-popover-title"
                            role="button"
                            onClick={handleSubmissionOpen}
                            onKeyPress={handleSubmissionOpen}
                        >
                            <strong>Request Larger AOI Limit</strong>
                        </span>
                        {submissionPopover}
                    </div>
                </Popover>
            </div>
        )
    }

    return (
        <div style={style.base} className="qa-ProviderStatusIcon" >
            {popOverBlock}
        </div>
    );
}
// export default withStyles<any, any>(jss)(ProviderStatusCheck);
export default ProviderStatusCheck;