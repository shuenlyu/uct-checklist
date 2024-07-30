FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf

#ENSURE the SSL directory exists
COPY ssl/checklistgen.uct.com.crt /etc/nginx/ssl/checklistgen.uct.com.crt
COPY ssl/checklistgen.uct.com.key /etc/nginx/ssl/checklistgen.uct.com.key

#expose 443 for frontend code
EXPOSE 443

#expose 8443 for backend code
EXPOSE 8443

CMD ["nginx", "-g", "daemon off;"]
