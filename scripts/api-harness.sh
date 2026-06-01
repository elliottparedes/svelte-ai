#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5173}"
OUT_DIR="${OUT_DIR:-logs/curl-tests}"
mkdir -p "$OUT_DIR"

EMAIL="${HARNESS_EMAIL:-curlharness_$(date +%s)@example.com}"
PASSWORD="${HARNESS_PASSWORD:-pass1234}"
COOKIE_JAR="$OUT_DIR/harness.cookies.txt"

echo "== API harness =="
echo "BASE_URL=$BASE_URL"
echo "OUT_DIR=$OUT_DIR"
echo "EMAIL=$EMAIL"

curl -sS -c "$COOKIE_JAR" -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/v1/auth/signup" \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Harness User\"}" \
  > "$OUT_DIR/signup.json"

run_chat() {
  local name="$1"
  local payload="$2"
  local out="$OUT_DIR/$name.sse"
  local started="$SECONDS"
  curl -sS -N -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -X POST "$BASE_URL/api/v1/chat" --data "$payload" > "$out"
  local elapsed=$((SECONDS - started))
  echo "$elapsed" > "$OUT_DIR/$name.meta"
  echo "$out"
}

summary_metric() {
  local label="$1"
  local file="$2"
  local web fetch title err
  web=$(awk '/"type":"tool_call","name":"web_search"/{c++} END{print c+0}' "$file")
  fetch=$(awk '/"type":"tool_call","name":"fetch_url"/{c++} END{print c+0}' "$file")
  title=$(awk '/"type":"title"/{c++} END{print c+0}' "$file")
  err=$(awk '/"type":"error"/{c++} END{print c+0}' "$file")
  echo "[$label] web_search=$web fetch_url=$fetch title_events=$title errors=$err"
}

NEWS_PAYLOAD='{"message":"What are the three biggest AI news stories from the last 24 hours? Give a concise summary with source URLs.","enabledToolNames":["web_search","fetch_url","datetime"]}'
SEC_PAYLOAD='{"message":"Give me a quick update on major tech security incidents this week, with at least two different source domains and citations.","enabledToolNames":["web_search","fetch_url","datetime"]}'
TITLE_PAYLOAD='{"message":"Write a short haiku about debugging late at night.","enabledToolNames":[]}'

NEWS_FILE="$(run_chat chat_news "$NEWS_PAYLOAD")"
SEC_FILE="$(run_chat chat_security "$SEC_PAYLOAD")"
TITLE_FILE="$(run_chat chat_title_check "$TITLE_PAYLOAD")"

summary_metric "news" "$NEWS_FILE"
summary_metric "security" "$SEC_FILE"
summary_metric "title" "$TITLE_FILE"

echo
echo "== Summary model check (connectivity) =="
if npm run -s summary:ping > "$OUT_DIR/summary_ping.log" 2>&1; then
  echo "summary:ping OK"
else
  echo "summary:ping FAILED (see $OUT_DIR/summary_ping.log)"
  exit 1
fi

echo
echo "== Summary model check (service-level) =="
if npm run -s summary:test > "$OUT_DIR/summary_test.log" 2>&1; then
  echo "summary:test OK"
else
  echo "summary:test FAILED (see $OUT_DIR/summary_test.log)"
  exit 1
fi

if [[ "${HARNESS_CHECK_SUMMARY_STREAM:-false}" == "true" ]]; then
  echo
  echo "== Runtime summary SSE check =="
  CONV_ID=""
  MAX_TURNS="${HARNESS_SUMMARY_MAX_TURNS:-24}"
  for i in $(seq 1 "$MAX_TURNS"); do
    if [[ -n "$CONV_ID" ]]; then
      PAYLOAD="{\"conversationId\":\"$CONV_ID\",\"message\":\"ping $i\",\"enabledToolNames\":[]}"
    else
      PAYLOAD='{"message":"start summary stream check","enabledToolNames":[]}'
    fi
    FILE="$(run_chat "summary_stream_$i" "$PAYLOAD")"
    if awk '/Free tier allows 20 chats/{found=1} END{exit found?0:1}' "$FILE"; then
      echo "summary runtime check blocked by free-tier quota before threshold was reached"
      echo "use a Pro/Standard account or temporarily lower CHAT_SUMMARY_INTERVAL/HOT_TAIL in test env"
      exit 1
    fi
    if [[ -z "$CONV_ID" ]]; then
      CONV_ID="$(awk 'match($0, /"conversationId":"[^"]+"/){print substr($0,RSTART,RLENGTH); exit}' "$FILE" | sed -E 's/.*"conversationId":"([^"]+)".*/\1/' || true)"
    fi
    if awk '/"type":"summary_done"/{found=1} END{exit found?0:1}' "$FILE"; then
      echo "summary_done observed on iteration $i ($FILE)"
      break
    fi
    if [[ "$i" -eq "$MAX_TURNS" ]]; then
      echo "summary_done not observed in $MAX_TURNS turns (check logs and CHAT_SUMMARY_* settings)"
      exit 1
    fi
  done
fi

echo
echo "== Scoreboard =="
node ./node_modules/tsx/dist/cli.mjs scripts/api-harness-scoreboard.ts "$OUT_DIR"

echo
echo "Harness complete. Artifacts:"
echo "  $OUT_DIR/chat_news.sse"
echo "  $OUT_DIR/chat_security.sse"
echo "  $OUT_DIR/chat_title_check.sse"
echo "  $OUT_DIR/summary_ping.log"
echo "  $OUT_DIR/summary_test.log"
