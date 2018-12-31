import * as React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import DropDownMenu from '../common/DropDownMenu';

export interface Props {
    value: string;
    handleChange: (value: string) => void;
    owner: string;
}

export class DataPackOwnerSort extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
        this.handleAll = this.handleAll.bind(this);
        this.handleOwner = this.handleOwner.bind(this);
    }

    private handleAll() {
        this.props.handleChange('all');
    }

    private handleOwner() {
        this.props.handleChange(this.props.owner);
    }

    render() {
        const styles = {
            item: {
                fontSize: '12px',
                padding: '0px 24px',
                height: '32px',
            },

        };

        const { value, owner } = this.props;

        const text = value === 'all' ? 'All DataPacks' : 'My DataPacks';

        return (
            <DropDownMenu
                className="qa-DataPackOwnerSort-Menu"
                value={text}
                style={{ height: '30px', lineHeight: '30px' }}
            >
                <MenuItem
                    key="all"
                    className="qa-DataPackOwnerSort-MenuItem-allDatapacks"
                    style={styles.item}
                    selected={value === 'all'}
                    onClick={this.handleAll}
                >
                    All DataPacks
                </MenuItem>
                <MenuItem
                    key="mine"
                    className="qa-DataPackOwnerSort-Menuitem-myDatapacks"
                    style={styles.item}
                    selected={value === owner}
                    onClick={this.handleOwner}
                >
                    My DataPacks
                </MenuItem>
            </DropDownMenu>
        );
    }
}

export default DataPackOwnerSort;
