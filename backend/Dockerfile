FROM node:20-alpine

# ffmpeg for audio extraction from answer videos
RUN apk add --no-cache python3 make g++ ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]