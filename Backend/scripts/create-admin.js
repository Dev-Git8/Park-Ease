// One-time CLI bootstrap for the very first admin account. Nothing can be
// HTTP-gated by "is there an admin yet?" safely, so this is the unavoidable
// chicken-and-egg breaker. Every subsequent admin is created via the
// POST /api/admin/users HTTP endpoint (gated to existing admins only).
//
// Usage: node scripts/create-admin.js --email=admin@example.com --name="Admin Name" --password=SomeStrongPassword123

const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

const parseArgs = () => {
    const args = {};
    for (const arg of process.argv.slice(2)) {
        const match = arg.match(/^--([^=]+)=(.*)$/);
        if (match) args[match[1]] = match[2];
    }
    return args;
};

const main = async () => {
    const { email, name, password } = parseArgs();

    if (!email || !name || !password) {
        console.error('Usage: node scripts/create-admin.js --email=... --name="..." --password=...');
        process.exit(1);
    }
    if (password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.error(`A user with email ${email} already exists (role: ${existing.role}).`);
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
        data: { name, email, password: hashedPassword, role: 'admin' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    console.log('Admin account created:', admin);
    process.exit(0);
};

main().catch((error) => {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
});
