import * as React from 'react';
import Drawer from '@material-ui/core/Drawer';
import PermissionFilter from './PermissionsFilter';
import StatusFilter from './StatusFilter';
import DateFilter from './DateFilter';
import FilterHeader from './FilterHeader';
import CustomScrollbar from '../CustomScrollbar';
import ProvidersFilter from './ProvidersFilter';

export interface Props {
    onFilterApply: (state: State) => void;
    onFilterClear: () => void;
    open: boolean;
    providers: Eventkit.Provider[];
}

export interface State {
    permissions: Eventkit.Permissions;
    minDate: null | string;
    maxDate: null | string;
    status: {
        completed: boolean;
        incomplete: boolean;
        submitted: boolean;
    };
    providers: { [slug: string]: boolean };
}

export class FilterDrawer extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.getDefaultState = this.getDefaultState.bind(this);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
        this.handleProvidersChange = this.handleProvidersChange.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleMinDate = this.handleMinDate.bind(this);
        this.handleMaxDate = this.handleMaxDate.bind(this);
        this.state = this.getDefaultState();
    }

    private getDefaultState() {
        return {
            permissions: {
                value: '' as Eventkit.Permissions.Visibility,
                groups: {},
                members: {},
            },
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            providers: {},
        };
    }

    private handleFilterApply() {
        this.props.onFilterApply(this.state);
    }

    private handleFilterClear() {
        this.setState(this.getDefaultState());
        this.props.onFilterClear();
    }

    private handlePermissionsChange(permissions: Eventkit.Permissions) {
        this.setState({ permissions: { ...this.state.permissions, ...permissions } });
    }

    private handleStatusChange(stateChange: State) {
        let { status } = this.state;
        status = Object.assign(status, stateChange);
        this.setState({ status });
    }

    private handleProvidersChange(slug: string, isSelected: boolean) {
        const { providers } = this.state;
        if (isSelected) {
            providers[slug] = true;
        } else {
            delete providers[slug];
        }

        this.setState({ providers });
    }

    private handleMinDate(date: string) {
        this.setState({ minDate: date });
    }

    private handleMaxDate(date: string) {
        this.setState({ maxDate: date });
    }

    render() {
        const styles = {
            containerStyle: {
                backgroundColor: '#fff',
                top: '221px',
                height: 'calc(100vh - 221px)',
                overflowY: 'hidden' as 'hidden',
                overflowX: 'hidden' as 'hidden',
                width: '250px',
                visibility: this.props.open ? 'visible' as 'visible' : 'hidden' as 'hidden',
            },
        };

        return (
            <Drawer
                className="qa-FilterDrawer-Drawer"
                variant="persistent"
                anchor="right"
                open={this.props.open}
                PaperProps={{ style: styles.containerStyle }}
            >
                <CustomScrollbar>
                    <FilterHeader
                        onApply={this.handleFilterApply}
                        onClear={this.handleFilterClear}
                    />
                    <PermissionFilter
                        onChange={this.handlePermissionsChange}
                        permissions={this.state.permissions}
                    />
                    <StatusFilter
                        onChange={this.handleStatusChange}
                        completed={this.state.status.completed}
                        submitted={this.state.status.submitted}
                        incomplete={this.state.status.incomplete}
                    />
                    <DateFilter
                        onMinChange={this.handleMinDate}
                        onMaxChange={this.handleMaxDate}
                        minDate={this.state.minDate}
                        maxDate={this.state.maxDate}
                    />
                    <ProvidersFilter
                        onChange={this.handleProvidersChange}
                        providers={this.props.providers}
                        selected={this.state.providers}
                    />
                </CustomScrollbar>
            </Drawer>
        );
    }
}

export default FilterDrawer;
