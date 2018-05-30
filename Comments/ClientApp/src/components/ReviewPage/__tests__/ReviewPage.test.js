/* global jest */

import React from "react";
import { mount, shallow } from "enzyme";
import { MemoryRouter } from "react-router";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { generateUrl } from "../../../data/loader";
import { nextTick, queryStringToObject } from "../../../helpers/utils";
import ReviewPageWithRouter, {ReviewPage} from "../ReviewPage";
import ConsultationData from "./Consultation";
import DocumentsData from "./Documents";
//import stringifyObject from "stringify-object";

const mock = new MockAdapter(axios);

jest.mock("../../../context/UserContext", () => {
	return {
		UserContext: {
			Consumer: (props) => {
				return props.children({
					isAuthorised: true
				});
			}
		}
	};
});

describe("[ClientApp] ", () => {
	describe("ReviewPage Component", () => {
		const fakeProps = {
			match: {
				url: "/1/review",
				params: {
					consultationId: 1,
				}
			},
			location: {
				pathname: "/1/review",
				search: "?sourceURI=consultations%3A%2F%2F.%2Fconsultation%2F1%2Fdocument%2F1"
			}
		};

		afterEach(() => {
			mock.reset();
		});

		it("generateDocumentList doesn't filter out documents supporting comments", async () => {

			const docTypesIn = [
				{title : "first doc title", sourceURI: "first source uri", supportsComments: true},
				{title : "second doc title", sourceURI: "second source uri", supportsComments: true}];

			const reviewPage = new ReviewPage(fakeProps);

			const returnValue = reviewPage.generateDocumentList(docTypesIn);

			expect(returnValue.links.length).toEqual(2);
		});

		it("generateDocumentList filters out documents not supporting comments", async () => {

			const docTypesIn = [
				{title : "first doc title", sourceURI: "first source uri", supportsComments: true},
				{title : "second doc title", sourceURI: "second source uri", supportsComments: false}];

			const reviewPage = new ReviewPage(fakeProps);

			const returnValue = reviewPage.generateDocumentList(docTypesIn);

			expect(returnValue.links.length).toEqual(1);
		});

		it("queryStringToObject should return an object", async () => {
			const returnValue = queryStringToObject("?search=foo&id=bar");
			expect(returnValue.search).toEqual("foo");
			expect(returnValue.id).toEqual("bar");
		});

		it("should hit the endpoints successfully", async () => {
			const mock = new MockAdapter(axios);

			mock
				.onGet("/consultations/api/Documents?consultationId=1")
				.reply(() => {
					return [200, DocumentsData];
				});

			mock
				.onGet("/consultations/api/Consultation?consultationId=1")
				.reply(() => {
					return [200, ConsultationData];
				});
		});
	});
});
