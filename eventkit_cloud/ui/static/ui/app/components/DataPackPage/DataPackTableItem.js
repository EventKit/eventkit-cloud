import React, {PropTypes, Component} from 'react'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import {GridList} from 'material-ui/GridList'
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import AlertError from 'material-ui/svg-icons/alert/error';
import SocialPerson from 'material-ui/svg-icons/social/person';
import SocialGroup from 'material-ui/svg-icons/social/group';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import moment from 'moment';

export class DataPackTableItem extends Component {
    constructor(props) {
        super(props);
        // this.handleResize = this.handleResize.bind(this);
        // this.state = {
        //     windowWidth: window.innerWidth
        // }
    }

    // componentWillMount() {
    //     this.handleResize();
    //     window.addEventListener('resize', this.handleResize);
    // }

    // componentWillUnmount() {
    //     window.removeEventListener('resize', this.handleResize);
    // }

    // handleResize() {
    //     this.setState({windowWidth: window.innerWidth});
    // }


    render() {
        const styles = {
            headerColumn: {paddingLeft: '0px',paddingRight: '0px',textAlign: 'center',},
            rowColumn: {paddingLeft: '0px',paddingRight: '0px',textAlign: 'center'},
            dropDownArrow: {
                verticalAlign: 'middle',
                marginBottom: '2px',
                fill: '#4498c0',
            }
        };

        return (
            <TableRow>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left'}}>{this.props.run.job.name}</TableRowColumn>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left'}}>{this.props.run.job.event}</TableRowColumn>
                <TableRowColumn style={{width: '98px', padding: '0px 0px 0px 10px', textAlign: 'left'}}>{moment(this.props.run.started_at).format('YYYY-MM-DD')}</TableRowColumn>
                <TableRowColumn style={{width: '65px', padding: '0px 0px 0px 0px', textAlign: 'center'}}>
                    {this.props.run.status == "SUBMITTED" ?
                        <NotificationSync/>
                        :
                        this.props.run.status == 'INCOMPLETE' ? 
                            <AlertError/>
                            :
                            null
                    }
                </TableRowColumn>
                <TableRowColumn style={{width: '100px' ,padding: '0px 0px 0px 0px',textAlign: 'center'}}><SocialPerson/></TableRowColumn>
                <TableRowColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left'}}>My DataPack</TableRowColumn>
                <TableRowColumn style={{paddingRight: '10px', paddingLeft: '0px', width: '30px'}}><NavigationMoreVert style={{width: '20px'}}/></TableRowColumn>
            </TableRow>
        )
    }
}

DataPackTableItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
};

export default DataPackTableItem;

