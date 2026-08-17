import { AuthForm } from "@/components/auth/auth-form";
import { isTransactionalEmailConfigured } from "@/lib/email";

type SignUpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const readParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const callbackUrl = readParam(params.callbackUrl);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForm
        mode="sign-up"
        callbackUrl={callbackUrl}
        requireEmailVerification={isTransactionalEmailConfigured()}
      />
    </main>
  );
}
