import * as React from 'react';
import Info from '@material-ui/icons/Info';
import BaseDialog from "./BaseDialog";

interface Props {
    title?: string;
    iconProps?: any;
    dialogProps?: any;
    smallScreen?: boolean;
}

interface State {
    displayDialog: boolean;
}

export class InfoDialog extends React.Component<Props, State> {

    static defaultProps;

    constructor(props: Props) {
        super(props);
        this.state = {
            displayDialog: false,
        };
        this.openDialog = this.openDialog.bind(this);
    }

    openDialog() {
        this.setState({ displayDialog: true })
    }

    render() {
        const { title, iconProps = {}, dialogProps = {} } = this.props;

        return (
            <>
                <Info
                    color="primary"
                    {...iconProps}
                    className={`qa-Estimate-Info-Icon`}
                    onClick={this.openDialog}
                />
                <BaseDialog
                    dialogStyle={
                        this.props.smallScreen ? {
                            width: '95%',
                            maxHeight: '90%',
                            margin: '10px',
                        } : {}}
                    {...dialogProps}
                    show={this.state.displayDialog}
                    title={(!!title) ? title : undefined}
                    onClose={() => this.setState({ displayDialog: false })}
                >
                    <div
                        style={{ paddingBottom: '10px', wordWrap: 'break-word', marginRight: '5px' }}
                    >
                        {this.props.children}
                    </div>
                </BaseDialog>
            </>
        );
    }
}

export default InfoDialog;
