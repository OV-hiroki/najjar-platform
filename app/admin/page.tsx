import { auth }   from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma }   from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/platform/dashboard");

  const [users, courses, invoices, txTotal] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.invoice.count(),
    prisma.walletTransaction.aggregate({
      where: { status: "CONFIRMED", type: { not: "PURCHASE" } },
      _sum:  { amount: true },
    }),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id:true, name:true, phone:true, balance:true, role:true, createdAt:true },
  });

  return (
    <div className="min-h-screen bg-navy text-white p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-2">لوحة التحكم</h1>
        <p className="text-white/40 text-sm mb-8">مرحباً، {session.user.name}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { lbl:"إجمالي الطلاب",  val: users,                               icon:"ti-users"        },
            { lbl:"الكورسات النشطة", val: courses,                             icon:"ti-books"        },
            { lbl:"الفواتير",        val: invoices,                            icon:"ti-receipt"      },
            { lbl:"إجمالي الإيرادات (جنيه)", val: (txTotal._sum.amount ?? 0).toFixed(0), icon:"ti-cash" },
          ].map((s) => (
            <div key={s.lbl} className="bg-card border border-white/8 rounded-2xl p-4">
              <i className={`ti ${s.icon} text-primary text-2xl block mb-2`} />
              <div className="text-2xl font-bold">{s.val}</div>
              <div className="text-xs text-white/40 mt-1">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Recent users */}
        <div className="bg-card border border-white/8 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">آخر المسجلين</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-white/35 text-xs border-b border-white/8">
                  <th className="pb-2 pr-2">الاسم</th>
                  <th className="pb-2 px-2">الهاتف</th>
                  <th className="pb-2 px-2">الرصيد</th>
                  <th className="pb-2 px-2">الدور</th>
                  <th className="pb-2 pl-2">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="py-2.5 pr-2 font-medium">{u.name}</td>
                    <td className="py-2.5 px-2 font-mono text-xs text-white/60" dir="ltr">{u.phone}</td>
                    <td className="py-2.5 px-2 text-primary">{u.balance} ج</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-primary/20 text-primary" : "bg-white/8 text-white/50"}`}>
                        {u.role === "ADMIN" ? "أدمن" : "طالب"}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-white/40 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
