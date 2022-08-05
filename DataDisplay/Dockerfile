FROM node:16
ENV NODE_ENV=development
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# Remove the `&& mv node_modules ../` from the RUN command:
# RUN npm install --production --silent && mv node_modules ../
RUN npm install --development --silent
COPY . .
CMD npm run dev