FROM node:20-alpine
WORKDIR /app

# copy package files first to leverage docker cache
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install
COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173"]
