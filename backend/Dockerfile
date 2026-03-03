FROM php:8.2-apache

# Cache bust to force fresh layers
ARG CACHE_BUST=1

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Fix MPM: remove all MPMs except prefork, then enable needed modules
RUN rm -f /etc/apache2/mods-enabled/mpm_event.load /etc/apache2/mods-enabled/mpm_event.conf \
       /etc/apache2/mods-enabled/mpm_worker.load /etc/apache2/mods-enabled/mpm_worker.conf \
    && a2enmod mpm_prefork rewrite headers

# Configure Apache: allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Railway uses PORT env var
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
    && sed -i 's/:80/:${PORT}/' /etc/apache2/sites-available/000-default.conf

# Copy backend files (Railway builds from git root, so copy backend/ contents)
COPY backend/ /var/www/html/

# Create upload dirs
RUN mkdir -p /var/www/html/uploads/products \
             /var/www/html/uploads/attendance \
             /var/www/html/uploads/tasks \
    && chmod -R 777 /var/www/html/uploads

ENV PORT=8080
EXPOSE 8080
CMD ["apache2-foreground"]
