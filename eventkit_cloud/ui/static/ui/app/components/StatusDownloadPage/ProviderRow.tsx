import * as React from 'react';
import {withTheme, withStyles, createStyles, Theme} from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import MenuItem from '@material-ui/core/MenuItem';
import LinearProgress from '@material-ui/core/LinearProgress';
import IconButton from '@material-ui/core/IconButton';
import ArrowDown from '@material-ui/icons/KeyboardArrowDown';
import ArrowUp from '@material-ui/icons/KeyboardArrowUp';
import Warning from '@material-ui/icons/Warning';
import Check from '@material-ui/icons/Check';
import CloudDownload from '@material-ui/icons/CloudDownload';
import IconMenu from '../common/IconMenu';
import TaskError from './TaskError';
import ProviderError from './ProviderError';
import BaseDialog from '../Dialog/BaseDialog';
import LicenseRow from './LicenseRow';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import moment from 'moment';

interface Props {
    provider: Eventkit.ProviderTask;
    job: Eventkit.Job;
    selectedProviders: { [uid: string]: boolean };
    selectProvider: (providerTask: Eventkit.ProviderTask) => void;
    onProviderCancel: (uid: string) => void;
    providers: Eventkit.Provider[];
    backgroundColor: string;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
}

interface State {
    openTable: boolean;
    selectedRows: { [uid: string]: boolean };
    fileSize: string;
    providerDesc: string;
    providerDialogOpen: boolean;
    previewDialogOpen: boolean;
}

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

