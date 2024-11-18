FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf

#ENSURE the SSL directory exists
COPY ssl/10.6.2.248.crt /etc/nginx/ssl/10.6.2.248.crt
COPY ssl/10.6.2.248.key /etc/nginx/ssl/10.6.2.248.key

#expose 443 for frontend code
EXPOSE 443

#expose 8443 for backend code
EXPOSE 8443

CMD ["nginx", "-g", "daemon off;"]
