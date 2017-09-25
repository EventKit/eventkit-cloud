import React from 'react';
import {Checkbox} from 'material-ui';

export class ProvidersFilter extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        let providers = [];
        if (this.props.providers) {
            providers = this.props.providers.filter((provider) => {
                return provider.display !== false;
            });
        }

        const styles = {
            drawerSection: {
                width: '100%', 
                paddingLeft: '10px', 
                paddingRight: '10px', 
                lineHeight: '36px'
            },
            checkbox: {
                width: '100%', 
                float: 'left'
            },
            checkboxIcon: {
                fill: 'grey',
                marginRight: '5px'
            },
            checkboxLabel: {
                color: 'grey'
            }
        };

        return (
            <div style={styles.drawerSection}>
                <p className={'qa-ProvidersFilter-p'} style={{width: '100%', margin: '0px'}}><strong>Sources</strong></p>
                {providers.map((provider) => {
                    return (
                        <Checkbox
                            className={'qa-ProvidersFilter-Checkbox'}
                            key={provider.slug}
                            label={provider.name}
                            style={styles.checkbox}
                            iconStyle={styles.checkboxIcon}
                            labelStyle={styles.checkboxLabel}
                            checked={!!this.props.selected[provider.slug]}
                            onCheck={(e, v) => {
                                this.props.onChange(provider.slug, v);
                            }}
                        />
                    );
                })}
            </div>
        );
    }

}

ProvidersFilter.propTypes = {
    providers: React.PropTypes.array.isRequired,
    selected: React.PropTypes.object.isRequired,
}

export default ProvidersFilter;