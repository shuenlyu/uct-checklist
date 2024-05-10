FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf

#ENSURE the SSL directory exists
COPY ssl/local.example.com.crt /etc/nginx/ssl/local.example.com.crt
COPY ssl/local.example.com.key /etc/nginx/ssl/local.example.com.key

#expose 443 for frontend code
EXPOSE 443

#expose 8443 for backend code
EXPOSE 8443

CMD ["nginx", "-g", "daemon off;"]