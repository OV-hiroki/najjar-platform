import { auth }         from "@/lib/auth";
import { redirect }     from "next/navigation";
import { prisma }       from "@/lib/prisma";
import PlatformLayout  from "@/components/layout/PlatformLayout";
import WalletClient    from "./WalletClient";

export default async function WalletPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { balance: true, phone: true },
  });

  const invoices = await prisma.invoice.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take:    20,
    include: { items: { include: { course: { select: { title: true } } } } },
  });

  const transactions = await prisma.walletTransaction.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take:    15,
  });

  return (
    <PlatformLayout showBack>
      <WalletClient
        balance={user?.balance ?? 0}
        phone={user?.phone ?? ""}
        invoices={invoices as never}
        transactions={transactions as never}
      />
    </PlatformLayout>
  );
}
