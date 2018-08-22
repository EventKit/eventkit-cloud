import PropTypes from 'prop-types';
import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import DropDownMenu from '../common/DropDownMenu';

export class DataPackOwnerSort extends React.Component {
    constructor(props) {
        super(props);
        this.handleAll = this.handleAll.bind(this);
        this.handleOwner = this.handleOwner.bind(this);
    }

    handleAll() {
        this.props.handleChange('all');
    }

    handleOwner() {
        this.props.handleChange(this.props.owner);
    }

    render() {
        const styles = {
            item: {
                fontSize: '12px',
                padding: '0px 24px',
                height: '32px',
            },

        };

        const { value, owner } = this.props;

        const text = value === 'all' ? 'All DataPacks' : 'My DataPacks';

        return (
            <DropDownMenu
                className="qa-DataPackOwnerSort-Menu"
                value={text}
            >
                <MenuItem
                    className="qa-DataPackOwnerSort-MenuItem-allDatapacks"
                    style={styles.item}
                    selected={value === 'all'}
                    onClick={this.handleAll}
                >
                    All DataPacks
                </MenuItem>
                <MenuItem
                    className="qa-DataPackOwnerSort-Menuitem-myDatapacks"
                    style={styles.item}
                    selected={value === owner}
                    onClick={this.handleOwner}
                >
                    My DataPacks
                </MenuItem>
            </DropDownMenu>
        );
    }
}


DataPackOwnerSort.propTypes = {
    value: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    owner: PropTypes.string.isRequired,
};

export default DataPackOwnerSort;
