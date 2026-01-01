# 1. Build Stage (Use .NET 10 Alpine SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src
COPY ["task_service.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# 2. Run Stage (Use .NET 10 Alpine Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app

# --- INSTALL DEPENDENCIES (This now works because we are on Alpine) ---
# krb5-libs is required to fix the "libgssapi_krb5.so.2" error
RUN apk add --no-cache icu-libs krb5-libs libgcc libintl libssl3 libstdc++ zlib
# ---------------------------------------------------------------------

COPY --from=build /app/publish .

# Force port 8080 binding
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "task_service.dll"]