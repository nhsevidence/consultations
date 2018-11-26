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
	});
});
