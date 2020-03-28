import * as React from 'react';
import AlertWarning from '@material-ui/icons/Warning';
import AlertError from '@material-ui/icons/Error';
import ActionDone from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import {useState} from "react";
import {useJobValidationContext} from "./context/JobValidation";

interface Props extends React.HTMLAttributes<HTMLElement> {
    availability: {
        status: string;
        type: string;
        message: string;
        slug: string;
    };
    baseStyle?: any;
    iconStyle?: any;
}

enum STATUS {
    SUCCESS='SUCCESS',
    FATAL='FATAL',
    ERR='ERR',
    WARN='WARN',
    ESTIMATES_PENDING=1,
    OVER_DATA_SIZE,
    OVER_AREA_SIZE,
}

ProviderStatusCheck.defaultProps = { availability: { status: '', type: '', message: '' } } as Props;

function ProviderStatusCheck(props: Props) {
    const [ anchorElement, setAnchor ] = useState(null);
    const { dataSizeInfo, areEstimatesLoading, aoiArea } = useJobValidationContext();
    const { haveAvailableEstimates = [], exceedingSize = [], providerEstimates = {} } = dataSizeInfo;

    function handlePopoverOpen(e: React.MouseEvent<HTMLElement>) {
        setAnchor(e.currentTarget );
    }

    function handlePopoverClose() {
        setAnchor(null);
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
    let messagePrefix;
    let otherProps = {};
    let status;
    const slug = props.availability.slug;
    // if (areEstimatesLoading) {
    //     status = STATUS.ESTIMATES_PENDING;
    // } else if(haveAvailableEstimates.length) {
    //     if (haveAvailableEstimates.indexOf(slug) > 0) {
    //
    //     } else {
    //
    //     }
    // }
    status = avail.status;
    switch (status) {
        case 'SUCCESS':
            style.icon.color = 'rgba(0, 192, 0, 0.87)';
            StatusIcon = ActionDone;
            title = 'SUCCESS';
            messagePrefix = 'No problems: ';
            break;
        case 'FATAL':
            style.icon.color = 'rgba(128, 0, 0, 0.87)';
            StatusIcon = AlertError;
            title = 'CANNOT SELECT';
            messagePrefix = '';
            break;
        case 'ERR':
            style.icon.color = 'rgba(192, 0, 0, 0.87)';
            StatusIcon = AlertError;
            title = 'ALMOST CERTAIN FAILURE';
            messagePrefix = 'Availability unlikely: ';
            break;
        case 'WARN':
            style.icon.color = 'rgba(255, 162, 0, 0.87)';
            StatusIcon = AlertWarning;
            title = 'POSSIBLE FAILURE';
            messagePrefix = 'Availability compromised: ';
            break;
        case 'EST_PENDING':
            break;
        case 'PENDING':
        default:
            StatusIcon = CircularProgress;
            title = 'CHECKING AVAILABILITY';
            messagePrefix = '';
            otherProps = { thickness: 2, size: 20, color: 'primary' };
            break;
    }

    const message = messagePrefix + avail.message;

    return (
        <div style={style.base} className="qa-ProviderStatusIcon" >
            <StatusIcon
                style={style.icon}
                title={props.availability.message}
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
                {...otherProps}
            />
            <Popover
                style={{ pointerEvents: 'none' }}
                PaperProps={{
                    style: { padding: '16px' },
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
                <div style={{ maxWidth: 400 }}>
                    <Typography variant="h6" gutterBottom style={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <div>{message}</div>
                </div>
            </Popover>
        </div>
    );
}

export default ProviderStatusCheck;
