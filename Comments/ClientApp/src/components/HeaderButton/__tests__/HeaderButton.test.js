import React from "react";
import { shallow } from "enzyme";
import toJson from "enzyme-to-json";

import { HeaderButton }  from "../HeaderButton";


describe("[ClientApp] ", () => {
	describe("HeaderButton ", () => {
		it("link is found when user is authenticated and there are responses", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={true} responseCount={1} />
			);
		  	expect(wrapper.find("Link").length).toEqual(1);
		});

		it("link is not found when user is not authenticated and there are responses", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={false} responseCount={1} />
			);
		  	expect(wrapper.find("Link").length).toEqual(0);
		});

		it("link is not found when user is authenticated and the response count is undefined", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={false} responseCount={undefined} />
			);
		  	expect(wrapper.find("Link").length).toEqual(0);
		});

		it("link is not found when user is authenticated and the response count is null", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={false} responseCount={null} />
			);
		  	expect(wrapper.find("Link").length).toEqual(0);
		});

		it("link is found and has correct url to the review page", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={true} responseCount={1} consultationId={22} />
			);
		  	expect(wrapper.find("Link").props().to).toEqual("/22/review");
		});

		it("should match snapshot", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={true} responseCount={1} consultationId={22} />
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
