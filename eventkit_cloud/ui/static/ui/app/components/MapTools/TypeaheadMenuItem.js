import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { MenuItem } from 'react-bootstrap-typeahead';
import ActionRoom from '@material-ui/icons/Room';
import IrregularPolygon from '../icons/IrregularPolygon';
import css from '../../styles/typeahead.css';

export class TypeaheadMenuItem extends Component {
    createDescription(result) {
        const description = [];
        if (result.province) description.push(result.province);
        if (result.region) description.push(result.region);
        if (result.country) description.push(result.country);
        return description.join(', ');
    }

    render() {
        const styles = {
            icon: {
                height: '40px',
                width: '40px',
                padding: '0px',
                verticalAlign: 'middle',
                color: '#707274',
            },
            iconDiv: {
                width: '45px',
            },
            text: {
                color: '#707274',
                minHeight: '20px',
                whiteSpace: 'normal',
            },
            source: {
                color: '#707274',
                background: '#e1e1e1',
                padding: '1px 4px',
                borderRadius: '2px',
            },
        };

        let icon = null;
        if (this.props.result && this.props.result.geometry && this.props.result.geometry.type) {
            icon = this.props.result.geometry.type === 'Point' ?
                <ActionRoom className="qa-TypeaheadMenuItem-ActionRoom" style={styles.icon} />
                :
                <IrregularPolygon className="qa-TypeaheadMenuItem-IrregularPolygon" style={styles.icon} />;
        }

        return (
            <MenuItem
                option={this.props.result}
                position={this.props.index}
                className={css.menuItem}
            >
                <div className="row">
                    <div className="qa-TypeaheadMenuItem-icon-div" style={styles.iconDiv}>
                        {icon}
                    </div>
                    <div style={{ flex: '1' }}>
                        <div className="qa-TypeaheadMenuItem-name" style={styles.text}>
                            <strong>{this.props.result.name}</strong>
                        </div>
                        <div className="qa-TypeaheadMenuItem-description" style={styles.text}>
                            {this.createDescription(this.props.result)}
                        </div>
                    </div>
                    <div style={{ paddingLeft: '6px' }}>
                        <strong className="qa-TypeaheadMenuItem-source" style={styles.source}>
                            {this.props.result.source}
                        </strong>
                    </div>
                </div>
            </MenuItem>
        );
    }
}

TypeaheadMenuItem.propTypes = {
    result: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
};

export default TypeaheadMenuItem;
