import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import ol from 'openlayers'
import styles from './SearchAOIToolbar.css'
import DrawControl from './openlayers.DrawControl.js'
import AutoComplete from 'material-ui/AutoComplete'
import { FormGroup, FormControl } from 'react-bootstrap';

export default class SearchAOIToolbar extends Component {

    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this);

        this.state = {
            value: '',
        }
    }

    handleChange(e) {
        this.setState({value: e.target.value}, function() {
            console.log(this.state.value);
        });
    }

    render() {

        const searchbarStyles = {
            searchbar: {
                backgroundColor: '#fff',
                width: '95%',
            },
        }

        return (
            <div className={styles.searchbarDiv}>
                <i className={'fa fa-search'}/>
                <FormGroup validationState={null} controlId={'searchbar'} bsClass={styles.formGroup}>
                    <FormControl
                        bsClass={styles.formControl}
                        type="text"
                        value={this.state.value}
                        placeholder="Search admin boundary or location..."
                        onChange={this.handleChange}
                    />
                </FormGroup>
            </div>
        )
    }
}

//<AutoComplete
//                    className={styles.searchbarInput}
//                    style={searchbarStyles.searchbar}
//                    searchText={this.state.searchText}
//                    onUpdateInput={this.handleUpdateInput}
//                    onNewRequest={this.handleNewRequest}
//                    dataSource={this.state.source}
//                    hintText={'Search admin boundary or location...'}
//                />