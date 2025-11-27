/**
 * User DTO transformers
 */

import type { User } from "@repo/db";
import { BaseDTO } from "@repo/openapi";

/**
 * User DTO with transformation utilities
 */
export class UserDTO extends BaseDTO {
	/**
	 * Transform user to API response (excludes sensitive fields)
	 */
	static toResponse(user: User) {
		return UserDTO.toDTO(user, {
			exclude: ["password", "passwordHash"],
			serializeDates: true,
			removeNulls: false,
		});
	}

	/**
	 * Transform multiple users to API responses
	 */
	static toResponses(users: User[]) {
		return UserDTO.toDTOs(users, {
			exclude: ["password", "passwordHash"],
			serializeDates: true,
			removeNulls: false,
		});
	}

	/**
	 * Transform user to public API response (minimal data)
	 */
	static toPublic(user: User) {
		return UserDTO.pick(user, ["id", "name", "email"]);
	}
}
