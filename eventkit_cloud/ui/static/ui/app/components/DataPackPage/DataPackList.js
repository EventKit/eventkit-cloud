import React, {PropTypes, Component} from 'react'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import {GridList} from 'material-ui/GridList'
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import AlertError from 'material-ui/svg-icons/alert/error';
import SocialPerson from 'material-ui/svg-icons/social/person';
import SocialGroup from 'material-ui/svg-icons/social/group';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import DataPackListItem from './DataPackListItem';
import DataPackTableItem from './DataPackTableItem';


export class DataPackList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: '5px',
                marginRight: '5px',
                paddingBottom: '10px'
            },
            headerColumn: {paddingLeft: '0px',paddingRight: '0px',textAlign: 'center',},
            rowColumn: {paddingLeft: '0px',paddingRight: '0px',textAlign: 'center'},
            dropDownArrow: {
                verticalAlign: 'middle',
                marginBottom: '2px',
                fill: '#4498c0',
            }
        };

        return (
            <div style={styles.root}>
            {window.innerWidth < 768 ?
                <GridList
                    cellHeight={'auto'}
                    cols={1}
                    padding={0}
                    style={{width: window.innerWidth - 10, minWidth: '360px'}}
                >   
                    {this.props.runs.map((run) => (
                        <DataPackListItem 
                            run={run} 
                            user={this.props.user} 
                            key={run.uid}
                            onRunDelete={this.props.onRunDelete}/>
                    ))}
                </GridList>
            :
                <Table height={`${window.innerHeight - 297}px`} selectable={false}>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false} style={{height: '50px'}}>
                        <TableRow style={{marginLeft: '12px', paddingRight: '6px', color: '#fff', height: '50px'}}>
                            <TableHeaderColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'}}>Name<NavigationArrowDropDown style={styles.dropDownArrow}/></TableHeaderColumn>
                            <TableHeaderColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'}}>Event<NavigationArrowDropDown style={styles.dropDownArrow}/></TableHeaderColumn>
                            <TableHeaderColumn style={{width: '98px', padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'}}>Date Addded<NavigationArrowDropDown style={styles.dropDownArrow}/></TableHeaderColumn>
                            <TableHeaderColumn style={{width: '65px' ,padding: '0px 0px 0px 10px', textAlign: 'center', height: 'inherit'}}>Status<NavigationArrowDropDown style={styles.dropDownArrow}/></TableHeaderColumn>
                            <TableHeaderColumn style={{width: '100px', padding: '0px 0px 0px 10px', textAlign: 'center', height: 'inherit'}}>Permissions<NavigationArrowDropDown style={styles.dropDownArrow}/></TableHeaderColumn>
                            <TableHeaderColumn style={{padding: '0px 0px 0px 10px', textAlign: 'left', height: 'inherit'}}>Owner<NavigationArrowDropDown style={styles.dropDownArrow}/></TableHeaderColumn>
                            <TableHeaderColumn style={{padding: '0px', width: '30px', height: 'inherit'}}></TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {this.props.runs.map((run) => (
                            <DataPackTableItem 
                                run={run} 
                                user={this.props.user} 
                                key={run.uid}
                                onRunDelete={this.props.onRunDelete}
                            />
                        ))}
                    </TableBody>
                </Table>
            }
            </div>
        )
    }
}

DataPackList.propTypes = {
    runs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
};

export default DataPackList;

