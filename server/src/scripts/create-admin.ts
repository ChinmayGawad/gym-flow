import { auth } from '../lib/auth';
import { prisma } from '../lib/db';

async function main() {
  const args = process.argv.slice(2);
  
  const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1];
  const passwordArg = args.find((a) => a.startsWith('--password='))?.split('=')[1];
  const nameArg = args.find((a) => a.startsWith('--name='))?.split('=')[1];

  const email = emailArg || process.env.ADMIN_EMAIL || 'admin@gymflow.com';
  const password = passwordArg || process.env.ADMIN_PASSWORD || 'Admin123456!';
  const name = nameArg || process.env.ADMIN_NAME || 'Gym Admin';

  console.log(`[Admin Provisioning] Creating admin user on backend...`);
  console.log(`Email: ${email}`);
  console.log(`Name:  ${name}`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists, elevate role to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
      });
      console.log(`✅ Existing user '${email}' elevated to ADMIN role (ID: ${updatedUser.id})`);
      process.exit(0);
    }

    // Register user via Better Auth API with role: "admin"
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role: 'admin',
      },
    });

    if (res?.user) {
      // Ensure role is set to admin in database
      await prisma.user.update({
        where: { id: res.user.id },
        data: { role: 'admin' },
      });
      console.log(`✅ Admin user successfully created on backend! (ID: ${res.user.id})`);
    } else {
      console.error('❌ Failed to create admin user.');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
