import React, {PropTypes} from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import * as utils from '../../utils/sortUtils';

export class DataPackSortDropDown extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const styles = {
            dropDown: {
                height: '30px',
                lineHeight: '35px',
                float: 'right',
                minWidth: '100px'
            },
            item: {
                fontSize: '12px',
            },
            icon: {
                height: '30px',
                width: '30px',
                padding: '0px',
                fill: '#4498c0',
                right: '5px',
            },
            label: {
                lineHeight: '30px', 
                color: '#4498c0', 
                paddingLeft: '5px', 
                paddingRight: '30px'},
            list: {
                paddingTop: '5px', 
                paddingBottom: '0px'},
            selectedItem: {
                color: '#4498c0'
            },
            underline: {
                display: 'none'
            }
        };

        return (
            <DropDownMenu
                autoWidth={false}
                style={styles.dropDown}
                iconStyle={styles.icon}
                listStyle={styles.list}
                labelStyle={styles.label} 
                value={this.props.value}
                onChange={this.props.handleChange}
                underlineStyle={styles.underline}
                selectedMenuItemStyle={styles.selectedItem}
            >
                <MenuItem style={styles.item} value={utils.orderNewest} primaryText={"Newest"}/>
                <MenuItem style={styles.item} value={utils.orderOldest} primaryText={"Oldest "}/>
                <MenuItem style={styles.item} value={utils.orderAZ} primaryText={"Name (A-Z)"}/>
                <MenuItem style={styles.item} value={utils.orderZA} primaryText={"Name (Z-A)"}/>
            </DropDownMenu>
        );
    }
}


DataPackSortDropDown.propTypes = {
    handleChange: PropTypes.func.isRequired,
    value: PropTypes.func.isRequired
};

export default DataPackSortDropDown;
