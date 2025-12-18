#!/bin/bash

# Script to run Prisma migration manually
# This is a workaround for npm cache issues

echo "🔧 Running Prisma Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env.local file"
    exit 1
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "📊 Database URL: ${DATABASE_URL}"
echo ""

# Check if PostgreSQL is accessible
echo "🔍 Checking PostgreSQL connection..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Cannot connect to PostgreSQL database"
    echo ""
    echo "Please ensure:"
    echo "  1. PostgreSQL is running"
    echo "  2. DATABASE_URL in .env.local is correct"
    echo "  3. Database 'fluxai' exists"
    echo ""
    echo "To create the database, run:"
    echo "  psql -U user -h localhost -c 'CREATE DATABASE fluxai;'"
    exit 1
fi

echo "✅ PostgreSQL connection successful"
echo ""

# Run the migration SQL
echo "🚀 Running migration SQL..."
psql "$DATABASE_URL" -f prisma/migrations/20241204_init/migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 Verifying tables..."
    psql "$DATABASE_URL" -c "\dt"
    echo ""
    echo "✨ Database setup complete!"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
