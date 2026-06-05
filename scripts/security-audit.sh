#!/bin/bash
echo "Running dependency vulnerability audit..."
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "High-severity vulnerabilities found. Blocking CI/CD pipeline."
  exit 1
fi
echo "No high-severity vulnerabilities found."
exit 0
