import { auth } from "@/auth";

export default auth((req) => {
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/courses", "/courses/:path*", "/learn/:path*", "/tutor", "/tutor/:path*", "/progress", "/progress/:path*", "/profile", "/profile/:path*"],
};
