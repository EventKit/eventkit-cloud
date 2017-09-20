import React, {PropTypes} from 'react'
import AutoComplete from 'material-ui/AutoComplete';
import searchStyles from '../../styles/DataPackSearchbar.css';

class DataPackSearchbar extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const styles = {
            autoComplete: {
                backgroundColor: '#16212f',
                color: 'white',
                width: this.props.searchbarWidth,
                height: '36px',
                borderBottom: '1px solid #e0e0e0',
            },
            autoCompleteText: {
                width: this.props.searchbarWidth,
                height: '36px',
                lineHeight: '16px',
            },
        };

        return (
            <AutoComplete
                className={'qa-DataPackSearchBar-AutoComplete'}
                dataSource={[]}
                hintText={"Search DataPacks"}
                onNewRequest={this.props.onSearchSubmit}
                onUpdateInput={this.props.onSearchChange}
                style={styles.autoComplete}
                textFieldStyle={styles.autoCompleteText}
            />
        );
    }
}


DataPackSearchbar.propTypes = {
    onSearchChange: React.PropTypes.func,
    onSearchSubmit: React.PropTypes.func,
    searchbarWidth: React.PropTypes.string,
};

export default DataPackSearchbar;
