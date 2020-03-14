FROM node:slim

RUN mkdir -p /server
COPY server.js /server/.
COPY physics.js /server/.
COPY env.js /server/.
COPY combatUtils.js /server/.
COPY collisionUtils.js /server/.
COPY package.json /server/.

RUN mkdir -p /server/public
COPY public/* /server/

WORKDIR /server

RUN npm i

EXPOSE 8080
CMD ["npm", "start"]
