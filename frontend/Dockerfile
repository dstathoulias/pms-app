# Stage 1: Build the React app
FROM node:22-alpine AS build
WORKDIR /app

# --- CRITICAL SECTION STARTS ---
# 1. Catch the variables sent from docker-compose
ARG VITE_USER_API_URL
ARG VITE_TEAM_API_URL
ARG VITE_TASK_API_URL

# 2. Set them as environment variables for the build
ENV VITE_USER_API_URL=$VITE_USER_API_URL
ENV VITE_TEAM_API_URL=$VITE_TEAM_API_URL
ENV VITE_TASK_API_URL=$VITE_TASK_API_URL
# --- CRITICAL SECTION ENDS ---

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5004
CMD ["nginx", "-g", "daemon off;"]