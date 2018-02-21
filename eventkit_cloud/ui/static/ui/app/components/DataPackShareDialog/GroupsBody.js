import React, { Component, PropTypes } from 'react';
import debounce from 'lodash/debounce';
import CustomTextField from '../CustomTextField';
import GroupRow from './GroupRow';
import GroupsHeaderRow from './GroupsHeaderRow';

export class GroupsBody extends Component {
    constructor(props) {
        super(props);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.searchGroups = debounce(this.searchGroups, 150);
        this.state = {
            search: '',
        };
    }

    handleSearchInput(e) {
        this.setState({ search: e.target.value });
        this.searchGroups(e.target.value);
    }

    searchGroups(text) {
        console.log('search groups', text);
    }

    render() {
        const styles = {
            fixedHeader: {
                position: 'sticky',
                top: 38,
                left: 0,
                backgroundColor: '#fff',
                zIndex: 15,
                padding: '0px 10px',
            },
            textField: {
                fontSize: '14px',
                backgroundColor: 'whitesmoke',
                height: '36px',
                lineHeight: '36px',
                margin: '10px 0px',
            },
            characterLimit: {
                bottom: '0px',
                height: '100%',
                display: 'flex',
                transform: 'none',
                alignItems: 'center',
                fontSize: '14px',
            },
        };

        return (
            <div>
                <div style={styles.fixedHeader}>
                    <div style={{ fontSize: '14px', padding: '10px 0px' }} className="qa-GroupsBody-groupsText">
                        {this.props.groupsText}
                    </div>
                    <CustomTextField
                        className="qa-GroupsBody-search"
                        fullWidth
                        maxLength={50}
                        hintText="Search"
                        onChange={this.handleSearchInput}
                        value={this.state.search}
                        inputStyle={{ paddingLeft: '16px' }}
                        style={styles.textField}
                        underlineShow={false}
                        hintStyle={{ paddingLeft: '16px', bottom: '0px', color: '#707274' }}
                        charsRemainingStyle={styles.characterLimit}
                    />
                    <GroupsHeaderRow
                        groupCount={this.props.groups.length}
                        selectedCount={this.props.selectedGroups.length}
                    />
                </div>
                {this.props.groups.map(group => (
                    <GroupRow
                        key={group.id}
                        group={group}
                        members={this.props.members}
                        selected={!!this.props.selectedGroups.find(g => g.name === group.name)}
                        handleCheckBox={() => { console.log('handle check'); }}
                        className="qa-GroupsBody-GroupRow"
                    />
                ))}
            </div>
        );
    }
}

GroupsBody.defaultProps = {
    groupsText: '',
};

GroupsBody.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedGroups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    groupsText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
};

export default GroupsBody;
