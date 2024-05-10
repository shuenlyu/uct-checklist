# pull official base image
FROM node:latest 

# set working directory
WORKDIR /checklist-frontend

# install app dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# add app
COPY . .

#Build the app
RUN npm run build

RUN npm install -g serve
# start app
CMD ["serve", "-s", "build", "-l", "3000"]
