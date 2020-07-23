import * as React from 'react';
import {
    createStyles, Tab, Tabs, Theme, withStyles, withTheme,
} from '@material-ui/core';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    tabs: {
        visibility: 'visible',
        marginLeft: '25px',
        marginRight: '-1px',
        color: theme.eventkit.colors.text_primary,
    },
    tab: {
        opacity: 0.9,
        textTransform: 'none',
        fontSize: '11px',
        minWidth: '0',
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px',
        backgroundColor: '#d6d6d6',
        border: 'solid 1px #707274',
        margin: '1px',
        '&$disabled': {
            opacity: 1,
        },
        '&$selected': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
    selected: {},
    disabled: {},
});

export interface Props {
    selectedTab: string;
    handleChange: (event: any, newValue: any) => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export function GroupsHeaderTabs(props: Props) {
    const {classes, selectedTab} = props;

    const tabs = [
        {id: 1, name: 'Admin', value: 'admin', disabled: selectedTab === 'admin'},
        {id: 2, name: 'Member', value: 'member', disabled: selectedTab === 'member'},
        {id: 3, name: 'Other', value: 'none', disabled: selectedTab === 'none'},
    ];

    return (
        <Tabs
            className={classes.tabs}
            value={(selectedTab) || false}
            onChange={props.handleChange}
        >
            {tabs.map(tab => (
                <Tab
                    key={tab.id}
                    style={{width: '32%', display: 'grid'}}
                    value={tab.value}
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                        disabled: classes.disabled,
                    }}
                    label={tab.name}
                    disabled={tab.disabled}
                />
            ))}
        </Tabs>
    );
}

export default withTheme()(withStyles(jss)(GroupsHeaderTabs));
