import React from "react";
import { shallow } from "enzyme";

import { HeaderButton }  from "../HeaderButton";
import toJson from "enzyme-to-json";

describe("[ClientApp] ", () => {
	describe("HeaderButton ", () => {
		it("button is found when user is authenticated and there are responses", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={true} responseCount={1} />
			);
		  	expect(wrapper.find("button").length).toEqual(1);
		});

		it("button links to the review page", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={true} responseCount={1} />
			);
		  	expect(wrapper.find("button").todo).toEqual(1);
		});

		it("button is not found when user is not authenticated and there are responses", () => {
		
			const wrapper = shallow(
				<HeaderButton isAuthorised={false} responseCount={1} />
			);
		  	expect(wrapper.find("button").length).toEqual(0);
		});
	});
});
