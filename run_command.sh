sudo docker run -it -d --name surveyjs-frontend -p 5002:3000 -h 0.0.0.0 -v /home/shuen.lyu/uct-projects/uct-checklist:/uct-checklist node:latest

sudo docker run -it -d --name surveyjs-backend -p 3002:3002 -h 0.0.0.0 -v /home/shuen.lyu/uct-projects/uct-checklist:/uct-checklist node:16.13.2


