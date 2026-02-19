import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/actions";
import { getProfile } from "@/lib/profile/actions";
import { UserProvider } from "@/contexts/UserContext";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();

  return (
    <UserProvider user={user} profile={profile}>
      {children}
    </UserProvider>
  );
}
