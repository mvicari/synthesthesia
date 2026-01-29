#!/bin/bash
LOG_FILE="/tmp/context7_mcp.log"
echo "--- Starting MCP Server ---" >> $LOG_FILE
echo "Args: $@" >> $LOG_FILE
echo "Env: CTX7_API_KEY=$CTX7_API_KEY" >> $LOG_FILE
npx -y @upstash/context7-mcp@latest --api-key "$CTX7_API_KEY" 2>>$LOG_FILE | tee -a $LOG_FILE
