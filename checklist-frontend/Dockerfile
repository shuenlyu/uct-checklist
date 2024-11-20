# pull official base image
FROM node:16.20.2 

# set working directory
WORKDIR /checklist-frontend

# install app dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps
#RUN npm install
RUN npm list

# add app
COPY . .

#Build the app
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
RUN echo $NODE_ENV
RUN if [ "$NODE_ENV" = "production" ]; \
    then npm run build:prod; \
    else npm run build:dev; \
    fi

RUN npm install -g serve
# start app
CMD ["serve", "-s", "build", "-l", "3000"]
