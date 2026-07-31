// /* eslint-disable no-console */
// import { PrismaClient, Role } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// async function main() {
//   console.log("🌱 Seeding database...");

//   // Seed super admin
//   const superAdminPassword = await bcrypt.hash("12345678", 12);
//   const superAdmin = await prisma.user.upsert({
//     where: { email: "superadmin@yopmail.com" },
//     update: {},
//     create: {
//       email: "superadmin@yopmail.com",
//       name: "Super Admin",
//       password: superAdminPassword,
//       role: Role.SUPER_ADMIN,
//       isEmailVerified: true,
//       isActive: true,
//     },
//   });
//   console.log(`✅ Super Admin seeded: ${superAdmin.email}`);

//   // Seed admin
//   const adminPassword = await bcrypt.hash("Admin@123", 12);
//   const admin = await prisma.user.upsert({
//     where: { email: "admin@example.com" },
//     update: {},
//     create: {
//       email: "admin@example.com",
//       name: "Admin User",
//       password: adminPassword,
//       role: Role.SUPER_ADMIN,
//       isEmailVerified: true,
//       isActive: true,
//     },
//   });
//   console.log(`✅ Admin seeded: ${admin.email}`);

//   // Seed regular user
//   const userPassword = await bcrypt.hash("User@123", 12);
//   const user = await prisma.user.upsert({
//     where: { email: "user@example.com" },
//     update: {},
//     create: {
//       email: "user@example.com",
//       name: "Regular User",
//       password: userPassword,
//       role: Role.USER,
//       isEmailVerified: true,
//       isActive: true,
//     },
//   });
//   console.log(`✅ User seeded: ${user.email}`);

//   console.log("\n🎉 Seeding complete!");
//   console.log("Default credentials:");
//   console.log("  superadmin@example.com / SuperAdmin@123");
//   console.log("  admin@example.com / Admin@123");
//   console.log("  user@example.com / User@123");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seeding failed:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });



import {Role} from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";

export const initiateSuperAdmin = async () => {
  const superAdmins = [
    {
      name: "Super Admin",
      email: "superadmin@yopmail.com",
      password: "12345678",
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
    {
      name: "Admin",
      email: "swedishkris004@gmail.com",
      password: "12345678",
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  ];

  for (const adminData of superAdmins) {
    const existingSuperAdmin = await prisma.user.findUnique({
      where: {
        email: adminData.email,
      },
      select: { id: true },
    });

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    if (existingSuperAdmin) {
      await prisma.user.update({
        where: { email: adminData.email },
        data: {
          password: hashedPassword,
          role: adminData.role,
          isEmailVerified: true,
          isActive: true,
        },
      });
      console.log(`✅ Super Admin updated: ${adminData.email}`);
    } else {
      await prisma.user.create({
        data: {
          name: adminData.name,
          email: adminData.email,
          password: hashedPassword,
          role: adminData.role,
          isEmailVerified: adminData.isEmailVerified,
          isActive: adminData.isActive,
        },
      });
      console.log(`✅ Super Admin seeded: ${adminData.email}`);
    }
  }
};

export const initiateOthersCategory = async () => {
  const existing = await prisma.category.findFirst({
    where: {
      OR: [
        { title: { equals: "Others", mode: "insensitive" } },
        { title: { equals: "Other", mode: "insensitive" } },
      ],
    },
  });

  if (existing) {
    if (!(existing as any).isSystem) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { isSystem: true } as any,
      });
    }
    return existing;
  }

  const category = await prisma.category.create({
    data: {
      title: "Others",
      subtitle: "General inquiries and miscellaneous questions",
      isSystem: true,
      subcategories: {
        create: [
          {
            title: "Others",
          },
        ],
      },
    } as any,
  });

  console.log("✅ System 'Others' category initiated");
  return category;
};

async function main() {
  console.log("🌱 Seeding database...");
  await initiateSuperAdmin();
  await initiateOthersCategory();
  console.log("\n🎉 Seeding complete!");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("❌ Seeding failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

