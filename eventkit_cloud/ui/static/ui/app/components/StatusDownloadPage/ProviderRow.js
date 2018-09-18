import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
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

export class ProviderRow extends Component {
    constructor(props) {
        super(props);
        this.handleSingleDownload = this.handleSingleDownload.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleProviderOpen = this.handleProviderOpen.bind(this);
        this.handleProviderClose = this.handleProviderClose.bind(this);
        this.state = {
            openTable: false,
            selectedRows: { },
            fileSize: null,
            providerDesc: '',
            providerDialogOpen: false,
        };
    }

    componentWillMount() {
        // set state on the provider
        const rows = {};
        const { uid } = this.props.provider;
        rows[uid] = false;
        this.setState({ selectedRows: rows });
    }

    componentWillReceiveProps(nextProps) {
        let fileSize = 0.000;
        nextProps.provider.tasks.forEach((task) => {
            if (task.result != null) {
                if (task.display !== false && task.result.size) {
                    const textReplace = task.result.size.replace(' MB', '');
                    const number = textReplace;
                    fileSize = Number(fileSize) + Number(number);
                    this.setState({ fileSize: fileSize.toFixed(3) });
                }
            }
        });

        if (nextProps.selectedProviders !== this.state.selectedRows) {
            this.setState({ selectedRows: nextProps.selectedProviders });
        }
    }

    getTextFontSize() {
        const { width } = this.props;
        if (!isWidthUp('md', width)) {
            return '12px';
        }
        return '14px';
    }

    getTaskStatus(task) {
        const { colors } = this.props.theme.eventkit;
        switch (task.status) {
            case 'SUCCESS':
                return (
                    <Check
                        className="qa-ProviderRow-Check-taskStatus"
                        style={{ fill: colors.success, verticalAlign: 'middle', marginBottom: '2px' }}
                    />
                );
            case 'FAILED':
                return <TaskError task={task} />;
            case 'PENDING':
                return 'WAITING';
            case 'RUNNING':
                return (
                    <span className="qa-ProviderRow-span-taskStatus">
                        <LinearProgress variant="determinate" value={task.progress} />
                        {task.progress === 100 ? '' : `${task.progress} %`}
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

    getProviderStatus(provider) {
        const { colors } = this.props.theme.eventkit;

        switch (provider.status) {
            case 'COMPLETED':
                return (
                    <Check
                        className="qa-ProviderRow-Check-providerStatus"
                        style={{ fill: colors.success, verticalAlign: 'middle', marginBottom: '2px' }}
                    />
                );
            case 'INCOMPLETE':
                return <ProviderError provider={provider} key={provider.uid} />;
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
                                fill: colors.warning,
                                verticalAlign: 'bottom',
                            }}
                        />
                    </span>
                );
            default:
                return '';
        }
    }

