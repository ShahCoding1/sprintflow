import bcrypt from "bcryptjs";

import { userRepository } from "@/server/repositories/user.repository";

export const authService = {
  async registerUser(data: {
    email: string;
    name?: string;
    password: string;
  }) {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await userRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  },

  async getUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  },

  async verifyPassword(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
  },
};