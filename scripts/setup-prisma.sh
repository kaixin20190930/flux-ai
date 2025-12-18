#!/bin/bash

echo "🔧 Setting up Prisma..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
echo "y" | npx prisma@7.1.0 generate

echo "✅ Prisma setup complete!"
echo ""
echo "Next steps:"
echo "1. Set DATABASE_URL in .env.local"
echo "2. Run: npx prisma migrate dev --name init"
