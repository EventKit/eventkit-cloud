import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import ol from 'openlayers'
import styles from './SearchAOIToolbar.css'
import DrawControl from './openlayers.DrawControl.js'
import AutoComplete from 'material-ui/AutoComplete'

export default class SearchAOIToolbar extends Component {

    constructor(props) {
        super(props)
        this.handleUpdateInput = this.handleUpdateInput.bind(this)
        this.state = {
            source: ['test',
                     'testing',
                     'testing123',
                     ],
            searchText: ''
        }
    }

    handleUpdateInput(input) {
        this.setState({searchText: input});
        console.log("Received input '" + input + "'");
    };

    handleNewRequest() {
        this.setState({
            searchText: '',
        });
     };

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
                <AutoComplete
                    className={styles.searchbarInput}
                    style={searchbarStyles.searchbar}
                    searchText={this.state.searchText}
                    onUpdateInput={this.handleUpdateInput}
                    onNewRequest={this.handleNewRequest}
                    dataSource={this.state.source}
                    hintText={'Search admin boundary or location...'}
                />
            </div>
        )
    }
}