# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src
COPY ["task_service.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Run Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app
RUN apk add --no-cache icu-libs krb5-libs libgcc libintl libssl3 libstdc++ zlib
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "task_service.dll"]