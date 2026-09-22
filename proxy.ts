import { auth } from "@/auth";

export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/teams/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
