import { Tab, Tabs, Theme } from '@mui/material';

import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import withTheme from '@mui/styles/withTheme';

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
    tabName: {

    },
    tabTotal: {
        fontStyle: 'italic',
    },
});

export interface Props {
    selectedTab: string;
    totalAdmin: number;
    totalMember: number;
    totalOther: number;
    handleChange: (event: any, newValue: any) => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export function GroupsHeaderTabs(props: Props) {
    const {
        classes, selectedTab, totalAdmin, totalMember, totalOther,
    } = props;

    const tabs = [
        {
            id: 1, name: 'Admin', value: 'admin', disabled: selectedTab === 'admin', total: totalAdmin,
        },
        {
            id: 2, name: 'Member', value: 'member', disabled: selectedTab === 'member', total: totalMember,
        },
        {
            id: 3, name: 'Other', value: 'none', disabled: selectedTab === 'none', total: totalOther,
        },
    ];

    return (
        <Tabs
            className={classes.tabs}
            value={(selectedTab) || false}
            onChange={props.handleChange}
        >
            {tabs.map((tab) => (
                <Tab
                    key={tab.id}
                    style={{ width: '32%', display: 'grid' }}
                    value={tab.value}
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                        disabled: classes.disabled,
                    }}
                    label={(
                        <>
                            <div className={classes.tabName}><strong>{tab.name}</strong></div>
                            <div className={classes.tabTotal}>({tab.total})</div>
                        </>
                    )}
                    disabled={tab.disabled}
                />
            ))}
        </Tabs>
    );
}

export default withTheme((withStyles(jss)(GroupsHeaderTabs)));
