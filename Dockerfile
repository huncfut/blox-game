FROM node:slim

RUN mkdir -p /server
COPY server.js /server/.
COPY physics.js /server/.
COPY env.js /server/.
COPY combatUtils.js /server/.
COPY collisionUtils.js /server/.
COPY package.json /server/.

RUN mkdir -p /server/public
COPY public/index.html /server/public/

RUN mkdir -p /server/public/js
COPY public/js/* /server/public/js/

WORKDIR /server

RUN npm i

EXPOSE 8080
EXPOSE 8082

CMD ["npm", "start"]