export class ProviderRow extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleSingleDownload = this.handleSingleDownload.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleProviderOpen = this.handleProviderOpen.bind(this);
        this.handleProviderClose = this.handleProviderClose.bind(this);
        this.state = {
            openTable: false,
            selectedRows: {},
            fileSize: this.getFileSize(props.provider.tasks),
            providerDesc: '',
            providerDialogOpen: false,
            previewDialogOpen: false,
        };
    }

    static defaultProps = {selectedProviders: {}};

    componentWillMount() {
        // set state on the provider
        const rows = {};
        const {uid} = this.props.provider;
        rows[uid] = false;
        this.setState({selectedRows: rows});
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.provider.status !== prevProps.provider.status) {
            this.setState({fileSize: this.getFileSize(this.props.provider.tasks)});
        }
        if (this.props.selectedProviders !== this.state.selectedRows) {
            this.setState({selectedRows: this.props.selectedProviders});
        }
    }

    private getFileSize(tasks: Eventkit.Task[]): string {
        let fileSize = 0.000;
        tasks.forEach((task) => {
            if (task.result != null) {
                if (task.display !== false && task.result.size) {
                    const textReplace = task.result.size.replace(' MB', '');
                    const num = textReplace;
                    fileSize = Number(fileSize) + Number(num);
                }
            }
        });

        if (fileSize === 0.000) {
            return null;
        }

        return fileSize.toFixed(3);
    }

    private getEstimatedFinish(task: Eventkit.Task) {
        if (!task || !task.estimated_finish && (!task.estimated_duration || !task.started_at)) {
            return '';
        } else {
            let etaSeconds;
            let estimatedSeconds;
            let estimatedFinish: moment.Moment;
            // at least one of these blocks must execute
            if (task.estimated_finish) {
                // get the seconds until completion according to the reported ETA
                const finishMoment: any = moment(task.estimated_finish);
                const nowMoment: any = moment();
                etaSeconds = (finishMoment - nowMoment) / 1000;
            }
            if (task.estimated_duration) {
                // get the seconds to completion according to estimated duration
                const beginMoment: any = moment(task.started_at);
                const calculatedFinish: any = moment(beginMoment).add(task.estimated_duration);
                estimatedSeconds = (calculatedFinish - beginMoment) / 1000;
            }
            if (etaSeconds !== undefined && estimatedSeconds !== undefined) {
                estimatedFinish = moment().add({seconds: (etaSeconds + estimatedSeconds) / 2});
            } else if (etaSeconds !== undefined) {
                estimatedFinish = moment().add({seconds: etaSeconds});
            } else if (estimatedSeconds !== undefined) {
                estimatedFinish = moment().add({seconds: estimatedSeconds});
            }
            return estimatedFinish.format('kk:mm [\r\n] MMM Do');
        }
    }

    private getLastEstimatedFinish(tasks: Eventkit.Task[]) {
        if (!tasks || tasks.length === 0) {
            return '';
        }
        return this.getEstimatedFinish([...tasks].sort((a, b) => {
            if (a.estimated_finish && b.estimated_finish) {
                return new Date(a.estimated_finish).getTime() - new Date(b.estimated_finish).getTime();
            } else {
                return 1;
            }
        })[0]);
    }

    private getTaskStatus(task: Eventkit.Task) {
        const {colors} = this.props.theme.eventkit;
        switch (task.status) {
            case 'SUCCESS':
                return (
                    <Check
                        className="qa-ProviderRow-Check-taskStatus"
                        style={{fill: colors.success, verticalAlign: 'middle', marginBottom: '2px'}}
                    />
                );
            case 'FAILED':
                return <TaskError task={task}/>;
            case 'PENDING':
                return 'WAITING';
            case 'RUNNING':
                return (
                    <span className="qa-ProviderRow-span-taskStatus">
                        <LinearProgress variant="determinate" value={task.progress}/>
                        {task.progress === 100 ? '' : `${task.progress.toFixed(1)} %`}
                    </span>
                );
            case 'CANCELED':
                return (
                    <Warning
                        className="qa-ProviderRow-Warning-taskStatus"
                        style={{
                            marginLeft: '10px',
                            fill: colors.running,
                            verticalAlign: 'bottom',
                        }}
                    />
                );
            default:
                return '';
        }
    }

    private getProviderStatus(provider: Eventkit.ProviderTask) {
        const {colors} = this.props.theme.eventkit;

        switch (provider.status) {
            case 'COMPLETED':
                return (
                    <Check
                        className="qa-ProviderRow-Check-providerStatus"
                        style={{fill: colors.success, verticalAlign: 'middle', marginBottom: '2px'}}
                    />
                );
            case 'INCOMPLETE':
                return <ProviderError provider={provider} key={provider.uid}/>;
            case 'PENDING':
                return 'WAITING';
            case 'RUNNING':
                return 'IN PROGRESS';
            case 'CANCELED':
                return (
                    <span
                        className="qa-ProviderRow-span-providerStatus"
                        style={{
                            fontWeight: 'bold',
                            borderTopWidth: '10px',
                            borderBottomWidth: '10px',
                            borderLeftWidth: '10px',
                            color: colors.running,
                        }}
                    >
                    CANCELED
                        <Warning
                            className="qa-ProviderRow-Warning-providerStatus"
                            style={{
                                marginLeft: '10px',
                                fill: colors.running,
                                verticalAlign: 'bottom',
                            }}
                        />
                    </span>
                );
            default:
                return '';
        }
    }

    private getTaskLink(task: Eventkit.Task) {
        const {colors} = this.props.theme.eventkit;

        if (!Object.prototype.hasOwnProperty.call(task.result, 'url')) {
            return (
                <span
                    className="qa-ProviderRow-span-taskLinkDisabled"
                    style={{color: colors.grey}}
                >
                    {task.name}
                </span>
            );
        }
        return (
            <span
                className="qa-ProviderRow-a-taskLinkenabled"
                role="button"
                tabIndex={0}
                onClick={() => {
                    this.handleSingleDownload(task.result.url);
                }}
                onKeyPress={() => {
                    this.handleSingleDownload(task.result.url);
                }}
                style={{color: colors.primary, cursor: 'pointer'}}
            >
                {task.name}
            </span>
        );
    }

    private getTaskDownloadIcon(task: Eventkit.Task) {
        const {colors} = this.props.theme.eventkit;

        if (!Object.prototype.hasOwnProperty.call(task.result, 'url')) {
            return (
                <CloudDownload
                    className="qa-ProviderRow-CloudDownload-taskLinkDisabled"
                    key={task.result == null ? '' : task.result.url}
                    style={{
                        marginLeft: '10px',
                        fill: colors.grey,
                        verticalAlign: 'middle',
                    }}
                />
            );
        }
        return (
            <CloudDownload
                className="qa-ProviderRow-CloudDownload-taskLinkEnabled"
                onClick={() => {
                    this.handleSingleDownload(task.result.url);
                }}//
                key={task.result.url}
                style={{
                    marginLeft: '10px',
                    cursor: 'pointer',
                    fill: colors.primary,
                    verticalAlign: 'middle',
                }}
            />
        );
    }

    private handleToggle() {
        this.setState({openTable: !this.state.openTable});
    }

    private handleSingleDownload(url: string) {
        window.open(url, '_blank');
    }

    private handleProviderClose() {
        this.setState({providerDialogOpen: false});
    }

    private handleProviderOpen() {
        const {provider} = this.props;
        const propsProvider = this.props.providers.find(x => x.slug === provider.provider.slug);
        const providerDesc = propsProvider.service_description;
        this.setState({providerDesc, providerDialogOpen: true});
    }

    render() {
        const {classes} = this.props;
        const {provider} = this.props;
        const {job} = this.props;

        const dataProviderTask = job && job.provider_tasks.find(obj => obj.provider === provider.name);
        const propsProvider = this.props.providers.find(obj => obj.slug === provider.slug);

        // If available, get custom zoom levels from DataProviderTask otherwise use Provider defaults.
        const min_zoom = dataProviderTask && dataProviderTask.min_zoom || propsProvider && propsProvider.level_from;
        const max_zoom = dataProviderTask && dataProviderTask.max_zoom || propsProvider && propsProvider.level_to;

        const licenseData = propsProvider && propsProvider.license ?
            <LicenseRow name={propsProvider.license.name} text={propsProvider.license.text}/>
            :
            null;

        const menuItems = [];

        let cancelMenuDisabled;
        if (provider.status === 'PENDING' || provider.status === 'RUNNING') {
            cancelMenuDisabled = false;
        } else {
            cancelMenuDisabled = true;
        }

        menuItems.push(
            <MenuItem
                className="qa-ProviderRow-MenuItem-cancel"
                key="cancel"
                disabled={cancelMenuDisabled}
                style={{fontSize: '12px'}}
                onClick={() => {
                    this.props.onProviderCancel(provider.uid);
                }}
            >
                Cancel
            </MenuItem>,
            <MenuItem
                className="qa-ProviderRow-MenuItem-viewDataSources"
                key="viewProviderData"
                style={{fontSize: '12px'}}
                onClick={this.handleProviderOpen}
            >
                View Data Source
            </MenuItem>,
            <MenuItem
                className="qa-ProviderRow-MenuItem-preview"
                key="viewPreviews"
                disabled={!this.props.provider.preview_url}
                style={{fontSize: '12px'}}
                onClick={(event) => {
                    // provider IS a ProviderTask
                    this.props.selectProvider(this.props.provider)
                }}
            >
                View Data Preview
            </MenuItem>,
        );

        const tasks = provider.tasks.filter(task => (task.display !== false));

        let tableData;
        if (this.state.openTable) {
            tableData = (
                <Table style={{tableLayout: 'fixed'}}>
                    <TableBody
                        className="qa-ProviderRow-TableBody"
                    >
                        {licenseData}
                        <TableRow
                            className="qa-ProviderRow-TableRow-task"
                        >
                            <TableCell classes={{root: classes.insetColumn}}/>

                            <TableCell
                                className="qa-ProviderRow-TableCell-zoomLevels"
                                classes={{root: classes.zoomLevelColumn}}
                            >
                                Zoom Levels {min_zoom} - {max_zoom}
                            </TableCell>
                            <TableCell classes={{root: classes.sizeColumnn}}/>
                            <TableCell classes={{root: classes.estimatedFinishColumn}}/>
                            <TableCell classes={{root: classes.taskStatusColumn}}/>
                            <TableCell classes={{root: classes.menuColumn}}/>
                            <TableCell classes={{root: classes.arrowColumn}}/>
                        </TableRow>
                        {tasks.map(task => (
                            <TableRow
                                className="qa-ProviderRow-TableRow-task"
                                key={task.uid}
                            >
                                <TableCell classes={{root: classes.insetColumn}}/>
                                <TableCell
                                    className="qa-ProviderRow-TableCell-taskLinks"
                                    classes={{root: classes.taskLinkColumn}}
                                >
                                    {this.getTaskLink(task)}
                                    {this.getTaskDownloadIcon(task)}
                                </TableCell>
                                <TableCell
                                    className="qa-ProviderRow-TableCell-size"
                                    classes={{root: classes.sizeColumnn}}
                                >
                                    {task.result == null ? '' : task.result.size}
                                </TableCell>
                                <TableCell
                                    className="qa-ProviderRow-TableCell-estimatedFinish"
                                    classes={{root: classes.estimatedFinishColumn}}
                                    style={{fontSize: '.85em'}}
                                >
                                    {this.getEstimatedFinish(task)}
                                </TableCell>
                                <TableCell
                                    className="qa-ProviderRow-TableCell-status"
                                    classes={{root: classes.taskStatusColumn}}
                                >
                                    {this.getTaskStatus(task)}
                                </TableCell>
                                <TableCell classes={{root: classes.menuColumn}}/>
                                <TableCell classes={{root: classes.arrowColumn}}/>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        } else {
            tableData = null;
        }

        return (
            <div>
                <Table
                    key={provider.uid}
                    className="qa-ProviderRow-Table"
                    style={{width: '100%', backgroundColor: this.props.backgroundColor, tableLayout: 'fixed'}}
                >
                    <TableHead
                        className="qa-ProviderRow-TableHead"
                    >
                        <TableRow className="qa-ProviderRow-TableRow-provider">
                            <TableCell
                                className="qa-ProviderRow-TableCell-providerName"
                                classes={{root: classes.providerColumn}}
                            >
                                {provider.name}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-fileSize"
                                classes={{root: classes.fileSizeColumn}}
                            >
                                {this.state.fileSize == null ? '' : `${this.state.fileSize} MB`}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-estimatedFinish"
                                classes={{root: classes.estimatedFinishColumn}}
                            >
                                {this.getLastEstimatedFinish(tasks)}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-providerStatus"
                                classes={{root: classes.providerStatusColumn}}
                            >
                                {this.getProviderStatus(this.props.provider)}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-menu"
                                classes={{root: classes.menuColumn}}
                            >
                                {menuItems.length > 0 ?
                                    <IconMenu
                                        className="qa-ProviderRow-IconMenu"
                                    >
                                        {menuItems}
                                    </IconMenu>
                                    :
                                    null
                                }
                                <BaseDialog
                                    className="qa-ProviderRow-BaseDialog"
                                    show={this.state.providerDialogOpen}
                                    title={provider.name}
                                    onClose={this.handleProviderClose}
                                >
                                    <div>Zoom Levels {min_zoom} - {max_zoom}</div>
                                    {this.state.providerDesc}
                                </BaseDialog>
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-arrows"
                                classes={{root: classes.arrowColumn}}
                            >
                                <IconButton
                                    disableTouchRipple
                                    onClick={this.handleToggle}
                                >
                                    {this.state.openTable ?
                                        <ArrowUp className="qa-ProviderRow-ArrowUp" color="primary"/>
                                        :
                                        <ArrowDown className="qa-ProviderRow-ArrowDown" color="primary"/>
                                    }
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
                {tableData}
            </div>
        );
    }
}

export default withWidth()(withTheme()(withStyles(jss)(ProviderRow)));
