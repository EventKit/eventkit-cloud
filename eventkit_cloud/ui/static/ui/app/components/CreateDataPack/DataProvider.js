import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Collapse from '@material-ui/core/Collapse';
import ActionCheckCircle from '@material-ui/icons/CheckCircle';
import UncheckedCircle from '@material-ui/icons/RadioButtonUnchecked';
import Checkbox from '@material-ui/core/Checkbox';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ProviderStatusIcon from './ProviderStatusIcon';
import BaseDialog from '../Dialog/BaseDialog';


export class DataProvider extends React.Component {
    constructor(props) {
        super(props);
        this.handleLicenseOpen = this.handleLicenseOpen.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.handleExpand = this.handleExpand.bind(this);
        this.state = {
            open: false,
            licenseDialogOpen: false,
        };
    }

    handleLicenseOpen() {
        this.setState({ licenseDialogOpen: true });
    }

    handleLicenseClose() {
        this.setState({ licenseDialogOpen: false });
    }

    handleExpand() {
        this.setState(state => ({ open: !state.open }));
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const { provider } = this.props;
        const styles = {
            listItem: {
                fontWeight: 'normal',
                fontSize: '16px',
                padding: '16px 10px',
            },
            sublistItem: {
                fontWeight: 'normal',
                fontSize: '13px',
                padding: '14px 20px 14px 49px',
                borderTop: colors.secondary,
            },
            checkbox: {
                width: '24px',
                height: '24px',
                marginRight: '15px',
                flex: '0 0 auto',
            },
            name: {
                marginRight: '10px',
                display: 'flex',
                flex: '1 1 auto',
                flexWrap: 'wrap',
            },
            expand: {
                display: 'flex',
                flex: '0 0 auto',
            },
        };

        // Show license if one exists.
        const nestedItems = [];
        if (provider.license) {
            nestedItems.push((
                <ListItem
                    key={nestedItems.length}
                    dense
                    disableGutters
                    style={styles.sublistItem}
                    className="qa-DataProvider-ListItem-license"
                >
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                        <i>
                            Use of this data is governed by&nbsp;
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={this.handleLicenseOpen}
                                onKeyPress={this.handleLicenseOpen}
                                style={{ cursor: 'pointer', color: colors.primary }}
                            >
                                {provider.license.name}
                            </span>
                        </i>
                        <BaseDialog
                            show={this.state.licenseDialogOpen}
                            title={provider.license.name}
                            onClose={this.handleLicenseClose}
                        >
                            <div style={{ whiteSpace: 'pre-wrap' }}>{provider.license.text}</div>
                        </BaseDialog>
                    </div>
                </ListItem>
            ));
        }

        nestedItems.push((
            <ListItem
                className="qa-DataProvider-ListItem-provServDesc"
                key={nestedItems.length}
                dense
                disableGutters
                style={styles.sublistItem}
            >
                <div style={{ whiteSpace: 'pre-wrap' }}>{provider.service_description || 'No provider description available.'}</div>
            </ListItem>
        ));

        nestedItems.push((
            <ListItem
                className="qa-DataProvider-ListItem-provMaxAoi"
                key={nestedItems.length}
                dense
                disableGutters
                style={styles.sublistItem}
            >
                <div style={{ whiteSpace: 'pre-wrap' }}>
                    <span style={{ fontWeight: 'bold' }}>Maximum selection area: </span>
                    {((provider.max_selection == null ||
                        provider.max_selection === '' ||
                        parseFloat(provider.max_selection) <= 0) ?
                        'unlimited' : `${provider.max_selection} km²`
                    )}
                </div>
            </ListItem>
        ));

        const backgroundColor = (this.props.alt) ? colors.secondary : colors.white;

        return ([
            <ListItem
                className="qa-DataProvider-ListItem"
                key={provider.uid}
                style={{ ...styles.listItem, backgroundColor }}
                dense
                disableGutters
            >
                <div style={{ display: 'flex', width: '100%' }}>
                    <Checkbox
                        className="qa-DataProvider-CheckBox-provider"
                        name={provider.name}
                        style={styles.checkbox}
                        checked={this.props.checked}
                        onChange={this.props.onChange}
                        checkedIcon={
                            <ActionCheckCircle className="qa-DataProvider-ActionCheckCircle-provider" style={{ fill: colors.success }} />
                        }
                        icon={
                            <UncheckedCircle className="qa-DataProvider-UncheckedCircle-provider" color="primary" />
                        }
                        color="primary"
                    />
                    <span
                        className="qa-DataProvider-ListItemName"
                        style={styles.name}
                    >
                        {provider.name}
                    </span>
                    <ProviderStatusIcon
                        id="ProviderStatus"
                        tooltipStyle={{ zIndex: '1' }}
                        baseStyle={{ marginRight: '40px' }}
                        availability={provider.availability}
                    />
                    {this.state.open ?
                        <ExpandLess style={styles.expand} onClick={this.handleExpand} color="primary" />
                        :
                        <ExpandMore style={styles.expand} onClick={this.handleExpand} color="primary" />
                    }
                </div>
            </ListItem>,
            <Collapse in={this.state.open} key={`${provider.uid}-expanded`}>
                <List style={{ padding: '0px', backgroundColor }}>
                    {nestedItems}
                </List>
            </Collapse>,
        ]);
    }
}

DataProvider.propTypes = {
    provider: PropTypes.shape({
        uid: PropTypes.string,
        name: PropTypes.string,
        max_selection: PropTypes.string,
        service_description: PropTypes.string,
        license: PropTypes.shape({
            text: PropTypes.string,
            name: PropTypes.string,
        }),
        availability: PropTypes.object,
    }).isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    alt: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(DataProvider);