    getTaskLink(task) {
        const { colors } = this.props.theme.eventkit;

        if (!Object.prototype.hasOwnProperty.call(task.result, 'url')) {
            return (
                <span
                    className="qa-ProviderRow-span-taskLinkDisabled"
                    style={{ color: colors.grey }}
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
                onClick={() => { this.handleSingleDownload(task.result.url); }}
                onKeyPress={() => { this.handleSingleDownload(task.result.url); }}
                style={{ color: colors.primary, cursor: 'pointer' }}
            >
                {task.name}
            </span>
        );
    }

    getTaskDownloadIcon(task) {
        const { colors } = this.props.theme.eventkit;

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
                onClick={() => { this.handleSingleDownload(task.result.url); }}//
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

    getTableCellWidth() {
        if (!isWidthUp('md', this.props.width)) {
            return '80px';
        }
        return '120px';
    }

    handleToggle() {
        this.setState({ openTable: !this.state.openTable });
    }

    handleSingleDownload(url) {
        window.open(url, '_blank');
    }

    handleProviderClose() {
        this.setState({ providerDialogOpen: false });
    }

    handleProviderOpen() {
        const { provider } = this.props;
        const propsProvider = this.props.providers.find(x => x.slug === provider.slug);
        const providerDesc = propsProvider.service_description;
        this.setState({ providerDesc, providerDialogOpen: true });
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const textFontSize = this.getTextFontSize();
        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = '50px';

        const styles = {
            sizeColumnn: {
                width: tableCellWidth,
                paddingRight: '0px',
                paddingLeft: '0px',
                textAlign: 'center',
                fontSize: textFontSize,
            },
            taskStatusColumn: {
                width: tableCellWidth,
                paddingRight: '10px',
                paddingLeft: '10px',
                textAlign: 'center',
                fontSize: textFontSize,
                fontWeight: 'bold',
            },
            emptyTaskColumn: {
                width: '20px',
                paddingRight: '0px',
                paddingLeft: '0px',
                textAlign: 'center',
                fontSize: textFontSize,
            },
            providerColumn: {
                paddingRight: '12px',
                paddingLeft: '12px',
                whiteSpace: 'normal',
                color: colors.black,
                fontWeight: 'bold',
                fontSize: textFontSize,
            },
            fileSizeColumn: {
                width: tableCellWidth,
                paddingRight: '0px',
                paddingLeft: '0px',
                textAlign: 'center',
                color: colors.black,
                fontSize: textFontSize,
            },
            providerStatusColumn: {
                width: tableCellWidth,
                paddingRight: '0px',
                paddingLeft: '0px',
                textAlign: 'center',
                color: colors.black,
                fontSize: textFontSize,
            },
            menuColumn: {
                width: '36px',
                paddingRight: '0px',
                paddingLeft: '0px',
                textAlign: 'right',
            },
            arrowColumn: {
                width: toggleCellWidth,
                paddingRight: '0px',
                paddingLeft: '0px',
                textAlign: 'left',
            },
        };

        const { provider } = this.props;

        const propsProvider = this.props.providers.find(x => x.slug === provider.slug);
        const licenseData = propsProvider && propsProvider.license ?
            <LicenseRow name={propsProvider.license.name} text={propsProvider.license.text} />
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
                style={{ fontSize: '12px' }}
                onClick={() => { this.props.onProviderCancel(provider.uid); }}
            >
                Cancel
            </MenuItem>,
            <MenuItem
                className="qa-ProviderRow-MenuItem-viewDataSources"
                key="viewProviderData"
                style={{ fontSize: '12px' }}
                onClick={this.handleProviderOpen}
            >
                View Data Source
            </MenuItem>,
        );

        const tasks = provider.tasks.filter(task => (task.display !== false));

        let tableData;
        if (this.state.openTable) {
            tableData = (
                <Table style={{ tableLayout: 'fixed' }}>
                    <TableBody
                        className="qa-ProviderRow-TableBody"
                    >
                        {licenseData}
                        {tasks.map(task => (
                            <TableRow
                                className="qa-ProviderRow-TableRow-task"
                                key={task.uid}
                            >
                                <TableCell style={{ paddingRight: '12px', paddingLeft: '12px', width: '12px' }} />
                                <TableCell
                                    className="qa-ProviderRow-TableCell-taskLinks"
                                    style={{ paddingRight: '12px', paddingLeft: '0px', fontSize: textFontSize }}
                                >
                                    {this.getTaskLink(task)}
                                    {this.getTaskDownloadIcon(task)}
                                </TableCell>
                                <TableCell
                                    className="qa-ProviderRow-TableCell-size"
                                    style={styles.sizeColumnn}
                                >
                                    {task.result == null ? '' : task.result.size}
                                </TableCell>
                                <TableCell
                                    className="qa-ProviderRow-TableCell-status"
                                    style={styles.taskStatusColumn}
                                >
                                    {this.getTaskStatus(task)}
                                </TableCell>
                                <TableCell style={styles.emptyTaskColumn} />
                                <TableCell style={{ ...styles.emptyTaskColumn, width: toggleCellWidth }} />
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
                    style={{ width: '100%', backgroundColor: this.props.backgroundColor, tableLayout: 'fixed' }}
                >
                    <TableHead
                        className="qa-ProviderRow-TableHead"
                    >
                        <TableRow className="qa-ProviderRow-TableRow-provider">
                            <TableCell
                                className="qa-ProviderRow-TableCell-providerName"
                                style={styles.providerColumn}
                            >
                                {provider.name}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-fileSize"
                                style={styles.fileSizeColumn}
                            >
                                {this.state.fileSize == null ? '' : `${this.state.fileSize} MB`}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-providerStatus"
                                style={styles.providerStatusColumn}
                            >
                                {this.getProviderStatus(this.props.provider)}
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-menu"
                                style={styles.menuColumn}
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
                                    {this.state.providerDesc}
                                </BaseDialog>
                            </TableCell>
                            <TableCell
                                className="qa-ProviderRow-TableCell-arrows"
                                style={styles.arrowColumn}
                            >
                                <IconButton
                                    disableTouchRipple
                                    onClick={this.handleToggle}
                                >
                                    {this.state.openTable ?
                                        <ArrowUp className="qa-ProviderRow-ArrowUp" color="primary" />
                                        :
                                        <ArrowDown className="qa-ProviderRow-ArrowDown" color="primary" />
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

ProviderRow.defaultProps = {
    selectedProviders: {},
};

ProviderRow.propTypes = {
    provider: PropTypes.object.isRequired,
    selectedProviders: PropTypes.object,
    onProviderCancel: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    backgroundColor: PropTypes.string.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

export default
@withWidth()
@withTheme()
class Default extends ProviderRow {}
