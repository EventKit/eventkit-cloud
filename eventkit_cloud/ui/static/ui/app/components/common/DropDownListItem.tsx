import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

export interface Props {
    title: any;
    children: any;
    alt: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    open: boolean;
}

export class DropDownListItem extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleExpand = this.handleExpand.bind(this);
        this.state = {
            open: false,
        };
    }

    private handleExpand() {
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

export default withTheme()(DropDownListItem);
