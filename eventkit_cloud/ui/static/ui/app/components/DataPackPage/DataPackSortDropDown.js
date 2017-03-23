import React, {PropTypes} from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import * as utils from '../../utils/sortUtils';

export class DataPackSortDropDown extends React.Component {

    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.state = {
            labelFontSize: '16px',
            itemFontSize: '14px',
            labelLeftPadding: '24px',
            labelRightPadding: '50px',
        }
    }

    componentWillMount() {
        this.screenSizeUpdate();
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        if(window.innerWidth <= 575) {
            this.setState({labelFontSize: '12px'});
            this.setState({itemFontSize: '10px'});
            this.setState({labelLeftPadding: '16px'});
            this.setState({labelRightPadding: '32px'});
        }
        else if (window.innerWidth <= 767) {
            this.setState({labelFontSize: '13px'});
            this.setState({itemFontSize: '11px'});
            this.setState({labelLeftPadding: '18px'});
            this.setState({labelRightPadding: '34px'});
        }
        else if (window.innerWidth <= 991) {
            this.setState({labelFontSize: '14px'});
            this.setState({itemFontSize: '12px'});
            this.setState({labelLeftPadding: '20px'});
            this.setState({labelRightPadding: '36px'});
        }
        else if(window.innerWidth <= 1199) {
            this.setState({labelFontSize: '15px'});
            this.setState({itemFontSize: '13px'});
            this.setState({labelLeftPadding: '22px'});
            this.setState({labelRightPadding: '38px'});
        }
        else {
            this.setState({labelFontSize: '16px'});
            this.setState({itemFontSize: '14px'});
            this.setState({labelLeftPadding: '24px'});
            this.setState({labelRightPadding: '40px'});
        }
    }

    render() {
        const styles = {
            dropDown: {
                height: '30px',
                lineHeight: '30px',
                float: 'right',
            },
            item: {
                fontSize: this.state.itemFontSize,
            },
            icon: {
                height: '30px',
                width: '30px',
                padding: '0px',
                fill: '#4498c0',
                right: '2px',
            },
            label: {
                lineHeight: '30px', 
                color: '#4498c0', 
                paddingLeft: this.state.labelLeftPadding,
                paddingRight: this.state.labelRightPadding,
                fontSize: this.state.labelFontSize
            },
            list: {
                paddingTop: '5px', 
                paddingBottom: '0px',
            },
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
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={utils.orderNewest} primaryText={"Newest"}/>
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={utils.orderOldest} primaryText={"Oldest "}/>
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={utils.orderAZ} primaryText={"Name (A-Z)"}/>
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={utils.orderZA} primaryText={"Name (Z-A)"}/>
            </DropDownMenu>
        );
    }
}


DataPackSortDropDown.propTypes = {
    handleChange: PropTypes.func.isRequired,
    value: PropTypes.func.isRequired
};

export default DataPackSortDropDown;
