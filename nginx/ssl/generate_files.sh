openssl genpkey -algorithm RSA -out 10.6.2.248.key -pkeyopt rsa_keygen_bits:2048

openssl req -new -key 10.6.2.248.key -out 10.6.2.248.csr

openssl x509 -req -in 10.6.2.248.csr -signkey 10.6.2.248.key -out 10.6.2.248.crt -days 365
