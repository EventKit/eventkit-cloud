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
    overSize: boolean;
    overArea: boolean;
    providerHasEstimates: boolean;
    areEstimatesLoading: boolean;
    baseStyle?: any;
    iconStyle?: any;
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
    const [ anchorElement, setAnchor ] = useState(null);

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
    let message;
    const makeMessage = (prefix: string, message=avail.message) => prefix + message;
    let otherProps = {};
    let status = avail.status as STATUS;
    const slug = props.availability.slug;

    if (status === STATUS.FATAL) {
        style.icon.color = 'rgba(128, 0, 0, 0.87)';
        StatusIcon = AlertError;
        title = 'CANNOT SELECT';
        messagePrefix = '';
    } else {
        if (areEstimatesLoading) {
            status = STATUS.ESTIMATES_PENDING;
        } else {
            if (providerHasEstimates) {
                if (props.overSize) {
                    status = STATUS.OVER_DATA_SIZE;
                }
            } else {
                if (props.overArea) {
                    status = STATUS.OVER_AREA_SIZE;
                }
            }
        }
        switch (status) {
            case 'SUCCESS':
                style.icon.color = 'rgba(0, 192, 0, 0.87)';
                StatusIcon = ActionDone;
                title = 'SUCCESS';
                message = makeMessage('No problems: ');
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
                message = makeMessage('Selected AoI too large for this provider.', '');
                break;
            case STATUS.OVER_DATA_SIZE:
                style.icon.color = 'rgba(192, 0, 0, 0.87)';
                StatusIcon = AlertError;
                title = 'MAX DATA SIZE EXCEEDED';
                message = makeMessage('Estimated size exceeds max allowed data size. Adjust zoom levels to reduce.');
                break;
            case STATUS.ESTIMATES_PENDING:
            case STATUS.PENDING:
            default:
                StatusIcon = CircularProgress;
                title = 'CHECKING AVAILABILITY';
                messagePrefix = '';
                otherProps = { thickness: 2, size: 20, color: 'primary' };
                break;
        }
    }

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
