import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

export class DropDownListItem extends Component {
    constructor(props) {
        super(props);
        this.handleExpand = this.handleExpand.bind(this);
        this.state = {
            open: false,
        };
    }

    handleExpand() {
        this.setState({ open: !this.state.open });
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const backgroundColor = this.props.alt ? colors.white : colors.secondary;
        return ([
            <ListItem
                key="list-item-title"
                className="qa-DropDownListItem-title"
                style={{ backgroundColor, paddingTop: '6px', paddingBottom: '6px' }}
            >
                <div style={{ flex: '1 1 auto', fontWeight: 'bold', color: colors.black }}>
                    {this.props.title}
                </div>
                <IconButton onClick={this.handleExpand} style={{ width: '36px', height: '36px' }}>
                    {this.state.open ?
                        <ExpandLess color="primary" />
                        :
                        <ExpandMore color="primary" />
                    }
                </IconButton>
            </ListItem>,
            <Collapse in={this.state.open} key="list-item-content">
                <List style={{ backgroundColor, padding: '8px 10px' }}>
                    <ListItem>
                        {this.props.children}
                    </ListItem>
                </List>
            </Collapse>,
        ]);
    }
}

DropDownListItem.propTypes = {
    title: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    alt: PropTypes.bool,
    theme: PropTypes.object.isRequired,
};

DropDownListItem.defaultProps = {
    alt: false,
};

export default withTheme()(DropDownListItem);
