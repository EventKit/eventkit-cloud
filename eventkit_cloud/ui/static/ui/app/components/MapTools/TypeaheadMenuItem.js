import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import { MenuItem } from 'react-bootstrap-typeahead';
import ActionRoom from '@material-ui/icons/Room';
import IrregularPolygon from '../icons/IrregularPolygon';
import '../../styles/typeaheadStyles.css';

export class TypeaheadMenuItem extends Component {
    createDescription(result) {
        const description = [];
        if (result.province) {description.push(result.province)};
        if (result.region) {description.push(result.region)};
        if (result.country) {description.push(result.country)};
        return description.join(', ');
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            icon: {
                color: colors.text_primary,
                height: '40px',
                padding: '0px',
                verticalAlign: 'middle',
                width: '40px',
            },
            iconDiv: {
                width: '45px',
            },
            source: {
                background: colors.secondary,
                borderRadius: '2px',
                color: colors.text_primary,
                padding: '1px 4px',
            },
            text: {
                color: colors.text_primary,
                minHeight: '20px',
                whiteSpace: 'normal',
            },
        };

        let icon = null;
        if (this.props.result && this.props.result.geometry && this.props.result.geometry.type) {
            icon = this.props.result.geometry.type === 'Point'
                ? <ActionRoom className="qa-TypeaheadMenuItem-ActionRoom" style={styles.icon} />
                : <IrregularPolygon className="qa-TypeaheadMenuItem-IrregularPolygon" style={styles.icon} />;
        }

        return (
            <MenuItem
                className="menuItem"
                option={this.props.result}
                position={this.props.index}
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
    index: PropTypes.number.isRequired,
    result: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(TypeaheadMenuItem);
