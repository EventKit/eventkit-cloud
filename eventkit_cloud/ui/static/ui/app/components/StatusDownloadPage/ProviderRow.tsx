import * as React from 'react';
import { Theme, Breakpoint } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import withStyles from '@mui/styles/withStyles';
import createStyles from '@mui/styles/createStyles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import ArrowDown from '@mui/icons-material/KeyboardArrowDown';
import ArrowUp from '@mui/icons-material/KeyboardArrowUp';
import Warning from '@mui/icons-material/Warning';
import Check from '@mui/icons-material/Check';
import CloudDownload from '@mui/icons-material/CloudDownload';
import IconMenu from '../common/IconMenu';
import ErrorDialog from './ErrorDialog';
import BaseDialog from '../Dialog/BaseDialog';
import LicenseRow from './LicenseRow';
import moment from 'moment';
import {useEffect, useState} from "react";
import {useAsyncRequest} from "../../utils/hooks/api";
import {getCookie} from "../../utils/generic";
import ProviderTaskErrorDialog from "./ProviderTaskErrorDialog";
import {useDataCartContext} from "./context/DataCart";
import {useRunContext} from "./context/RunFile";
import Popover from "@mui/material/Popover";
import {Link} from "@mui/material";
import Typography from "@mui/material/Typography";
import {MatomoClickTracker} from "../MatomoHandler";

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

const taskPaddingLeft = '44';
const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    insetColumn: {
        width: '44px',
        padding: '0px',
    },
    headingInsetColumn: {
        width: '10px',
        padding: '0px',
    },
    sizeColumn: {
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
        paddingLeft: `${taskPaddingLeft}px`,
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
        },
    },
    headingColumn: {
        color: theme.eventkit.colors.black,
        fontWeight: 'bold',
        marginLeft: '0px',
        paddingRight: '12px',
        paddingLeft: '0px',
        fontSize: '13px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
        },
    },
    zoomLevelColumn: {
        paddingRight: '12px',
        paddingLeft: `${taskPaddingLeft}px`,
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
    restrictedText: {
        color: theme.eventkit.colors.grey,
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
    title: {
        fontWeight: 600,
        cursor: 'pointer',
    },
    nestedRows: {
        borderBottom: '0px',
        lineHeight: '1',
        paddingBottom: '0.2em',
    },
});

export interface ProviderRowProps {
    providerTask: Eventkit.ProviderTask;
    job: Eventkit.Job;
    selectProvider: (providerTask: Eventkit.ProviderTask) => void;
    onProviderCancel: (uid: string) => void;
    providers: Eventkit.Provider[];
    backgroundColor: string;
    restricted: boolean;
    openDialog: () => void;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
}

