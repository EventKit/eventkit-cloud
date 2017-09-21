import React, {Component} from 'react';
import styles from '../../styles/TypeaheadMenuItem.css';
import {MenuItem} from 'react-bootstrap-typeahead';
import isEqual from 'lodash/isEqual';
import ImageCropDin from 'material-ui/svg-icons/image/crop-din';
import ActionRoom from 'material-ui/svg-icons/action/room';

export class TypeaheadMenuItem extends Component {

    constructor(props) {
        super(props);
        this.createDescription = this.createDescription.bind(this);
    }

    createDescription(result) {
        let description = [];
        result.province ? description.push(result.province): null;
        result.region ? description.push(result.region): null;
        result.country ? description.push(result.country): null;

        return description.join(', ');
    }

    render() {
        let icon = null;
        if (this.props.result && this.props.result.geometry && this.props.result.geometry.type) {
            icon = this.props.result.geometry.type == 'Point' ? <ActionRoom className={styles.menuItemIcon}/> : <ImageCropDin className={styles.menuItemIcon}/>;
        }
        return (
            <MenuItem className={'qa-TypeaheadMenuItem-MenuItem'} option={this.props.result} position={this.props.index} >
                <div className={'qa-TypeaheadMenuItem-div-row'} >
                    <div className={'qa-TypeaheadMenuItem-div-icon'} >
                        {icon}
                    </div>
                    <div style={{flex: '1'}}>
                        <div className={'qa-TypeaheadMenuItem-div-name'} >
                            <strong>{this.props.result.name}</strong>
                        </div>
                        <div  className={'qa-TypeaheadMenuItem-div-description'}>{this.createDescription(this.props.result)}</div>
                    </div>
                    <div  className={'qa-TypeaheadMenuItem-div-source'} style={{paddingLeft: '6px'}}>
                        <strong className={styles.menuItemSource}>
                            {this.props.result.source}
                        </strong>
                    </div>
                </div>
            </MenuItem>
        )
    }
}

TypeaheadMenuItem.propTypes = {
    result: React.PropTypes.object,
    index: React.PropTypes.number,
}

export default TypeaheadMenuItem;
