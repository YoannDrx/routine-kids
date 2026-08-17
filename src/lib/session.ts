import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const getSession = async () =>
  auth.api.getSession({
    headers: await headers(),
  });

export const getRequiredUser = async () => {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  return session.user;
};

export const getRequiredAdmin = async () => {
  const user = await getRequiredUser();

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
};
