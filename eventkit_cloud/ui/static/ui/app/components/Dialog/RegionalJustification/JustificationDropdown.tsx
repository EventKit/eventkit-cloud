import Select from '@material-ui/core/Select';
import { createStyles, Theme, withStyles } from '@material-ui/core/styles';
import { MenuItem } from '@material-ui/core';

interface DropdownProps {
    enabled: boolean;
    onChange: (...args: any) => void;
    option: Eventkit.JustificationOption;
    selected: string;
    classes: { [className: string]: string };
}

JustificationDropdown.defaultProps = {
    selected: 'none',
} as DropdownProps;

function JustificationDropdown(props: DropdownProps) {
    const {
        enabled, onChange, option, selected, classes,
    } = props;

    return (
        <div className="qa-Justification-Dropdown">
            <strong>
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: option.name }} />
            </strong>
            <div className={classes.entryRow}>
                <span className={classes.left}>{option.suboption.label}</span>
                <div className={classes.right}>
                    <Select
                        className={classes.input}
                        value={selected}
                        onChange={onChange}
                        placeholder="Select One"
                        disabled={!enabled}
                    >
                        <MenuItem value="none">
                            <em>Select One</em>
                        </MenuItem>
                        {option.suboption.options.map((item, ix) => (
                            <MenuItem value={item} key={`${item + ix}`}>{item}</MenuItem>
                        ))}
                    </Select>
                </div>
            </div>
        </div>
    );
}

const labelJss = (theme: Eventkit.Theme & Theme) => createStyles({
    input: {
        fontSize: '12px',
        padding: '0px',
        width: '300px',
    },
    innerInput: {
        padding: '5px',
    },
    entryRow: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    left: {
        margin: 'auto',
    },
    right: {
        flexGrow: 5,
    },
    textField: {
        backgroundColor: theme.eventkit.colors.white,
    },
});

export default withStyles(labelJss)(JustificationDropdown);
