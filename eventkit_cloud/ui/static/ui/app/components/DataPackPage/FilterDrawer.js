import React, {PropTypes} from 'react';
import Drawer from 'material-ui/Drawer';
import PermissionFilter from './PermissionsFilter';
import StatusFilter from './StatusFilter';
import DateFilter from './DateFilter';
import FilterHeader from './FilterHeader';
import CustomScrollbar from '../CustomScrollbar';

export class FilterDrawer extends React.Component {

    constructor(props) {
        super(props);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleMinDate = this.handleMinDate.bind(this);
        this.handleMaxDate = this.handleMaxDate.bind(this);
        this.state = {
            published: null,
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                submitted: false,
                incomplete: false,
            },
        }
    }

    handleFilterApply = () => {
        this.props.onFilterApply(this.state);
    }

    handleFilterClear = () => {
        this.setState({
            published: null,
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
        });
        this.props.onFilterClear();
    }

    handlePermissionsChange = (event, value) => {
        this.setState({published: value});
    }

    handleStatusChange = (stateChange) => {
        let status = this.state.status;
        status = Object.assign(status, stateChange)
        this.setState({status: status});
    }

    handleMinDate = (e, date) => {
         this.setState({minDate: date});
    }

    handleMaxDate = (e, date) => {
        this.setState({maxDate: date});
    }

    render() { 
        const styles = {
            containerStyle: {
                backgroundColor: '#fff',
                top: '221px',
                height: window.innerHeight - 221,
                overflowY: 'hidden',
                overflowX: 'hidden'
            },
        };

        return (
            <Drawer 
                width={200} 
                openSecondary={true} 
                open={this.props.open}
                containerStyle={styles.containerStyle}
            >
                <CustomScrollbar>
                    <FilterHeader
                        onApply={this.handleFilterApply}
                        onClear={this.handleFilterClear}
                    />
                    <PermissionFilter
                        onChange={this.handlePermissionsChange}
                        valueSelected={this.state.published}
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
                </CustomScrollbar>
            </Drawer>
        );
    }
}

FilterDrawer.propTypes = {
    onFilterApply: React.PropTypes.func.isRequired,
    onFilterClear: React.PropTypes.func.isRequired,
    open: React.PropTypes.bool.isRequired,
};

export default FilterDrawer;
