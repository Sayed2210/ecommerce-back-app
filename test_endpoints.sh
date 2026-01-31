#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="test$(date +%s)@example.com"
PASSWORD="password123"

echo "---------------------------------------------------"
echo "Testing API Endpoints with Email: $EMAIL"
echo "---------------------------------------------------"

# 1. Register
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'",
    "firstName": "Test",
    "lastName": "User"
  }')
echo "Response: $REGISTER_RESPONSE"

# 2. Login
echo -e "\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['tokens']['accessToken'])")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Failed to get access token"
  echo "Login Response: $LOGIN_RESPONSE"
  exit 1
fi
echo "Access Token received."

# Function to test GET endpoint
test_get_endpoint() {
  ENDPOINT=$1
  DESC=$2
  echo -e "\nTesting $DESC ($ENDPOINT)..."
  RESPONSE=$(curl -s -X GET "$BASE_URL$ENDPOINT" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  # Check for error status in response (simple check)
  if [[ $RESPONSE == *"statusCode"* && $RESPONSE != *"200"* ]]; then
     echo "FAILED"
     echo "$RESPONSE"
  else
     echo "SUCCESS (Head of response): ${RESPONSE:0:100}..."
  fi
}

# 3. Test Endpoints
test_get_endpoint "/users/me" "Get Current User"
test_get_endpoint "/users/me/wishlist" "Get Wishlist"
test_get_endpoint "/products" "Get All Products"
test_get_endpoint "/cart" "Get Cart"
test_get_endpoint "/orders" "Get Orders"
test_get_endpoint "/notifications" "Get Notifications"
test_get_endpoint "/coupons" "Get Coupons"

echo -e "\n---------------------------------------------------"
echo "Testing specific flows"
echo "---------------------------------------------------"

# 4. Search Products
echo -e "\nSearching Products..."
test_get_endpoint "/search?query=test" "Search Products"

echo -e "\nDone."
