import React from "react";
import { shallow } from "enzyme";

import { Header } from "../Header";
import toJson from "enzyme-to-json";

describe("[ClientApp] ", () => {
	describe("Header ", () => {
		it("should display correctly when consulation hasn't started", () => {
			const FakeProps = {
				title: "My title",
				subtitle1: "Subtitle 1",
				subtitle2: "Subtitle 2",
				consultationState: {
					endDate: "1994-11-05T08:15:30-05:00",
					consultationIsOpen: false,
					consultationHasNotStartedYet: true,
				},
			};
			const wrapper = shallow(
				<Header {...FakeProps}/>
			);
			expect(
				toJson(wrapper, {
					noKey: true,
					mode: "deep",
				})
			).toMatchSnapshot();
		});

		it("should display correctly when consulation is in progress", () => {
			const FakeProps = {
				title: "My title",
				subtitle1: "Subtitle 1",
				consultationState: {
					endDate: "1994-11-05T08:15:30-05:00",
					consultationIsOpen: true,
					consultationHasNotStartedYet: false,
				},
			};
			const wrapper = shallow(
				<Header {...FakeProps}/>
			);
			expect(
				toJson(wrapper, {
					noKey: true,
					mode: "deep",
				})
			).toMatchSnapshot();
		});

		it("should display correctly when consulation has ended", () => {
			const FakeProps = {
				title: "My title has changed",
				subtitle1: "Subtitle 1",
				consultationState: {
					endDate: "1994-11-05T08:15:30-05:00",
					consultationIsOpen: false,
					consultationHasNotStartedYet: false,
				},
			};
			const wrapper = shallow(
				<Header {...FakeProps}/>
			);
			expect(
				toJson(wrapper, {
					noKey: true,
					mode: "deep",
				})
			).toMatchSnapshot();
		});
	});
});
