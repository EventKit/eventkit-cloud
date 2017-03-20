import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {DataPackPage} from '../components/DataPackPage';
import DataPackList from '../components/DataPackList';
import DataPackSearchbar from '../components/DataPackSearchbar';
import AppBar from 'material-ui/AppBar'
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import RaisedButton from 'material-ui/RaisedButton';
import { Link } from 'react-router';
import {fakeStore} from '../__mocks__/fakeStore'
import { Provider } from 'react-redux'
import isEqual from 'lodash/isEqual';

describe('DataPackPage component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            runsList: {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
            },
            user: {data: {username: 'admin'}},
            getRuns: () => {},
            deleteRuns: () => {},
            runsDeletion: {
                deleting: false,
                deleted: false,
                error: null
            }
        }
    };

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        expect(wrapper.find(AppBar)).to.have.length(1);
        expect(wrapper.find(AppBar).hasClass('sectionTitle')).to.be.true;
        expect(wrapper.find(AppBar).find('h1').text()).to.equal('DataPack Library');
        expect(wrapper.find(Link)).to.have.length(1);
        expect(wrapper.find(RaisedButton)).to.have.length(1);
        expect(wrapper.find(RaisedButton).text()).to.equal('Create DataPack');
        expect(wrapper.find(Toolbar)).to.have.length(1);
        expect(wrapper.find(ToolbarGroup)).to.have.length(1);
        expect(wrapper.find(DataPackSearchbar)).to.have.length(1);
        expect(wrapper.find(DataPackList)).to.have.length(1);
    });

    it('should call getRuns and sizeUpdate when mounting', () => {
        let props = getProps();
        props.getRuns = new sinon.spy();
        const resizeSpy = new sinon.spy(DataPackPage.prototype, 'screenSizeUpdate');
        const mountSpy = new sinon.spy(DataPackPage.prototype, 'componentWillMount');
        const wrapper = shallow(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        expect(props.getRuns.calledOnce).to.be.true;
        expect(resizeSpy.calledOnce).to.be.true;
        expect(mountSpy.calledOnce).to.be.true;
    });

    it('should do call componentWillUnmount', () => {
        const props = getProps();
        const unmountSpy = new sinon.spy(DataPackPage.prototype, 'componentWillUnmount');
        const wrapper = shallow(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        wrapper.unmount();
        expect(unmountSpy.calledOnce).to.be.true;
    });

    it('should handle fetched runs', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        let nextProps = getProps();
        nextProps.runsList.fetched = true;
        nextProps.runsList.runs = [{user: 'admin2', uid: '2'}, {user: 'admin', uid: '1'}, {user: 'admin3', uid: '3'}];
        const propsSpy = new sinon.spy(DataPackPage.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).to.be.true;
        expect(stateSpy.calledTwice).to.be.true;
        DataPackPage.prototype.setState.restore();
    });

    it('should search "TEST" with handleSearch', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs = [
            {
                job: {
                    name: 'tEst name',
                    description: 'bad description',
                    event: 'bad event',
                }
            },{
                job: {
                    name: 'bad name',
                    description: 'teST description',
                    event: 'bad event',
                }
                
            },{
                job: {
                    name: 'bad name',
                    description: 'bad description',
                    event: 'test event',
                }
            },{
                job: {
                    name: 'bad name',
                    description: 'bad description',
                    event: 'bad event',
                }
            }
        ]
        wrapper.setState({runs: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleSearch('TEST', -1);
        expect(stateSpy.calledTwice).to.be.true;
        expect(isEqual(wrapper.state().displayedRuns, [
            {
                job: {
                    name: 'tEst name',
                    description: 'bad description',
                    event: 'bad event',
                }
            },{
                job: {
                    name: 'bad name',
                    description: 'teST description',
                    event: 'bad event',
                }
                
            },{
                job: {
                    name: 'bad name',
                    description: 'bad description',
                    event: 'test event',
                }
            },
            ])).to.be.true;
        DataPackPage.prototype.setState.restore();

    });

    it('should handle a searchbar clear', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        wrapper.setState({displayedRuns: ['one', 'three', 'five']})
        wrapper.setState({runs: ['one', 'two', 'three', 'four', 'five']});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().checkForEmptySearch('', [], {});
        expect(stateSpy.calledTwice).to.be.true;
        expect(isEqual(wrapper.state().runs, wrapper.state().displayedRuns)).to.be.true;
        DataPackPage.prototype.setState.restore();
    });

    it('if a run has been deleted it should call getRuns again', () => {
        let props = getProps();
        props.getRuns = sinon.spy();
        const wrapper = shallow(<DataPackPage {...props}/>);
        expect(props.getRuns.calledOnce).to.be.true;
        let nextProps = getProps();
        nextProps.runsDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(props.getRuns.calledTwice).to.be.true;
    });
});
