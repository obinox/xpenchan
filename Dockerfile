FROM node:24 

WORKDIR /app

ENV TZ=Asia/Seoul

COPY package.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "deploy:start"]


