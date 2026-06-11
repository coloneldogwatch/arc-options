#!/bin/bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://djlxboifuhkhcwqopknr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbHhib2lmdWhraGN3cW9wa25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NzM5MjEsImV4cCI6MjA5NjQ0OTkyMX0.7aMGnCsQKPdHD78GCVXRHCR8q0c5cFZepdiC0ZDN0vo
DATABASE_URL=postgresql://postgres.djlxboifuhkhcwqopknr:anHEYFVv8WMo%2ARZ%24@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL_DIRECT=postgresql://postgres.djlxboifuhkhcwqopknr:anHEYFVv8WMo%2ARZ%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres
TRADIER_API_KEY=your_sandbox_api_key_here
TRADIER_BASE_URL=https://sandbox.tradier.com/v1
ANTHROPIC_API_KEY=your_anthropic_api_key_here
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
STRIPE_PRO_PRICE_ID=price_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
EOF
echo "✓ .env.local created"
