import PropTypes from 'prop-types';
import React from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

export class DataPackOwnerSort extends React.Component {
    render() {
        const styles = {
            dropDown: {
                height: '30px',
                lineHeight: '35px',
                marginRight: '10px',
            },
            item: {
                fontSize: window.innerWidth > 575 ? '12px' : '11px',
            },
            icon: {
                padding: 0,
                fill: '#4498c0',
                position: 'inline-block',
                verticalAlign: 'top',
                top: 0,
                right: 0,
                width: 20,
                height: 24,
                margin: 3,
            },
            label: {
                lineHeight: '30px',
                color: '#4498c0',
                paddingLeft: 0,
                paddingRight: 32,
                height: '30px',
                display: 'inline-block',
                padding: 0,
                fontSize: window.innerWidth > 575 ? '14px' : '12px',
            },
            list: {
                paddingTop: '5px',
                paddingBottom: '0px',
            },
            selectedItem: {
                color: '#4498c0',
            },
            underline: {
                borderTopColor: '#4498c0',
                margin: '0px',
            },
        };

        return (
            <DropDownMenu
                className="qa-DataPackOwnerSort-DropDownMenu"
                style={styles.dropDown}
                labelStyle={styles.label}
                iconStyle={styles.icon}
                listStyle={styles.list}
                selectedMenuItemStyle={styles.selectedItem}
                underlineStyle={styles.underline}
                value={this.props.value}
                onChange={this.props.handleChange}
            >
                <MenuItem
                    className="qa-DataPackOwnerSort-MenuItem-allDatapacks"
                    style={styles.item}
                    value="all"
                    primaryText="All DataPacks"
                />
                <MenuItem
                    className="qa-DataPackOwnerSort-Menuitem-myDatapacks"
                    style={styles.item}
                    value={this.props.owner}
                    primaryText="My DataPacks"
                />
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
