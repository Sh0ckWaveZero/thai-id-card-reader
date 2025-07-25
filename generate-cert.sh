#!/bin/bash

# Generate self-signed certificate for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=TH/ST=Bangkok/L=Bangkok/O=ThaiIDCardReader/CN=localhost"

echo "Certificate generated successfully!"
echo "Files created: cert.pem, key.pem"