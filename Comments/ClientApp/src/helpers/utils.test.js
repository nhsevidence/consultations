import { objectToQueryString, nextTick } from "./utils";

describe("[ClientApp] ", () => {
	describe("Utils ", () => {
		describe("objectToQueryString", () => {
			it("should take an object and create a query string", () => {
				expect(objectToQueryString({
					value1: "aValue",
					value2: "anotherValue"
				})).toEqual("?value1=aValue&value2=anotherValue");
				expect(objectToQueryString({
					value1: "aValue"
				})).toEqual("?value1=aValue");
				expect(objectToQueryString()).toEqual("");
			});
		});

		describe("nextTick", () => {
			it("should return a resolved promise", (done) => {
				expect(nextTick().then( () => done() ).catch( () => done.fail()));
			});
		});

	});
});
