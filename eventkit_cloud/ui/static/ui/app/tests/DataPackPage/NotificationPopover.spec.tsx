import * as React from "react";
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';
import NotificationPopover from "../../components/DataPackPage/NotificationPopover";

describe('NotificationPopover component', () => {

    it('should render basic components', () => {

        TestUtils.renderComponent(<NotificationPopover someProvidersAvailable={false}/>);
    });
});
