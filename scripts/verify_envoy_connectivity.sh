#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${BASE_URL:-http://127.0.0.1:8080}}"
USER_ID="${2:-${USER_ID:-demo-user}}"

call_json() {
  local endpoint="$1"
  local payload="$2"

  curl -sS -w "\n%{http_code}" \
    -X POST "${BASE_URL}/appointment.v1.AppointmentService/${endpoint}" \
    -H 'Content-Type: application/json' \
    -d "${payload}"
}

extract_code() {
  local response="$1"
  printf '%s' "${response##*$'\n'}"
}

extract_body() {
  local response="$1"
  printf '%s' "${response%$'\n'*}"
}

assert_ok() {
  local code="$1"
  local body="$2"
  local action="$3"

  if [[ "$code" != "200" ]]; then
    echo "[FAIL] ${action} returned HTTP ${code}"
    echo "${body}"
    exit 1
  fi
}

start_epoch=$(( $(date -u +%s) + 86400 + (RANDOM % 86400) ))
end_epoch=$(( start_epoch + 3600 ))
start_time="$(date -u -d "@${start_epoch}" '+%Y-%m-%dT%H:%M:%SZ')"
end_time="$(date -u -d "@${end_epoch}" '+%Y-%m-%dT%H:%M:%SZ')"
run_id="$(date -u +%s)-$RANDOM"
title="smoke-e2e-${run_id}"

create_payload=$(cat <<JSON
{"userId":"${USER_ID}","title":"${title}","description":"envoy e2e smoke test","startTime":"${start_time}","endTime":"${end_time}","location":"test-lab","attendees":[]}
JSON
)

create_response="$(call_json "CreateAppointment" "${create_payload}")"
create_code="$(extract_code "${create_response}")"
create_body="$(extract_body "${create_response}")"
assert_ok "${create_code}" "${create_body}" "CreateAppointment"

appointment_id="$(printf '%s' "${create_body}" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
if [[ -z "${appointment_id}" ]]; then
  echo "[FAIL] Could not parse appointment id from CreateAppointment response"
  echo "${create_body}"
  exit 1
fi

list_payload="{\"userId\":\"${USER_ID}\",\"limit\":100}"
list_response="$(call_json "ListAppointments" "${list_payload}")"
list_code="$(extract_code "${list_response}")"
list_body="$(extract_body "${list_response}")"
assert_ok "${list_code}" "${list_body}" "ListAppointments"

if [[ "${list_body}" != *"${title}"* ]]; then
  echo "[FAIL] Created appointment title not found in ListAppointments response"
  echo "${list_body}"
  exit 1
fi

delete_payload="{\"id\":\"${appointment_id}\"}"
delete_response="$(call_json "DeleteAppointment" "${delete_payload}")"
delete_code="$(extract_code "${delete_response}")"
delete_body="$(extract_body "${delete_response}")"
assert_ok "${delete_code}" "${delete_body}" "DeleteAppointment"

echo "[PASS] Envoy end-to-end connectivity verified (${title}, id=${appointment_id})"
