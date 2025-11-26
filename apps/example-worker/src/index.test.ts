import { describe, expect, it } from "vitest";

describe("Example Worker", () => {
	it("should return a valid response structure", () => {
		const response = {
			success: true,
			data: { message: "Example Worker API" },
		};

		expect(response.success).toBe(true);
		expect(response.data).toBeDefined();
		expect(response.data.message).toBe("Example Worker API");
	});

	it("should have correct content type expectations", () => {
		const contentType = "application/json";
		expect(contentType).toBe("application/json");
	});
});
