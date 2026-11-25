import { auth } from "@/auth";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Profile Settings | BuildTrack Enterprise",
  description: "Operator Profile, Security Keys, and Personal Dispatch Preferences",
};

export default async function ProfileSettingsPage() {
  const session = await auth();

  return (
    <ProfileForm
      initialUser={{
        name: session?.user?.name,
        email: session?.user?.email,
        role: (session?.user as any)?.role,
      }}
    />
  );
}
