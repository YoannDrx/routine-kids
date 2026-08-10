import { CheckEmailCard } from "@/components/auth/check-email-card";

type CheckEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const email = first(params.email);
  const requestedCallback = first(params.callbackUrl) ?? "/settings";
  const callbackUrl =
    requestedCallback.startsWith("/") && !requestedCallback.startsWith("//")
      ? requestedCallback
      : "/settings";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <CheckEmailCard email={email} callbackUrl={callbackUrl} />
    </main>
  );
}
