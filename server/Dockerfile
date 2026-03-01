FROM node:25-alpine3.22

WORKDIR /app

COPY package.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]
EXPOSE 3000