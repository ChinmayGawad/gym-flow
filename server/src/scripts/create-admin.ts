import { auth } from '../lib/auth';
import { prisma } from '../lib/db';

async function main() {
  const args = process.argv.slice(2);
  
  const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1];
  const passwordArg = args.find((a) => a.startsWith('--password='))?.split('=')[1];
  const nameArg = args.find((a) => a.startsWith('--name='))?.split('=')[1];

  const email = emailArg || process.env.ADMIN_EMAIL || 'admin@gymflow.com';
  const password = passwordArg || process.env.ADMIN_PASSWORD || 'Admin123456!';
  const name = nameArg || process.env.ADMIN_NAME || 'Gym Head Admin';

  console.log(`[Admin Provisioning] Setting up verified admin credentials...`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Name:     ${name}`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (existingUser) {
      // Remove old user & account to cleanly recreate with updated password
      await prisma.account.deleteMany({ where: { userId: existingUser.id } });
      await prisma.session.deleteMany({ where: { userId: existingUser.id } });
      await prisma.plannedVisit.deleteMany({ where: { userId: existingUser.id } });
      await prisma.visitLog.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
      console.log(`Cleared existing record for '${email}' to reset credentials.`);
    }

    // Register user fresh via Better Auth API
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (res?.user) {
      // Ensure role is admin and plan is elite
      await prisma.user.update({
        where: { id: res.user.id },
        data: {
          role: 'admin',
          plan: 'elite',
          planStatus: 'active',
        },
      });
      console.log(`✅ Admin user successfully provisioned and verified! (ID: ${res.user.id})`);
    } else {
      console.error('❌ Failed to provision admin user.');
    }

    // Also verify default member account
    const memberEmail = 'member@gymflow.com';
    const existingMember = await prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!existingMember) {
      const memberRes = await auth.api.signUpEmail({
        body: {
          email: memberEmail,
          password: 'Member123456!',
          name: 'Chinmay Gawad',
        },
      });
      if (memberRes?.user) {
        await prisma.user.update({
          where: { id: memberRes.user.id },
          data: { role: 'user', plan: 'pro', planStatus: 'active' },
        });
        console.log(`✅ Default member user provisioned! (ID: ${memberRes.user.id})`);
      }
    }
  } catch (error) {
    console.error('❌ Error provisioning admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
