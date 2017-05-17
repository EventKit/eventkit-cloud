import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DataPackDetails} from '../../components/StatusDownloadPage/DataPackDetails';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import RaisedButton from 'material-ui/RaisedButton';

import '../../components/tap_events'

describe('DataPackDetails component', () => {

    const muiTheme = getMuiTheme();

    const getProps = () => {
        return  {
            providerTasks: [],
        }
    };

    const getWrapper = (props) => {
        return mount(<DataPackDetails {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    }
    it('should render elements', () => {
        let props = getProps();
        const wrapper = shallow(<DataPackDetails {...props}/>);
        expect(wrapper.find(RaisedButton)).toHaveLength(1);

    });

});

