import React, {PropTypes} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import KeyboardArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import KeyboardArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';

export class LoadButtons extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const range = this.props.range ? this.props.range.split('/') : null;

        const styles = {
            range: window.innerWidth < 768 ?
                {color: '#a59c9c', lineHeight: '36px', fontSize: '12px'}
                :
                {display: 'inline-block', position: 'absolute', color: '#a59c9c', lineHeight: '36px', right: '10px', fontSize: '12px'}
        };

        return (
            <div style={{textAlign: 'center', paddingBottom: '10px', margin: '0px 10px', position: 'relative', height: '46px'}}>
                <div style={{display: 'inline-block'}}>
                    <RaisedButton 
                        backgroundColor={'#e5e5e5'}
                        labelColor={'#4498c0'}
                        label={'Show Less'}
                        disabled={this.props.loadLessDisabled}
                        onClick={this.props.handleLoadLess}
                        icon={<KeyboardArrowUp/>}
                        style={{minWidth: '145px', marginRight: '2.5px'}}
                    />
                    <RaisedButton 
                        backgroundColor={'#e5e5e5'}
                        labelColor={'#4498c0'}
                        label={'Show More'}
                        disabled={this.props.loadMoreDisabled}
                        onClick={this.props.handleLoadMore}
                        icon={<KeyboardArrowDown/>}
                        style={{minWidth: '145px', marginLeft: '2.5px'}}
                    />
                </div>
                <div id='range' style={styles.range}>
                    {range ? `${range[0]} of ${range[1]}` : ''}
                </div>
            </div>
        );
    }
}

LoadButtons.propTypes = {
    range: PropTypes.string.isRequired,
    handleLoadLess: PropTypes.func.isRequired,
    handleLoadMore: PropTypes.func.isRequired,
    loadLessDisabled: PropTypes.bool.isRequired,
    loadMoreDisabled: PropTypes.bool.isRequired
};

export default LoadButtons;
