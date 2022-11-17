import * as React from "react";
import * as sinon from 'sinon';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../../test-utils';
import JustificationDropdown from "../../../components/Dialog/RegionalJustification/JustificationDropdown";


describe('JustificationDropdown component', () => {

    it('should render basic components', () => {
        const props = {
            enabled: true,
            onChange: sinon.spy(),
            selected: 'none',
            option: {
                id: 'test',
                name: 'test Justification',
                display: true,
                suboption: {
                    type: 'text',
                    options: ['one', 'two', 'three']
                }
            }
        }
        TestUtils.renderComponent(<JustificationDropdown {...props} />);
    });
});
