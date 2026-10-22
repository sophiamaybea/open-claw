FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
USER node
ENV NODE_ENV=production PORT=8081 HOST=0.0.0.0
EXPOSE 8081
CMD ["node", "server.mjs"]
