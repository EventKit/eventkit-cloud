import * as React from 'react';
import AlertWarning from '@material-ui/icons/Warning';
import AlertError from '@material-ui/icons/Error';
import ActionDone from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';

interface Props extends React.HTMLAttributes<HTMLElement> {
    availability: {
        status: string;
        type: string;
        message: string;
    };
    baseStyle?: any;
    iconStyle?: any;
}

interface State {
    anchorEl: null | HTMLElement;
}

export class ProviderStatusIcon extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handlePopoverClose = this.handlePopoverClose.bind(this);
        this.handlePopoverOpen = this.handlePopoverOpen.bind(this);
        this.state = {
            anchorEl: null,
        };
    }

    static defaultProps = { availability: { status: '', type: '', message: '' } };

    private handlePopoverOpen(e: React.MouseEvent<HTMLElement>) {
        this.setState({ anchorEl: e.currentTarget });
    }

    private handlePopoverClose() {
        this.setState({ anchorEl: null });
    }

    render() {
        const style = {
            base: {
                ...this.props.baseStyle,
            },
            icon: {
                verticalAlign: 'top',
                ...this.props.iconStyle,
            },
        };

        const avail = this.props.availability.status ?
            this.props.availability :
            { status: 'PENDING', type: 'PENDING', message: "This data provider's availability is being checked." };

        let StatusIcon;
        let title;
        let messagePrefix;
        let otherProps = {};
        switch (avail.status.toUpperCase()) {
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
                    title={this.props.availability.message}
                    onMouseEnter={this.handlePopoverOpen}
                    onMouseLeave={this.handlePopoverClose}
                    {...otherProps}
                />
                <Popover
                    style={{ pointerEvents: 'none' }}
                    PaperProps={{
                        style: { padding: '16px' },
                    }}
                    open={Boolean(this.state.anchorEl)}
                    anchorEl={this.state.anchorEl}
                    onClose={this.handlePopoverClose}
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
}

export default ProviderStatusIcon;
