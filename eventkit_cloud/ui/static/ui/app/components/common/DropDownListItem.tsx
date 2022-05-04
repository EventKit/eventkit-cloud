import { Children, Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

export interface Props {
    title: any;
    children: any;
    alt: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    open: boolean;
}

export class DropDownListItem extends Component<Props, State> {
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
        return [
            <ListItem
                key="list-item-title"
                className="qa-DropDownListItem-title"
                style={{ backgroundColor, paddingTop: '6px', paddingBottom: '6px' }}
            >
                <div style={{ flex: '1 1 auto', fontWeight: 'bold', color: colors.black }}>
                    {this.props.title}
                </div>
                <IconButton
                    onClick={this.handleExpand}
                    style={{ width: '36px', height: '36px' }}
                    size="large">
                    {this.state.open ?
                        <ExpandLess color="primary" />
                        :
                        <ExpandMore color="primary" />
                    }
                </IconButton>
            </ListItem>,
            <Collapse in={this.state.open} key="list-item-content">
                <List style={{ backgroundColor, padding: '8px 10px' }}>
                    {Children.map(this.props.children, (child, index) => {
                        return (
                            <ListItem key={index}>
                                {child}
                            </ListItem>
                        )
                    })}
                </List>
            </Collapse>,
        ];
    }
}

export default withTheme(DropDownListItem);
