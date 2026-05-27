import { PrismaClient, CourseSubject, CourseType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(11);
  let result  = "";
  for (let i = 0; i < 11; i++) result += chars[bytes[i] % chars.length];
  return result;
}

async function main() {
  console.log("🌱 Seeding...");

  const adminPwd = await bcrypt.hash("Admin@1234", 12);
  await prisma.user.upsert({
    where:  { phone: "01000000000" },
    update: {},
    create: { name: "محمود النجار", phone: "01000000000", password: adminPwd, role: "ADMIN" },
  });

  const studPwd = await bcrypt.hash("Student@123", 12);
  const student = await prisma.user.upsert({
    where:  { phone: "01011422035" },
    update: {},
    create: { name: "ادهم محمد عبدالرحيم", phone: "01011422035", password: studPwd, balance: 500 },
  });

  const courses = [
    { id:"seed-1", title:"المراجعة النهائية الشاملة — فيزياء كاملة 💯",           subject:CourseSubject.ALL,  type:CourseType.FINAL_FULL, price:350, oldPrice:450, startDate:new Date("2026-04-07"), endDate:new Date("2026-05-20"), order:1 },
    { id:"seed-2", title:"كورس الميكانيكا كاملة 🔧",                               subject:CourseSubject.MECH, type:CourseType.LECTURE,    price:120, oldPrice:299, startDate:new Date("2026-02-23"), endDate:new Date("2026-04-15"), order:2 },
    { id:"seed-3", title:"الكهرباء والمغناطيسية كاملة + الورشة ⚡",               subject:CourseSubject.ELEC, type:CourseType.WORKSHOP,   price:80,  oldPrice:300, startDate:new Date("2026-01-12"), endDate:new Date("2026-04-15"), order:3 },
    { id:"seed-4", title:"معسكر النجار ✅ (مراجعة ثلثي المنهج) 🎁",               subject:CourseSubject.ALL,  type:CourseType.CAMP,       price:60,  oldPrice:149, startDate:new Date("2025-12-21"), endDate:new Date("2026-04-15"), order:4 },
    { id:"seed-5", title:"الموجات والصوت كاملاً + الورشة 🌊",                     subject:CourseSubject.WAVES,type:CourseType.WORKSHOP,   price:120, oldPrice:299, startDate:new Date("2025-10-29"), endDate:new Date("2026-04-15"), order:5 },
    { id:"seed-6", title:"الضوء والبصريات + الورشة 🔬",                           subject:CourseSubject.WAVES,type:CourseType.WORKSHOP,   price:90,  oldPrice:315, startDate:new Date("2025-09-20"), endDate:new Date("2026-04-15"), order:6 },
    { id:"seed-7", title:"الفيزياء الحديثة كاملة + الورشة ⚛️",                   subject:CourseSubject.ELEC, type:CourseType.WORKSHOP,   price:100, oldPrice:250, order:7 },
    { id:"seed-8", title:"الاشتراك بالمحاضرة — ميكانيكا (الحصة ب ٤٥ جنيه)",    subject:CourseSubject.MECH, type:CourseType.SINGLE,     price:45,  order:8 },
  ];

  for (const c of courses) {
    await prisma.course.upsert({
      where:  { id: c.id },
      update: { ...c, isActive: true, isPublished: true, grade: "٣ ث" },
      create: { ...c, isActive: true, isPublished: true, grade: "٣ ث" },
    });
  }

  // Seed sample center codes with FIXED amounts (not derived from code)
  const sampleCodes = [
    { code: generateCode(), amount: 100 },
    { code: generateCode(), amount: 200 },
    { code: generateCode(), amount: 500 },
    { code: "NJR00000001", amount: 100 },  // known test code
  ];

  for (const cc of sampleCodes) {
    await prisma.centerCode.upsert({
      where:  { code: cc.code },
      update: {},
      create: {
        code:        cc.code,
        amount:      cc.amount,
        status:      "UNUSED",
        batchId:     "SEED-BATCH",
        createdById: "seed",
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("Test center code: NJR00000001 (100 جنيه)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