export function ProviderRow(props: ProviderRowProps) {

    const {classes, providerTask, job} = props;
    const {setFetching} = useDataCartContext();
    const {run} = useRunContext();

    const [openTable, setOpenTable] = useState(false);
    const exportTasks = providerTask.tasks.filter(task => (task.display !== false && !task.hide_download));
    const preprocessingTasks = providerTask.tasks.filter(task => (task.display !== false && task.hide_download));
    const [fileSize, setFileSize] = useState(getFileSize(exportTasks));
    const [providerDesc, setProviderDesc] = useState('');
    const [providerDialogOpen, setProviderDialogOpen] = useState(false);

    const cancelMenuDisabled = !(providerTask.status === 'PENDING' || providerTask.status === 'RUNNING');

    const [, requestCall] = useAsyncRequest();
    const makeRequest = () => {
        if (!cancelMenuDisabled || !run) {
            return;
        }
        requestCall({
            url: `/api/runs/${run.uid}/rerun_providers`,
            method: 'post',
            data: {
                data_provider_slugs: [props.providerTask.provider.slug]
            },
            headers: {'X-CSRFToken': getCookie('csrftoken')},
        }).then(() => setFetching());
    };

    useEffect(() => {
        setFileSize(getFileSize(exportTasks));
    }, [props.providerTask.status]);

    function getFileSize(tasks: Eventkit.Task[]): string {
        let fileSize = 0.000;
        tasks.forEach((task) => {
            if (task.result != null) {
                if (task.display !== false && task.result.size) {
                    fileSize = fileSize + Number(task.result.size.replace(' MB', ''));
                }
            }
        });

        if (fileSize === 0.000) {
            return null;
        }

        return fileSize.toFixed(3);
    }

    function getEstimatedFinish(task: Eventkit.Task) {
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

    function getLastEstimatedFinish(tasks: Eventkit.Task[]) {
        if (!tasks || tasks.length === 0) {
            return '';
        }
        return getEstimatedFinish([...tasks].sort((a, b) => {
            if (a.estimated_finish && b.estimated_finish) {
                return new Date(a.estimated_finish).getTime() - new Date(b.estimated_finish).getTime();
            } else {
                return 1;
            }
        })[0]);
    }

    function getTaskStatus(task: Eventkit.Task) {
        const {colors} = props.theme.eventkit;
        switch (task.status) {
            case 'SUCCESS':
                return (
                    <Check
                        className="qa-ProviderRow-Check-taskStatus"
                        style={{fill: colors.success, verticalAlign: 'middle', marginBottom: '2px'}}
                    />
                );
            case 'FAILED':
                return <ErrorDialog
                    errors={task.errors}
                    onRetryClicked={makeRequest}
                    name={task.name}
                />;
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

    function getProviderStatus(provider: Eventkit.ProviderTask) {
        const {colors} = props.theme.eventkit;

        switch (provider.status) {
            case 'COMPLETED':
                return (
                    <Check
                        className="qa-ProviderRow-Check-providerStatus"
                        style={{fill: colors.success, verticalAlign: 'middle', marginBottom: '2px'}}
                    />
                );
            case 'INCOMPLETE':
                return (
                    <ProviderTaskErrorDialog
                        providerTask={provider}
                        onRetryClicked={makeRequest}
                        key={provider.uid}

                    />
                );
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

    function getTaskLink(task: Eventkit.Task) {
        const {colors} = props.theme.eventkit;

        if (!Object.prototype.hasOwnProperty.call(task.result, 'url') || props.restricted) {
            return (
                <span
                    className="qa-ProviderRow-span-taskLinkDisabled"
                    style={{color: colors.grey}}
                >
                    {task.name}
                </span>
            );
        }
        if (task.hide_download) {
            return task.name;
        }
        return (
            <MatomoClickTracker
                eventAction="Download Task File"
                eventName={task.result.url}
                eventCategory="Status and Download"
                eventValue={2}
            >
                <span
                    className="qa-ProviderRow-a-taskLinkenabled"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        handleSingleDownload(task.result.url);
                    }}
                    onKeyPress={() => {
                        handleSingleDownload(task.result.url);
                    }}
                    style={{color: colors.primary, cursor: 'pointer'}}
                >
                    {task.name}
                </span>
            </MatomoClickTracker>
        );
    }

    const [anchor, setAnchor] = useState<any>();
    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchor(e.currentTarget);
    };

    // TODO: extract functions like this so they can be tested in isolation.
    function getTaskDownloadIcon(task: Eventkit.Task) {
        const {colors} = props.theme.eventkit;

        if (!Object.prototype.hasOwnProperty.call(task.result, 'url') || props.restricted) {
            if (props.restricted) {
                return <>
                    <Popover
                        {...{
                            PaperProps: {
                                style: {padding: '16px', width: '30%'}
                            },
                            open: !!anchor,
                            anchorEl: anchor,
                            onClose: () => setAnchor(null),
                            anchorOrigin: {
                                vertical: 'top',
                                horizontal: 'center',
                            },
                            transformOrigin: {
                                vertical: 'bottom',
                                horizontal: 'center',
                            },
                        }}
                    >
                        <div style={{display: 'contents' as 'contents'}}>
                            You must agree to the domestic imagery policy to download this file.
                            <div style={{textAlign: 'center', marginTop: '8px'}}>
                                <Link
                                    onClick={() => {
                                        props.openDialog();
                                        setAnchor(null);
                                    }}
                                >
                                    <Typography variant="h6" gutterBottom className={classes.title}>
                                        See domestic imagery policy
                                    </Typography>
                                </Link>
                            </div>
                        </div>
                    </Popover>
                    <IconButton onClick={e => handlePopoverOpen(e)} size="large">
                        <Warning
                            className="qa-ProviderRow-Warning-taskStatus"
                            style={{
                                marginLeft: '10px',
                                fill: colors.running,
                                verticalAlign: 'middle',
                            }}

                        />
                    </IconButton>
                </>;
            }
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
        if (task.hide_download) {
            return null;
        }
        return (
            <MatomoClickTracker
                eventAction="Download Task File"
                eventName={task.result.url}
                eventCategory="Status and Download"
                eventValue={1}
            >
                <CloudDownload
                    className="qa-ProviderRow-CloudDownload-taskLinkEnabled"
                    onClick={() => {
                        handleSingleDownload(task.result.url);
                    }}//
                    key={task.result.url}
                    style={{
                        marginLeft: '10px',
                        cursor: 'pointer',
                        fill: colors.primary,
                        verticalAlign: 'middle',
                    }}
                />
            </MatomoClickTracker>
        );
    }

    function handleToggle() {
        setOpenTable(value => !value);
    }

    function handleSingleDownload(url: string) {
        window.open(url, '_blank');
    }

    function handleProviderClose() {
        setProviderDialogOpen(false);
    }

    function handleProviderOpen() {
        const {providerTask} = props;
        const propsProvider = props.providers.find(x => x.slug === providerTask.provider.slug);
        const providerDesc = propsProvider.service_description;
        setProviderDesc(providerDesc)
        setProviderDialogOpen(true);
    }

    const dataProviderTask = job && job.provider_tasks.find(obj => obj.provider === providerTask.name);
    const propsProvider = props.providers.find(obj => obj.slug === providerTask.provider.slug);

    // If available, get custom zoom levels from DataProviderTask otherwise use Provider defaults.
    let min_zoom = (dataProviderTask) ? dataProviderTask.min_zoom : undefined;
    if (Number.isNaN(min_zoom)) {
        min_zoom = (propsProvider) ? propsProvider.level_from : 0;
    }
    let max_zoom = (dataProviderTask) ? dataProviderTask.max_zoom : undefined;
    if (Number.isNaN(max_zoom)) {
        max_zoom = (propsProvider) ? propsProvider.level_to : 0;
    }

    const licenseData = propsProvider && propsProvider.license ?
        <LicenseRow name={propsProvider.license.name} text={propsProvider.license.text}/>
        :
        null;

    const menuItems = [];

    menuItems.push((
            <MatomoClickTracker
                eventAction="Rerun Export"
                eventName={`Rerun ${props?.job?.name}`}
                eventCategory="Status and Download"
                eventValue={1}
            >
                <MenuItem
                    className="qa-ProviderRow-MenuItem-rerun"
                    key="rerun"
                    disabled={!cancelMenuDisabled}
                    style={{fontSize: '12px'}}
                    onClick={() => {
                        makeRequest()
                    }}
                >
                    Rerun File(s)
                </MenuItem>
            </MatomoClickTracker>
        ), (
            <MatomoClickTracker
                eventAction="Cancel Export"
                eventName={`Cancel ${props?.job?.name}`}
                eventCategory="Status and Download"
                eventValue={1}
            >
                <MenuItem
                    className="qa-ProviderRow-MenuItem-cancel"
                    key="cancel"
                    disabled={cancelMenuDisabled}
                    style={{fontSize: '12px'}}
                    onClick={() => {
                        props.onProviderCancel(providerTask.uid);
                    }}
                >
                    Cancel
                </MenuItem>
            </MatomoClickTracker>
        ), (
            <MatomoClickTracker
                eventAction="Open Dialog"
                eventName={`Open Provider Dialog`}
                eventCategory="Status and Download"
            >
                <MenuItem
                    className="qa-ProviderRow-MenuItem-viewDataSources"
                    key="viewProviderData"
                    style={{fontSize: '12px'}}
                    onClick={handleProviderOpen}
                >
                    View Data Product
                </MenuItem>
            </MatomoClickTracker>
        ), (
            <MatomoClickTracker
                eventAction="Open Dialog"
                eventName={`Open Provider Preview Dialog`}
                eventCategory="Status and Download"
            >
                <MenuItem
                    className="qa-ProviderRow-MenuItem-preview"
                    key="viewPreviews"
                    disabled={!props.providerTask.preview_url}
                    style={{fontSize: '12px'}}
                    onClick={(event) => {
                        props.selectProvider(props.providerTask)
                    }}
                >
                    View Data Preview
                </MenuItem>
            </MatomoClickTracker>
        ),
    );

    let tableData;
    if (openTable) {
        tableData = (
            <Table style={{tableLayout: 'fixed'}}>
                <TableBody
                    className="qa-ProviderRow-TableBody"
                >
                    {licenseData}

                    {/* Preprocessing Info */}
                    <TableRow
                        className="qa-ProviderRow-TableRow-task"
                    >
                        <TableCell classes={{root: classes.headingInsetColumn}}/>

                        <TableCell
                            className="qa-ProviderRow-TableCell-processingInfo"
                            classes={{root: classes.headingColumn}}
                        >
                            Preprocessing Information
                        </TableCell>
                        <TableCell classes={{root: classes.sizeColumn}}/>
                        <TableCell classes={{root: classes.estimatedFinishColumn}}/>
                        <TableCell classes={{root: classes.taskStatusColumn}}/>
                        <TableCell classes={{root: classes.menuColumn}}/>
                        <TableCell classes={{root: classes.arrowColumn}}/>
                    </TableRow>

                    <TableRow
                        className="qa-ProviderRow-TableRow-task"
                    >
                        <TableCell classes={{root: classes.insetColumn, body: classes.nestedRows}}/>

                        <TableCell
                            className="qa-ProviderRow-TableCell-zoomLevels"
                            classes={{root: classes.taskLinkColumn, body: classes.nestedRows}}
                        >
                            Zoom Levels {min_zoom} - {max_zoom}
                        </TableCell>
                        <TableCell classes={{root: classes.sizeColumn, body: classes.nestedRows}}/>
                        <TableCell classes={{root: classes.estimatedFinishColumn, body: classes.nestedRows}}/>
                        <TableCell classes={{root: classes.taskStatusColumn, body: classes.nestedRows}}/>
                        <TableCell classes={{root: classes.menuColumn, body: classes.nestedRows}}/>
                        <TableCell classes={{root: classes.arrowColumn, body: classes.nestedRows}}/>
                    </TableRow>
                    {preprocessingTasks.map(task => (
                        <TableRow
                            className="qa-ProviderRow-TableRow-task"
                            key={task.uid}
                        >
                            <TableCell classes={{root: classes.insetColumn, body: classes.nestedRows}}/>
                            <TableCell
                                className="qa-ProviderRow-TableCell-taskLinks"
                                classes={{root: classes.taskLinkColumn, body: classes.nestedRows}}
                            >
                                {getTaskLink(task)}
                                {getTaskDownloadIcon(task)}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-size"
                                classes={{root: classes.sizeColumn, body: classes.nestedRows}}
                            >
                                {(task.hide_download || task.result == null) ? null : task.result.size}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-estimatedFinish"
                                classes={{root: classes.estimatedFinishColumn, body: classes.nestedRows}}
                                style={{fontSize: '.85em'}}
                            >
                                {getEstimatedFinish(task)}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-status"
                                classes={{root: classes.taskStatusColumn, body: classes.nestedRows}}
                            >
                                {getTaskStatus(task)}
                            </TableCell>
                            <TableCell classes={{root: classes.menuColumn, body: classes.nestedRows}}/>
                            <TableCell classes={{root: classes.arrowColumn, body: classes.nestedRows}}/>
                        </TableRow>
                    ))}

                    {/* Downloads */}
                    <TableRow
                        className="qa-ProviderRow-TableRow-task"
                    >
                        <TableCell classes={{root: classes.headingInsetColumn}}/>

                        <TableCell
                            className="qa-ProviderRow-TableCell-downloads"
                            classes={{root: classes.headingColumn}}
                        >
                            Downloads
                        </TableCell>
                        <TableCell classes={{root: classes.sizeColumn}}/>
                        <TableCell classes={{root: classes.estimatedFinishColumn}}/>
                        <TableCell classes={{root: classes.taskStatusColumn}}/>
                        <TableCell classes={{root: classes.menuColumn}}/>
                        <TableCell classes={{root: classes.arrowColumn}}/>
                    </TableRow>
                    {exportTasks.map(task => (
                        <TableRow
                            className="qa-ProviderRow-TableRow-task"
                            key={task.uid}
                        >
                            <TableCell classes={{root: classes.insetColumn}}/>
                            <TableCell
                                className="qa-ProviderRow-TableCell-taskLinks"
                                classes={{root: classes.taskLinkColumn}}
                            >
                                {getTaskLink(task)}
                                {getTaskDownloadIcon(task)}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-size"
                                classes={{root: classes.sizeColumn}}
                            >
                                {(task.hide_download || task.result == null) ? null : task.result.size}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-estimatedFinish"
                                classes={{root: classes.estimatedFinishColumn}}
                                style={{fontSize: '.85em'}}
                            >
                                {getEstimatedFinish(task)}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-status"
                                classes={{root: classes.taskStatusColumn}}
                            >
                                {getTaskStatus(task)}
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

    // @ts-ignore
    return (
        <div>
            <Table
                key={providerTask.uid}
                className="qa-ProviderRow-Table"
                style={{width: '100%', backgroundColor: props.backgroundColor, tableLayout: 'fixed'}}
            >
                <TableHead
                    className="qa-ProviderRow-TableHead"
                >
                    <TableRow className="qa-ProviderRow-TableRow-provider">
                        <TableCell
                            className="qa-ProviderRow-TableCell-providerName"
                            classes={{root: classes.providerColumn}}
                        >
                            {providerTask.name}
                        </TableCell>
                        <TableCell
                            className="qa-ProviderRow-TableCell-fileSize"
                            classes={{root: classes.fileSizeColumn}}
                        >
                            {fileSize == null ? '' : `${fileSize} MB`}
                        </TableCell>
                        <TableCell
                            className="qa-ProviderRow-TableCell-estimatedFinish"
                            classes={{root: classes.estimatedFinishColumn}}
                        >
                            {getLastEstimatedFinish(exportTasks)}
                        </TableCell>
                        <TableCell
                            className="qa-ProviderRow-TableCell-providerStatus"
                            classes={{root: classes.providerStatusColumn}}
                        >
                            {getProviderStatus(props.providerTask)}
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
                                show={providerDialogOpen}
                                title={providerTask.name}
                                onClose={handleProviderClose}
                            >
                                <div>Zoom Levels {min_zoom} - {max_zoom}</div>
                                {providerDesc}
                            </BaseDialog>
                        </TableCell>
                        <TableCell
                            className="qa-ProviderRow-TableCell-arrows"
                            classes={{root: classes.arrowColumn}}
                        >
                            <IconButton
                                className="qa-open-arrow"
                                disableTouchRipple
                                onClick={handleToggle}
                                size="large">
                                {openTable ?
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


export default withWidth()(withTheme((withStyles(jss)(ProviderRow))));
