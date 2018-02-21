import React, { Component, PropTypes } from 'react';
import debounce from 'lodash/debounce';
import CustomTextField from '../CustomTextField';
import MembersHeaderRow from './MembersHeaderRow';
import MemberRow from './MemberRow';

export class MembersBody extends Component {
    constructor(props) {
        super(props);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.searchMembers = debounce(this.searchMembers, 150);
        this.state = {
            search: '',
        };
    }

    handleSearchInput(e) {
        this.setState({ search: e.target.value });
        this.searchMembers(e.target.value);
    }

    searchMembers(text) {
        console.log('search members', text);
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
                    <div style={{ fontSize: '14px', padding: '10px 0px' }} className="qa-MembersBody-membersText">
                        {this.props.membersText}
                    </div>
                    <CustomTextField
                        className="qa-MembersBody-search"
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
                    <MembersHeaderRow
                        memberCount={this.props.members.length}
                        selectedCount={this.props.selectedMembers.length}
                    />
                </div>
                {this.props.members.map(member => (
                    <MemberRow
                        key={member.username}
                        member={member}
                        selected={!!this.props.selectedMembers.find(m => m.username === member.username)}
                        handleCheckBox={() => { console.log('handle member check'); }}
                        className="qa-MembersBody-MemberRow"
                    />
                ))}
            </div>
        );
    }
}

MembersBody.defaultProps = {
    membersText: '',
};

MembersBody.propTypes = {
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedMembers: PropTypes.arrayOf(PropTypes.object).isRequired,
    membersText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
};

export default MembersBody;
