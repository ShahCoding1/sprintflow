import { auth } from "@/auth";

export const sessionService = {
  async getCurrentUser() {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    };
  },
};