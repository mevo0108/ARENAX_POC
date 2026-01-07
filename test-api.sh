#!/bin/bash
# Example test script for ARENAX API
# This script demonstrates the complete user flow

API_URL="http://localhost:3000"

echo "=== ARENAX API Test Script ==="
echo ""

# 1. Register User 1
echo "1. Registering User 1..."
REGISTER1=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","email":"player1@test.com","password":"pass123"}')
echo "$REGISTER1" | jq '.'
TOKEN1=$(echo "$REGISTER1" | jq -r '.token')
echo ""

# 2. Register User 2
echo "2. Registering User 2..."
REGISTER2=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player2","email":"player2@test.com","password":"pass123"}')
echo "$REGISTER2" | jq '.'
TOKEN2=$(echo "$REGISTER2" | jq -r '.token')
echo ""

# 3. Get User 1 Profile
echo "3. Getting User 1 Profile..."
curl -s -X GET $API_URL/api/users/profile \
  -H "Authorization: Bearer $TOKEN1" | jq '.'
echo ""

# 4. Create a Game (User 1)
echo "4. Creating a game with Leeches API..."
GAME=$(curl -s -X POST $API_URL/api/games \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"externalApi":"leeches"}')
echo "$GAME" | jq '.'
GAME_LINK=$(echo "$GAME" | jq -r '.game.gameLink')
echo ""

# 5. User 2 Joins Game
echo "5. User 2 joining the game..."
curl -s -X POST $API_URL/api/games/$GAME_LINK/join \
  -H "Authorization: Bearer $TOKEN2" | jq '.'
echo ""

# 6. Get Game Details
echo "6. Getting game details..."
curl -s -X GET $API_URL/api/games/$GAME_LINK \
  -H "Authorization: Bearer $TOKEN1" | jq '.'
echo ""

# 7. Submit Game Result
echo "7. Submitting game result..."
curl -s -X POST $API_URL/api/games/$GAME_LINK/result \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "winnerId": 1,
    "playerResults": [
      {"userId": 1, "score": 150, "result": "won"},
      {"userId": 2, "score": 90, "result": "lost"}
    ],
    "gameData": {"duration": 2400, "rounds": 15}
  }' | jq '.'
echo ""

# 8. Get User 1 Game History
echo "8. Getting User 1 game history..."
curl -s -X GET $API_URL/api/users/games \
  -H "Authorization: Bearer $TOKEN1" | jq '.'
echo ""

# 9. Get User 2 Game History
echo "9. Getting User 2 game history..."
curl -s -X GET $API_URL/api/users/games \
  -H "Authorization: Bearer $TOKEN2" | jq '.'
echo ""

echo "=== Test Complete ==="
