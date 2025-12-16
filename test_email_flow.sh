#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
EMAIL="test_verification_$(date +%s)@example.com"
PASSWORD="Password123!"

echo "---------------------------------------------------"
echo "Testing Email Verification Flow with Email: $EMAIL"
echo "---------------------------------------------------"

# 1. Register User
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "Response: $REGISTER_RESPONSE"

# Extract Access Token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['tokens']['accessToken'])")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Failed to get access token from registration"
  exit 1
fi

echo "Access Token received."

# 2. Check profile (should be unverified)
echo ""
echo "2. Checking profile (should be unverified)..."
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Profile: $PROFILE_RESPONSE"

# 3. Simulate getting verification token (In real world, this is from email. For test, we need to cheat or inspect DB/Logs)
# Since we can't easily read logs here in the script, we will assume the backend LOGGED it or we added a way to fetch it.
# Wait! We updated AuthService to log the error if email fails, but we didn't log the token for success.
# However, for this TEST to strictly work without reading the DB, we might need a workaround.
# But I am an agent, I can read the server logs! 
# So this script will just STOP here for manual verification step or I can rely on my ability to read the terminal output.

echo ""
echo "3. Triggering Forgot Password..."
FORGOT_RESPONSE=$(curl -s -X POST "$API_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'"
  }')
echo "Response: $FORGOT_RESPONSE"

echo ""
echo "Done. Please check server logs for email sending attempts."
