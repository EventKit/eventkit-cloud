import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Checkbox from 'material-ui/Checkbox';
import Checked from '@material-ui/icons/CheckBox';

export class ProvidersFilter extends Component {
    render() {
        let providers = [];
        if (this.props.providers) {
            providers = this.props.providers.filter(provider => provider.display);
        }

        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
                lineHeight: '36px',
            },
            checkbox: {
                width: '100%',
                float: 'left',
            },
            checkboxIcon: {
                fill: 'grey',
                marginRight: '5px',
            },
            checkboxLabel: {
                color: 'grey',
                width: '100%',
            },
        };

        const checkedIcon = (<Checked style={{ fill: '#4598bf' }} />);

        return (
            <div style={styles.drawerSection}>
                <p
                    className="qa-ProvidersFilter-p"
                    style={{ width: '100%', margin: '0px' }}
                >
                    <strong>Sources</strong>
                </p>
                {providers.map(provider => (
                    <Checkbox
                        className="qa-ProvidersFilter-Checkbox"
                        key={provider.slug}
                        label={provider.name}
                        style={styles.checkbox}
                        iconStyle={styles.checkboxIcon}
                        labelStyle={styles.checkboxLabel}
                        checked={!!this.props.selected[provider.slug]}
                        checkedIcon={checkedIcon}
                        onCheck={(e, v) => {
                            this.props.onChange(provider.slug, v);
                        }}
                    />
                ))}
            </div>
        );
    }
}

ProvidersFilter.propTypes = {
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    selected: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default ProvidersFilter;
