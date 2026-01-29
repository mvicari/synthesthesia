#!/bin/bash
export CTX7_API_KEY="ctx7sk-0b4133a9-3ba4-480e-ad97-73fc9b48ec22"
LOG_FILE="/tmp/ctx7_debug.log"
echo "--- Wrapper started $(date) ---" >> $LOG_FILE
echo "Key prefix: ${CTX7_API_KEY:0:10}..." >> $LOG_FILE
# Use a temporary pipe to capture input and output
tee -a $LOG_FILE | npx -y @upstash/context7-mcp@latest --api-key "$CTX7_API_KEY" "$@" 2>>$LOG_FILE | tee -a $LOG_FILE
