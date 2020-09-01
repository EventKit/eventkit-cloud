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
import ErrorDialog from './ErrorDialog';
import BaseDialog from '../Dialog/BaseDialog';
import LicenseRow from './LicenseRow';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import moment from 'moment';
import {useEffect, useState} from "react";
import {rerunExportPartial} from '../../actions/datacartActions';
import {useAsyncRequest} from "../../utils/hooks/api";
import {getCookie} from "../../utils/generic";
import {connect} from "react-redux";
import ProviderTaskErrorDialog from "./ProviderTaskErrorDialog";
import {useDataCartContext} from "./context/DataCart";

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
    providerTask: Eventkit.ProviderTask;
    job: Eventkit.Job;
    selectProvider: (providerTask: Eventkit.ProviderTask) => void;
    onProviderCancel: (uid: string) => void;
    providers: Eventkit.Provider[];
    backgroundColor: string;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    rerunExportPartial: () => void;
    classes: { [className: string]: string };
}

export function ProviderRow(props: Props) {

    const {classes, providerTask, job} = props;
    const {setFetching} = useDataCartContext();

    const [openTable, setOpenTable] = useState(false);
    const [fileSize, setFileSize] = useState(getFileSize(props.providerTask.tasks));
    const [providerDesc, setProviderDesc] = useState('');
    const [providerDialogOpen, setProviderDialogOpen] = useState(false);

    const cancelMenuDisabled = !(providerTask.status === 'PENDING' || providerTask.status === 'RUNNING');

    const [, requestCall] = useAsyncRequest();
    const makeRequest = () => {
        if (!cancelMenuDisabled) {
            return;
        }
        requestCall({
            url: `/api/jobs/${props.job.uid}/run_providers`,
            method: 'post',
            data: {
                data_provider_slugs: [props.providerTask.provider.slug]
            },
            headers: {'X-CSRFToken': getCookie('csrftoken')},
        }).then(() => setFetching());
    };

    useEffect(() => {
        setFileSize(getFileSize(props.providerTask.tasks));
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
                    handleSingleDownload(task.result.url);
                }}
                onKeyPress={() => {
                    handleSingleDownload(task.result.url);
                }}
                style={{color: colors.primary, cursor: 'pointer'}}
            >
                {task.name}
            </span>
        );
    }

    // TODO: extract functions like this so they can be tested in isolation.
    function getTaskDownloadIcon(task: Eventkit.Task) {
        const {colors} = props.theme.eventkit;

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

    menuItems.push(
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
        </MenuItem>,
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
        </MenuItem>,
        <MenuItem
            className="qa-ProviderRow-MenuItem-viewDataSources"
            key="viewProviderData"
            style={{fontSize: '12px'}}
            onClick={handleProviderOpen}
        >
            View Data Source
        </MenuItem>,
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
        </MenuItem>,
    );

    const tasks = providerTask.tasks.filter(task => (task.display !== false));

    let tableData;
    if (openTable) {
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
                                {getTaskLink(task)}
                                {getTaskDownloadIcon(task)}
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
                            {getLastEstimatedFinish(tasks)}
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
                            >
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


function mapDispatchToProps(dispatch) {
    return {
        rerunExportPartial: () => (
            dispatch(rerunExportPartial())
        ),
    };
}


export default withWidth()(withTheme((withStyles(jss)(connect(null, mapDispatchToProps)(ProviderRow)))));
