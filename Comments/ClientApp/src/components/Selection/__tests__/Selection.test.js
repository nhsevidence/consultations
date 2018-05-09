import React from "react";
import { mount } from "enzyme";
import { MemoryRouter } from "react-router";
import { Selection } from "../Selection";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { generateUrl } from "../../../data/loader";
import { nextTick } from "../../../helpers/utils";

const mock = new MockAdapter(axios);

describe("[ClientApp] ", () => {
	describe("Selection Component", () => {		

		// beforeEach(() => {
			
		//   });

		it("mouseup event with invalid range should hide tooltip", async () => {
			window.getSelection = () => {
				return {
					  removeAllRanges: () => {},
					  getRangeAt: () => {},
					  isCollapsed: false,
					  rangeCount: 0
				};
			  };

			let wrapper = mount(<Selection><p>some paragraph content</p></Selection>);

			wrapper.setState({toolTipVisible: true});
			expect(wrapper.state().toolTipVisible).toEqual(true);

			wrapper.instance().onMouseUp(new Event("mouseup"));
			expect(wrapper.state().toolTipVisible).toEqual(false);			
		});

		it("mouseup event with valid range should show tooltip", async () => {
			window.getSelection = () => {
				return {
					removeAllRanges: () => {},
					getRangeAt: function(number){ return "paragraph content";},
					isCollapsed: false,
					rangeCount: 1
				};
			};
			// jest.mock("xpath-range", () => ({
			// 	xpathRange: {
			// 		Range: {
			// 			BrowserRange: {
			// 				normalize: function(){
			// 					console.log("in normalize");
			// 				}
			// 			}
			// 		}
			// 	}}));

			//xpathRange.Range.BrowserRange

			let wrapper = mount(<Selection><p>some paragraph content</p></Selection>);

			wrapper.setState({toolTipVisible: false});
			expect(wrapper.state().toolTipVisible).toEqual(false);

			// wrapper.instance().onMouseUp(new Event("mouseup"));
			// expect(wrapper.state().toolTipVisible).toEqual(false);			
		});



		// const paragraph = document.createElement("p");
		// paragraph.setAttribute("id", "myparagraph");
		// paragraph.textContent = "some paragraph content";
		// window.domNode = paragraph;
		// document.body.appendChild(paragraph);

		//let wrapper = mount(<Selection />, { attachTo: window.domNode });
		//let wrapper = mount(<div id="parentDiv"><p>This is outside the selection</p><Selection><p>some content inside selection</p></Selection></div>, { attachTo: window.domNode });
		//let wrapper = mount(<Selection><p>some paragraph content</p></Selection>);

		//wrapper.instance().onMouseUp(new Event("mouseup"));
		//let parentDiv = document.getElementById("parentDiv");
		// grabbedParagraph.dispatchEvent(new Event("mouseup"));


		//console.log(grabbedParagraph);

		// const selection = window.getSelection();
		// const range = document.createRange();

		//console.log(selection);

		// range.selectNodeContents(parentDiv);
		// selection.removeAllRanges();
		// selection.addRange(range);



		//console.log(window.getSelection());
	});
});
