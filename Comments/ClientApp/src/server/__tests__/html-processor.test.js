import { prepTags,
	parseClassAttribute,
	replaceOpeningHtmlTag,
	replaceOpeningBodyTag,
	replaceRootContent,
	replaceRelativePaths,
	replaceAccountsEnvironment,
} from "../html-processor";

describe("HTML processor", () => {
	describe("prepTags", () => {
		it("replaces <!--! title --> placeholder in HTML", () => {
			let result = prepTags("test1 <!--! title --> test2", { title: "ABC" });
			expect(result).toBe("test1 ABC test2");
		});

		it("replaces <!--! metas --> placeholder in HTML", () => {
			let result = prepTags("test1 <!--! metas --> test2", { metas: "ABC" });
			expect(result).toBe("test1 ABC test2");
		});

		it("replaces <!--! links -->  placeholder in HTML", () => {
			let result = prepTags("test1 <!--! links --> test2", { links: "ABC" });
			expect(result).toBe("test1 ABC test2");
		});

		it("replaces <!--! scripts --> placeholder in HTML", () => {
			let result = prepTags("test1 <!--! scripts --> test2", { scripts: "ABC" });
			expect(result).toBe("test1 ABC test2");
		});

		it("replaces <!--! analyticsGlobals --> placeholder in HTML", () => {
			let result = prepTags("test1 <!--! analyticsGlobals --> test2", { analyticsGlobals: "ABC" });
			expect(result).toBe("test1 ABC test2");
		});
	});

	describe("parseClassAttribute", () => {
		it("returns empty attributes as-is", () => {
			let result = parseClassAttribute("");
			expect(result).toEqual({ htmlAttributes: "",
				className: "" });
		});

		it("returns attributes as-is without class", () => {
			let result = parseClassAttribute("a=\"b\" c=\"d\"");
			expect(result).toEqual({ htmlAttributes: "a=\"b\" c=\"d\"",
				className: "" });
		});

		it("strips the class attribute", () => {
			let result = parseClassAttribute("a=\"b\" class=\"alpha beta\"");
			expect(result).toEqual({ htmlAttributes: "a=\"b\"",
				className: "alpha beta" });
		});
	});

	describe("replaceOpeningHtmlTag", () => {
		it("uses no-js class by default", () => {
			let result = replaceOpeningHtmlTag("<html><head>", "");
			expect(result).toEqual("<html class=\"no-js\"><head>");
		});

		it("adds no-js to the given class atribute", () => {
			let result = replaceOpeningHtmlTag("<html><head>", "class=\"abc def\"");
			expect(result).toEqual("<html class=\"no-js abc def\"><head>");
		});

		it("adds all the html attributes", () => {
			let result = replaceOpeningHtmlTag("<html><head>", "class=\"abc def\" lang=\"en-GB\" test=\"true\"");
			expect(result).toEqual("<html class=\"no-js abc def\" lang=\"en-GB\" test=\"true\"><head>");
		});
	});

	describe("replaceOpeningBodyTag", () => {
		it("keeps plain body tag with no attributes", () => {
			let result = replaceOpeningBodyTag("</head><body><div>", "");
			expect(result).toEqual("</head><body><div>");
		});
		it("adds attributes to body tag", () => {
			let result = replaceOpeningBodyTag("</head><body><div>", "test=\"true\"");
			expect(result).toEqual("</head><body test=\"true\"><div>");
		});
	});

	describe("replaceRootContent", () => {
		it("replaces react root div with content", () => {
			let result = replaceRootContent("<body><div id=\"root\"></div><span>", "TEST");
			expect(result).toEqual("<body><div id=\"root\">TEST</div><span>");
		});
	});

	describe("replaceRelativePaths", () => {
		it("prepends relative paths", () => {
			let result = replaceRelativePaths("<body><script href=\"/test\"></script><span>");
			expect(result).toEqual("<body><script href=\"/consultations/test\"></script><span>");
		});
		it("doesn't prepend for double slash URLs", () => {
			let result = replaceRelativePaths("<body><script href=\"//cdn.\"></script><span>");
			expect(result).toEqual("<body><script href=\"//cdn.\"></script><span>");
		});
	});

	describe("replaceAccountsEnvironment", () => {
		it("replaces supplied environment variable", () => {
			let result = replaceAccountsEnvironment(`<script data-environment="Beta"
			data-search="/search?q=%term" data-typeaheadtype="remote" </script>`, "Live");
			expect(result).toContain(`data-environment="Live"`);
		});

		it("replaces supplied environment variable", () => {
			let result = replaceAccountsEnvironment(`<script data-environment=""
			data-search="/search?q=%term" data-typeaheadtype="remote" </script>`, "Live");
			expect(result).toContain(`data-environment="Live"`);
		});
	});
});
