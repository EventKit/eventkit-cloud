import * as React from 'react';
import Info from '@material-ui/icons/Info';
import BaseDialog from "../Dialog/BaseDialog";

interface Props {
    title?: string;
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
    }

    render() {
        const { title } = this.props;

        return (
            <div className="InfoDialog">
                <Info
                    className={`qa-Estimate-Info-Icon`}
                    onClick={() =>  this.setState({displayDialog: true})}
                    color="primary"
                    style={{
                        cursor: 'pointer', verticalAlign: 'middle',
                        marginLeft: '10px', height: '18px', width: '18px',
                    }}
                />
                <BaseDialog
                    show={this.state.displayDialog}
                    title={(!!title) ? title : undefined}
                    onClose={() =>  this.setState({displayDialog: true})}
                >
                    <div
                        style={{paddingBottom: '10px', wordWrap: 'break-word'}}
                    >
                        {this.props.children}
                    </div>
                </BaseDialog>
            </div>
        );
    }
}

export default InfoDialog;
